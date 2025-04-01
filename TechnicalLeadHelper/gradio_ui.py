import os
from typing import final

import gradio as gr
import requests
import gradio as gr
import os
import google.generativeai as genai
from dotenv import load_dotenv
from vertexai.preview.generative_models import GenerativeModel
from google.cloud import aiplatform

from TechnicalLeadHelper.main import get_all_work_items_by_sprint_num
from constants import LIST_OF_NAMES

load_dotenv()

BASE_URL = "http://localhost:8000/"
history = []
GEMINI_MODEL = "gemini-2.0-flash"
if os.environ.get("GOOGLE_API_KEY",None):
    print("Using API Key")
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel(GEMINI_MODEL)
elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS",None):
    print("Using Project JSON Key")
    aiplatform.init(project=os.environ["PROJECT_NAME"] , location=os.environ["PROJECT_LOCATION"])
    model = GenerativeModel("gemini-2.0-flash-001")
else:
    raise ValueError("Please set GOOGLE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS environment variable to use this demo")

chat_session = model.start_chat(history=history)


def clear_button():
    history.clear()
    global chat_session
    chat_session = model.start_chat(history=history)

    return history


def respond(user_msg, work_item=None):

    if work_item is None:
        work_item = {}
    if len(history) == 0:
        user_story_title = work_item.get("title", "No Title")
        technical_description = work_item.get("description", "No Description")

        technical_prompt = f"""
        I will give you a task, with its technical description and my thought process. You will act as Expert Technical Lead and help me with my questions. 
        Going forward, avoid simply agreeing with my points or taking my conclusions at face value. I want a real intellectual challenge, not just affirmation.Whenever i ask question, or mention something or clarify something, do this:
        
        - Question my assumptions: What am i treating as true that might be questionable?
        - Offer a skeptic's viewpoint: What assumption would a critical, well-informed voice raise?
        - Check my reasoning: Are there flaws or leaps in logic I have overlooked?
        - Suggest alternative angles: How  else might the idea be viewed, interpreted, or challenged?
        - Focus on accuracy over agreement: If my argument is weak or wrong, correct me plainly and show me how.
        - Stay Constructive but Rigorous: You are not here to argue for argument's sake, but to sharpen my thinking and keep me honest. Lets refine both our conclusions and how we reach them.

        User Story Title: {user_story_title}
        
        Technical Description: 
        {technical_description}
        
        My Thought Process:
        {user_msg}
        """
        final_msg = technical_prompt

    else:
        final_msg = user_msg
    history.append({"role": "user", "content": user_msg})
    history.append({"role": "assistant", "content": ""})


    response = chat_session.send_message(content=final_msg, stream=True)

    for chunk in response:
        if len(chunk.candidates) > 0:
            history[-1]["content"] += chunk.candidates[0].content.parts[0].text
        yield "", history


# ------------ Supporting Code -------------

def call_create_task(item, task_title, task_description, task_assigned_to, original_estimate):
    url = BASE_URL + "create_task"
    body = {
        "task_title": task_title,
        "parent_id": int(item["id"]),
        "task_description": task_description,
        "task_assigned_to": task_assigned_to,
        "original_estimate": int(original_estimate)
    }
    response = requests.post(url, json=body)
    if response.status_code == 200:
        print("Task created successfully")
    else:
        print("Failed to create task")
    response = response.json()
    # print(response)
    return gr.Button(value=f"Task Created Successfully. ID {response.get('id','No ID')}",interactive=False)

def populate_work_items_info(work_item):
    _description = work_item.get("description","No Description")
    _story_points = work_item.get("story_points", "No Story Points")
    _assigned_to = work_item["assigned_to"]
    return _description,_story_points,_assigned_to, 0

def get_list_of_names():
    return LIST_OF_NAMES


def get_sprint_info(sprint_num):
    print(f"Getting information for sprint number:{sprint_num}")

    # response = requests.get(BASE_URL + "get_all_work_items?sprint_number=" + str(sprint_num))
    response = get_all_work_items_by_sprint_num(sprint_num)
    # if response.status_code == 200:
    if response:
        # data = response.json()
        data = response
        work_items = []

        for type_of_item in data:
            for item in data[type_of_item]:
                # print(item)
                work_items.append((item["title"], item))
        return gr.Dropdown(choices=work_items)
    else:
        print(f"Error: {response.status_code}")
        return gr.Dropdown(choices=[])


# ------------- UI -------------
demo = gr.Blocks()

with demo:
    gr.Markdown(
        """
        # Wingman Technical Helper
        This is to help Nishant with Technical Activities
        """
    )

    with gr.Row():
        sprint_num_dropdown = gr.Dropdown(choices=[None, 1], label="Sprint Number", interactive=True)
        work_items_dropdown = gr.Dropdown(choices=[], label="Work Items", interactive=True)

    with gr.Row():
        story_points = gr.Textbox(label="Story Points",interactive=False)
        assigned_to = gr.Textbox(label="Assigned To",interactive=False)

    with gr.Row():
        description = gr.Markdown(label="Description")
        description.value = "Description will be populated here"

    sprint_num_dropdown.change(get_sprint_info, inputs=sprint_num_dropdown, outputs=work_items_dropdown)

    with gr.Tab("Create Task"):
        no_of_task = gr.Dropdown(choices=list(range(0, 10)), label="Number of Tasks", interactive=True)


        @gr.render(inputs=no_of_task)
        def render_task_form(num_tasks):
            for _ in range(num_tasks):
                with gr.Row():
                    task_title = gr.Textbox(label="Task Title")
                    task_description = gr.Textbox(label="Task Description")
                    task_assigned_to = gr.Dropdown(choices=get_list_of_names(), label="Assigned To")
                    original_estimate = gr.Textbox(label="Original Estimate", value="8")
                    create_task_button = gr.Button("Create Task")
                    create_task_button.click(call_create_task,
                                             inputs=[work_items_dropdown, task_title, task_description,
                                                     task_assigned_to, original_estimate],
                                             outputs=create_task_button)

    work_items_dropdown.change(populate_work_items_info, inputs=work_items_dropdown, outputs=[description, story_points, assigned_to, no_of_task])

    with gr.Tab("Talk with Technical Lead"):
        chatbot = gr.Chatbot(history, type="messages", autoscroll=True, show_copy_button=True)
        msg = gr.Textbox(label="Your thoughts !!!", submit_btn=True)
        msg.submit(respond, [msg, work_items_dropdown], [msg, chatbot])
        clr = gr.Button("Reset History")
        clr.click(clear_button, None, [chatbot])

demo.launch()
