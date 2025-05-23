from agno.agent import Agent
from agno.models.google import Gemini
from agno.team import Team
from dotenv import load_dotenv
from langchain_community.tools.jina_search import JinaSearch
from smolagents import CodeAgent, Model
from agno.tools.python import PythonTools

load_dotenv()

def wikipedia_query(query:str) -> str:
    """
    Query Wikipedia for a specific term.
    :param query: The term to search for.
    :return: The summary of the Wikipedia page.
    """
    search = JinaSearch()
    result = search(query)
    return result

HuggingFaceMainAgent = Agent(
    name="Main Agent",
    model=Gemini(id="gemini-2.0-flash"),
    tools=[PythonTools(pip_install=True),wikipedia_query],
    markdown=True,
    show_tool_calls=True
)

hugging_face_team = Team(
    name="Nimo007 Hugging Face Team",
    mode="coordinate",
    model=Gemini(id="gemini-2.0-flash"),
    markdown=True,
    show_tool_calls=True,
    description="You are a task router that directs certain tasks to the appropriate agent.",
    instructions="""
    You are a helpful assistant tasked with answering questions using a set of tools. 
    Now, I will ask you a question. Finish your answer with the following template: 
    FINAL ANSWER: [YOUR FINAL ANSWER]. 
    YOUR FINAL ANSWER should be a number OR as few words as possible OR a comma separated list of numbers and/or strings. If you are asked for a number, don't use comma to write your number neither use units such as $ or percent sign unless specified otherwise. If you are asked for a string, don't use articles, neither abbreviations (e.g. for cities), and write the digits in plain text unless specified otherwise. If you are asked for a comma separated list, apply the above rules depending of whether the element to be put in the list is a number or a string.
    Your answer should only start with "FINAL ANSWER: ", then follows with the answer. No Explanation or additional information is needed.
    """,
    members=[HuggingFaceMainAgent]
)


#
#
#
# resp = hugging_face_team.run("How many studio albums were published by Mercedes Sosa between 2000 and 2009 (included)? You can use the latest 2022 version of english wikipedia.")
# print("-----")
# print( resp.content.split("FINAL ANSWER: ")[1].strip())
# print("-------")