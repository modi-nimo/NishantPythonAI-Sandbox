# This is the main entry point of Technical Lead Helper.
# Basically it will help me with lead activities , using Agentic AI structure.
import asyncio
import os

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAI, ChatGoogleGenerativeAI
from langgraph_supervisor import create_supervisor
from langgraph.prebuilt import create_react_agent

from BrowserUse_Experimentation.browser_use_main import perform_task_on_browser

load_dotenv()
model = ChatGoogleGenerativeAI(api_key=os.environ["GOOGLE_API_KEY"], model="gemini-2.0-flash")
# Create Specialised Agents

def add(a:float, b:float) -> float:
    """Add two numbers"""
    return a + b

def subtract(a:float, b:float) -> float:
    """Subtract two numbers"""
    return a - b

def multiply(a:float, b:float) -> float:
    """Multiply two numbers"""
    return a * b

def divide(a:float, b:float) -> float:
    """Divide two numbers"""
    return a / b

def web_search(query:str) -> str:
    """Search the web for any information"""
    print("---- Searching the web ----")
    print(query)
    print("=======")
    result = asyncio.run(perform_task_on_browser(f"Search on google.com and return me all information for {query}"))
    return result

math_agent = create_react_agent(
    model=model,
    name="Math Expert",
    tools=[add, subtract, multiply, divide],
    prompt="You are a math expert. Always use one tool at a time."
)

research_agent = create_react_agent(
    model=model,
    name="Web Search Expert",
    tools=[web_search],
    prompt="You are a world class researcher with access to web search. Do not do any math."
)

# Create Supervisor
supervisor = create_supervisor(
    [math_agent, research_agent],
    model=model,
    prompt=(
        "You are a team supervisor managing a math expert and a web search expert. "
        "For current events or any future events information, ask the web search expert. It has access to internet." 
        "For math problems, ask the math expert."
    ),
    output_mode="last_message"
)

app = supervisor.compile()

result = app.invoke({
    "messages":[
        {
            "role":"user",
            "content":"What is the match score of PBKS vs GT in IPL 2025?"
        }
    ]
},
    # debug=True
)

