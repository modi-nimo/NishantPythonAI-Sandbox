# This is main gateway to application.
from typing import Any

import uvicorn
from fastapi import FastAPI
from llama_index.core.base.llms.types import ChatMessage, MessageRole
from pydantic import BaseModel

app = FastAPI()

from dotenv import load_dotenv
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import FunctionTool
from llama_index.llms.gemini import Gemini
from agents_code import image_to_html, instruction_to_html, content_specification

load_dotenv()
llm = Gemini(model='models/gemini-1.5-flash-002')

def get_me_tools():
    image_to_html_tool = FunctionTool.from_defaults(fn=image_to_html,name="Image_to_HTML")
    instructions_to_html_tool = FunctionTool.from_defaults(fn=instruction_to_html,name="Instruction_to_HTML")
    content_specification_tool = FunctionTool.from_defaults(fn=content_specification,name="Content_Specification")
    return [image_to_html_tool,instructions_to_html_tool,content_specification_tool]

master_agent = ReActAgent.from_tools(tools=get_me_tools(),llm=llm,verbose=True, context="You should always use the Tool and never do and Implicit thought")

class InputData(BaseModel):
    question: str
    attachedFiles: Any


@app.post("/generate_ui")
async def generate_ui(data: InputData) -> dict:

    if data.attachedFiles:
        path_to_image = f"/Users/nishant.modi/Downloads/" + data.attachedFiles[0].get("name","final.jpg")
        print(path_to_image)
        message = ChatMessage(
            role=MessageRole.USER,
            content="Path to Image is : " + path_to_image
        )

        resp = master_agent.chat(message="Convert this image to HTML code and return me the generated HTML Code only", chat_history=[message])
        print(resp.response)

    elif data.question:
        run_again = True
        message = f"User want to do following changes in HTML Code: {data.question} \n Use the tool to update the HTML code as per the user request"
        while run_again:
            resp = master_agent.chat(
                message=message)
            print(resp.response)
            if len(resp.sources)> 0 : #and type(resp.sources[0]) == llama_index.core.tools.ToolOutput
                run_again = False
            else:
                print("This is running again as this is Implicit resp.")
                run_again = True
                message = f"Please use the correct tool.Do not use your Implicit thought. User want to do following changes in HTML Code: {data.question} \n Use the tool to update the HTML code as per the user request"

    with open("output.html","r") as f:
        final_html_output = f.read()

    return {
        "agentResponses": [
            {
                "agent_name": "image_to_html",
                "agent_response": "I have generated the code as per given input",
                "render_type": "text",
                "render_priority": 1
            },
            {
                "agent_name": "image_to_html",
                "agent_response": final_html_output,
                "render_type": "code",
                "render_priority": 2
            }
        ],
        "message": 'Success',
        "statusCode": 200
    }


if __name__ == "__main__":
    uvicorn.run("main:app",port=8000)
