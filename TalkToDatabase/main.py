# https://towardsdatascience.com/a-multi-agent-sql-assistant-you-can-trust-with-human-in-loop-checkpoint-llm-cost-control/
import os

import pandas as pd
from agno.agent import Agent
from agno.models.google import Gemini
from agno.models.groq import Groq
from agno.team import Team
from dotenv import load_dotenv

from helper import *

load_dotenv()

class ApplicationResponseModel(BaseModel):
    class Config:
        arbitrary_types_allowed = True

    user_question: str = ""
    generated_sql_query: str = ""
    explanation: str = None
    dataframe: pd.DataFrame = None
    insights : str = ""


sql_manger = Agent(
    name="SQL Manager Agent",
    tools=[generate_sql_query, execute_query, debug_sql_query],
    model=Gemini("gemini-2.5-flash",api_key=os.environ["GOOGLE_API_KEY"]),
    debug_mode=True,
)

insight_generator = Agent(
    name="Insight Generator Agent",
    tools=[generate_insights],
    instructions=""" Always use the tool to generate insights based on the dataframe provided by the SQL Manager Agent.""",
    model=Gemini("gemini-2.5-flash", api_key=os.environ["GOOGLE_API_KEY"]),
    debug_mode=True,
)

smart_db_team = Team(
    name="SmartDB Team",
    description="A team of agents that can help you with database queries and management.",
    mode="coordinate",
    members=[sql_manger,insight_generator],
    model=Gemini("gemini-2.5-flash",api_key=os.environ["GOOGLE_API_KEY"]),
    instructions="""
    You will perform the tasks and complete it using appropriate agent. Things to consider while performing the tasks:
    1. Be concise and clear in your responses.
    2. If you are able to generate a SQL query and execute it, generate the insights based on the dataframe returned by the SQL Manager Agent and try to answer the question.
    3. If there is any error in the SQL query, use the debug_sql_query tool to debug the query and then execute it.
    4. Perform the debugging of the SQL query max 3 times only. If the query is still not working, then return the error message to the user.
    5. Generate insights based on the dataframe returned by the SQL Manager Agent. Do not use your own knowledge to generate insights. Call the generate_insights tool to generate insights based on the dataframe returned by the SQL Manager Agent.
    
    Do not assume any data. The Tools provided by the agents are capable enough to handle the tasks.
    Always check the task to do before routing to an agent.
    Do not use your own knowledge to answer the question, always use the team members and there tools to perform the task.
    Remember: You are the final gatekeeper of the task. You need to make sure that the task is completed by the appropriate agent.
    """,
    debug_mode=True,
    show_members_responses=True,
    team_session_state={"application_response": ApplicationResponseModel()},
)

# if __name__ == "__main__":
#     You can add more functionality here to interact with the team or run specific tasks.
    # smart_db_team.run("User Question: Please give me 5 recently joined employee details")
    # print(smart_db_team.team_session_state["application_response"].generated_sql_query)