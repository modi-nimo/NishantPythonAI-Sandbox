import os
import tempfile
import uuid
from datetime import datetime
from typing import Optional

import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from playwright.async_api import async_playwright
from pydantic import BaseModel, Field

# --- SETUP ---
app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Mount the 'static' directory to serve CSS and images. This is now CRITICAL.
app.mount("/static", StaticFiles(directory="static"), name="static")

# In-memory storage for pending receipt generation requests.
# This avoids saving temporary HTML files to disk.
receipt_requests = {}


# --- DATA MODEL (remains the same) ---
class ReceiptData(BaseModel):
    donor_name: str = Field(..., example="Siddhant Agrawal")
    amount: float = Field(..., gt=0, example=5001)
    date_str: str = Field(..., example="2025-08-21", description="Date in YYYY-MM-DD format")
    receipt_no: int = Field(..., example=101)
    donor_flat_no: str = Field(..., example="A-101")
    num_members: int = Field(..., gt=0, example=4)
    contact_no: Optional[str] = Field(None, example="9876543210")
    collector_name: Optional[str] = Field(None, example="Volunteer Name")
    collector_flat_no: Optional[str] = Field(None, example="B-202")


# --- NEW: Endpoint to render the HTML for Playwright ---
@app.get("/render/{token}", response_class=HTMLResponse)
async def render_receipt_html(request: Request, token: str):
    """
    This endpoint serves the dynamically generated HTML for a specific receipt request.
    It's intended to be called by the Playwright browser instance.
    """
    # Retrieve the data associated with this unique token
    template_data = receipt_requests.get(token)
    if not template_data:
        raise HTTPException(status_code=404, detail="Receipt data not found or expired.")

    # Render the Jinja2 template with the data
    return templates.get_template("receipt.html").render(template_data)


# --- UPDATED: Main endpoint to generate the image ---
@app.post("/generate-receipt")
async def create_receipt(data: ReceiptData, request: Request):
    """
    Generates a Ganpati Mandal receipt image by pointing a headless browser
    to a live, dynamically generated page on this server.
    """
    # 1. Prepare data and generate a unique token for this request
    token = str(uuid.uuid4())
    try:
        formatted_date = datetime.strptime(data.date_str, "%Y-%m-%d").strftime("%d-%m-%Y")
        formatted_amount = f"{data.amount:,.0f}"
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data format: {e}"}, 400

    template_data = data.dict()
    template_data["date"] = formatted_date
    template_data["amount_formatted"] = formatted_amount
    template_data["request"] = request

    # Store the data in our temporary in-memory dictionary
    receipt_requests[token] = template_data

    # 2. Construct the full URL for Playwright to visit
    # This assumes the server is running on localhost:8000
    render_url = f"http://127.0.0.1:8000/render/{token}"

    # 1. Define your desired path with the tilde
    user_path = f"~/PythonWorld/NishantPythonAISandbox/NishantPythonAI-Sandbox/GanpatiReceipt/Ganpati_Receipt_{template_data['receipt_no']}_{template_data['donor_name'].replace(" ","_")}.png"

    # 2. Expand it to an absolute path that Python understands
    absolute_filepath = os.path.expanduser(user_path)
    # This will turn "~/..." into "/home/nishant/..."
    print(absolute_filepath)
    # # Ensure the directory exists before trying to save the file
    # os.makedirs(os.path.dirname(absolute_filepath), exist_ok=True)

    try:
        # 3. Launch Playwright and navigate to the live URL
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1000, "height": 800})

            # CRITICAL CHANGE: Use page.goto() instead of page.set_content()
            # 'wait_until="networkidle"' ensures all assets (CSS, images, fonts) are loaded.
            await page.goto(render_url, wait_until="networkidle")

            # Locate the receipt element and take the screenshot
            receipt_element = page.locator("#receipt-container")
            await receipt_element.screenshot(path=absolute_filepath)
            await browser.close()

        # 4. Return the generated image file
        filename = f"Ganpati_Receipt_{data.receipt_no}_{data.donor_name.replace(' ', '_')}.png"
        return FileResponse(
            path=absolute_filepath,
            media_type="image/png",
            filename=filename,
        )
    finally:
        # 5. Clean up: remove the data from memory and the temporary image file from disk
        receipt_requests.pop(token, None)
        # if os.path.exists(absolute_filepath):
        #     os.remove(absolute_filepath)


# Optional: Add a root endpoint for basic info
@app.get("/")
def read_root():
    return {"message": "Ganpati Receipt Generator API is running. POST to /generate-receipt to create an image."}


# To run the app directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)