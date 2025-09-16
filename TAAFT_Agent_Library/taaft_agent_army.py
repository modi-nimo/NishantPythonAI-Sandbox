import json
import os

from agno.agent import Agent
from agno.models.groq import Groq
from agno.team import Team
from dotenv import load_dotenv
from agno.db.in_memory import InMemoryDb
load_dotenv()

db = InMemoryDb()
with open("prompt_collection.json", "r") as source_file:
    prompt_collection = json.load(source_file)

members_list = [
    Agent(
        name=single_prompt["name"],
        model=Groq("openai/gpt-oss-20b", api_key=os.environ["GROQ_API_KEY"]),
        description=single_prompt["description"],
        instructions=single_prompt["prompt"]
    ) for
    single_prompt in prompt_collection]

taaft_agent_team = Team(
    name="TAAFT Agent Library",
    description="A team of agents that can help you with various tasks.",
    model=Groq("openai/gpt-oss-20b", api_key=os.environ["GROQ_API_KEY"]),
    members=members_list,
    determine_input_for_members=False,
    show_members_responses=True,
    debug_mode=True,
    respond_directly=True,
    db=db,
    add_history_to_context=True,
    read_team_history=True
)

while True:
    qsn = input("Enter your Question: ")
    taaft_agent_team.print_response(qsn,session_id="1",user_id="101")
    print("\n" + "=" * 50 + "\n")
