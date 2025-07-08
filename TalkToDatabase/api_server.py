# This is my API Server code
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from TalkToDatabase.main import smart_db_team

load_dotenv()

app = FastAPI()
@app.get("/health")
def health_check():
    """
    Health check endpoint to verify if the API server is running.
    """
    return {"response": "ok"}

@app.get("/refresh_db_schema")
def refresh_db_schema():
    """
    Endpoint to refresh the database schema.
    """
    response = smart_db_team.run("Refresh the database schema.")
    return {"response": str(response.content)}

@app.post("/query_db")
def query_db(query: str):
    """
    Endpoint to query the database with a given SQL query string.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    response = smart_db_team.run(query)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=str(response.content))

    return {"response": str(response.content)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000, log_level="info")