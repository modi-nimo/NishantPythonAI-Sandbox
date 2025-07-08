# This is my API Server code
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from TalkToDatabase.helper import refresh_db_schema
from TalkToDatabase.main import smart_db_team
from pydantic import BaseModel

load_dotenv()

app = FastAPI()
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

class QueryRequest(BaseModel):
    query: str

@app.post("/query_db")
def query_db(request: QueryRequest):
    """
    Endpoint to query the database with a given SQL query string.
    """
    query = request.query
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    print("Received query:", query)
    smart_db_team.run("User Question: Please give me 5 recently joined employee details")
    response = {"user_question": query,
                "generated_sql_query": smart_db_team.team_session_state["application_response"].generated_sql_query,
                "explanation": smart_db_team.team_session_state["application_response"].explanation,
                "dataframe": smart_db_team.team_session_state["application_response"].dataframe.to_dict(orient="records") if smart_db_team.team_session_state["application_response"].dataframe is not None else None}

    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000, log_level="info")