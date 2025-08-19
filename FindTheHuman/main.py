import os

import pandas as pd
from agno.agent import Agent
from agno.models.google import Gemini
from agno.models.groq import Groq
from agno.team import Team
from autogen.math_utils import get_answer
from dotenv import load_dotenv
from pydantic import BaseModel # Added BaseModel import
import asyncio # Added asyncio import

load_dotenv()

def get_answer(question: str) -> str:
    response = input(question)
    return response

person_1 = Agent(
    name="Person 1",
    model=Groq(id="llama-3.1-instant")
)

person_2 = Agent(
    name="Person 2",
)

person_3 = Agent(
    name="Person 3",
)

person_4 = Agent(
    name="Person 4",
    tools=[get_answer]
)

train_collector = Team(
    name="Train Collector",
    description="A team of agents that can help you with collecting train information.",
    mode="collaborate",
    members=[person_1, person_2, person_3, person_4],
    model=Gemini("gemini-2.5-flash", api_key=os.environ["GOOGLE_API_KEY"]),
    instructions="""
    
    """,
)