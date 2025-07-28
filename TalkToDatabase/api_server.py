# This is my API Server code
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware

from TalkToDatabase.helper import refresh_db_schema, CustomJsonEncoder
from TalkToDatabase.main import smart_db_team, ApplicationResponseModel # Import ApplicationResponseModel
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import json
import asyncio # Import asyncio
import threading # Import threading

load_dotenv()

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000", # Allow your frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify if the API server is running.
    """
    return {"response": "ok"}

@app.get("/refresh_db_schema")
def perform_refresh_db_schema():
    """
    Endpoint to refresh the database schema.
    """
    response = refresh_db_schema()
    if "failed" in response.lower():
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh the database schema. Please check the server logs for more details."
        )
    return {"response": response}

async def query_generator(query: str, update_queue: asyncio.Queue):
    # Initialize application_response and put it in team_session_state
    app_response = ApplicationResponseModel(user_question=query)
    smart_db_team.team_session_state["application_response"] = app_response
    smart_db_team.team_session_state["update_queue"] = update_queue # Pass the queue

    # Function to run smart_db_team.run() in a separate thread
    def run_team():
        try:
            resp = smart_db_team.run(f"User Question: {query}")
            if len(app_response.insights) == 0:
                app_response.insights = resp.content
            # After the team run completes, put a final message or signal
            final_response = {
                "user_question": app_response.user_question,
                "generated_sql_query": app_response.generated_sql_query,
                "explanation": app_response.explanation,
                "dataframe": app_response.dataframe.to_dict(orient="records") if app_response.dataframe is not None else None,
                "insights": app_response.insights,
                "status": "completed" # Indicate completion
            }
            update_queue.put_nowait(json.dumps(final_response, cls=CustomJsonEncoder))
        except Exception as e:
            error_message = {"error": str(e), "status": "error"}
            update_queue.put_nowait(json.dumps(error_message, cls=CustomJsonEncoder))
        finally:
            # Signal that no more data will be put into the queue
            update_queue.put_nowait(None) # Sentinel value to stop the generator

    # Start the team run in a new thread
    thread = threading.Thread(target=run_team)
    thread.start()

    # Yield data from the queue as it becomes available
    while True:
        data = await update_queue.get()
        if data is None: # Check for sentinel value
            break
        yield f"data: {data}\n\n" # SSE format

@app.get("/query_db") # Changed to GET endpoint
async def query_db(query: str): # Receive query as a query parameter
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    print("Received query:", query)

    update_queue = asyncio.Queue() # Create an async queue

    return StreamingResponse(query_generator(query, update_queue), media_type="text/event-stream")

@app.get("/database_schema")
def get_database_schema():
    """
    Endpoint to return the content of database_schema.json.
    """
    try:
        with open("database_schema.json", "r") as f:
            schema_data = json.load(f)
        return schema_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="database_schema.json not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error decoding database_schema.json.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000, log_level="info")
