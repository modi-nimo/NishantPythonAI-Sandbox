# https://towardsdatascience.com/a-multi-agent-sql-assistant-you-can-trust-with-human-in-loop-checkpoint-llm-cost-control/
import os

from agno.agent import Agent
from agno.models.google import Gemini
from agno.team import Team
from dotenv import load_dotenv

from helper import *

load_dotenv()


table_manager = Agent(
    name="Table Manager Agent",
    tools=[get_all_tables,get_all_columns,refresh_db_schema],
    model=Gemini("gemini-2.0-flash",api_key=os.environ["GOOGLE_API_KEY"]),
)

sql_manger = Agent(
    name="SQL Manager Agent",
    tools=[execute_query],
    model=Gemini("gemini-2.0-flash",api_key=os.environ["GOOGLE_API_KEY"]),
    instructions="""
    You are a SQL Manager Agent. You will be given SQL queries to execute.
    Things to consider while performing the tasks:
    1. Be concise and clear in your responses.
    2. Always check the query to do before executing it.
    3. If the query is not valid, return an error message.
    4. If the query is valid, execute it and return the result.
    5. If the query is a DDL query, return a success message.
    6. If the query is a DML query, return the number of rows affected.
    7. If the query is a SELECT query, return the result set.
    8. If the query is a complex query, break it down into smaller queries and execute them one by one.
    9. Always return the result in a structured format.
    10. If you are not sure about the query, ask for clarification.
    """,
    debug_mode=True,
)

smart_db_team = Team(
    name="SmartDB Team",
    description="A team of agents that can help you with database queries and management.",
    mode="coordinate",
    members=[table_manager],
    model=Gemini("gemini-2.0-flash"),
    instructions="""
    You will perform the tasks and complete it using appropriate agent. Things to consider while performing the tasks:
    1. Be concise and clear in your responses.
    
    Always check the task to do before routing to an agent.
    
    Remember: You are the final gatekeeper of the task. You need to make sure that the task is completed by the appropriate agent.
    """,
    debug_mode=True
)
