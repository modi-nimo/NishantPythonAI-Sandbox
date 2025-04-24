import os
from typing import Dict, List, Optional, Tuple, Union
import pandas as pd
import gradio as gr
import google.generativeai as genai
from dotenv import load_dotenv
from vertexai.preview.generative_models import GenerativeModel
from google.cloud import aiplatform

from TechnicalLeadHelper.technical_lead_main import (
    technical_lead_team,
    get_all_work_items_for_sprint,
    get_current_work_items,
    get_tasks_for_all_work_items
)
from constants import LIST_OF_NAMES, GEMINI_MODEL

# Load environment variables
load_dotenv()

# Initialize AI model
history = []
if os.environ.get("GOOGLE_API_KEY", None):
    print("Using API Key")
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel(GEMINI_MODEL)
elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", None):
    print("Using Project JSON Key")
    aiplatform.init(project=os.environ["PROJECT_NAME"], location=os.environ["PROJECT_LOCATION"])
    model = GenerativeModel(GEMINI_MODEL)
else:
    raise ValueError(
        "Please set GOOGLE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS environment variable to use this demo")

chat_session = model.start_chat()

# Theme configuration
theme = gr.themes.Soft(
    primary_hue="blue",
    secondary_hue="sky",
    neutral_hue="slate",
).set(
    button_primary_background_fill="*primary_500",
    button_primary_background_fill_hover="*primary_600",
    button_primary_text_color="white",
    block_label_background_fill="*neutral_50",
    block_label_text_color="*neutral_700",
)


# Helper functions
def clear_chat_history():
    global chat_session
    chat_session = model.start_chat()
    return []


def respond(user_msg: str, work_item_id_title: str = None) -> Tuple[str, List]:
    work_item = None

    # Find the work item based on id-title string
    if work_item_id_title:
        try:
            item_id = work_item_id_title.split(" - ")[0].strip()
            item_id = int(item_id)
            # Search for the work item with this ID
            for item_type, items in get_current_work_items().items():
                for item in items:
                    if item["id"] == item_id:
                        work_item = item
                        break
                if work_item:
                    break
        except (ValueError, IndexError, TypeError):
            # If parsing fails, work_item remains None
            print(f"Could not parse work item ID from '{work_item_id_title}'")
            pass

    if len(history) == 0:
        user_story_title = work_item.get("title", "No Title") if work_item else "No Title"
        technical_description = work_item.get("description", "No Description") if work_item else "No Description"

        technical_prompt = f"""
        I will give you a task, with its technical description and my thought process. You will act as Expert Technical Lead and help me with my questions. 
        Going forward, avoid simply agreeing with my points or taking my conclusions at face value. I want a real intellectual challenge, not just affirmation. Whenever I ask a question, or mention something or clarify something, do this:

        - Question my assumptions: What am I treating as true that might be questionable?
        - Offer a skeptic's viewpoint: What assumption would a critical, well-informed voice raise?
        - Check my reasoning: Are there flaws or leaps in logic I have overlooked?
        - Suggest alternative angles: How else might the idea be viewed, interpreted, or challenged?
        - Focus on accuracy over agreement: If my argument is weak or wrong, correct me plainly and show me how.
        - Stay Constructive but Rigorous: You are not here to argue for argument's sake, but to sharpen my thinking and keep me honest. Let's refine both our conclusions and how we reach them.

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


def call_create_task(item_id_title, task_title, task_description, task_assigned_to, original_estimate):
    if not item_id_title:
        return gr.Button(value="Error: No work item selected", interactive=False, variant="secondary")

    try:
        # Extract the item ID from the dropdown string
        item_id = item_id_title.split(" - ")[0].strip()
        item_id = int(item_id)

        res = technical_lead_team.run(
            f"Create a Task for {item_id} User story, with title {task_title}, "
            f"description {task_description}, assigned to {task_assigned_to}, "
            f"original estimate {original_estimate}"
        )
        return gr.Button(value=f"Task Created: {res.content}", interactive=False, variant="secondary")
    except (ValueError, IndexError, AttributeError) as e:
        print(f"Error creating task: {e}")
        return gr.Button(value=f"Error creating task: {str(e)}", interactive=False, variant="secondary")


def populate_work_items_info(work_item_id_title):
    if not work_item_id_title:
        return "", "0", "Unassigned", 0

    try:
        # Extract the item ID from the dropdown string
        item_id = work_item_id_title.split(" - ")[0].strip()
        item_id = int(item_id)

        # Find the work item with this ID
        work_item = None
        for item_type, items in get_current_work_items().items():
            for item in items:
                if item["id"] == item_id:
                    work_item = item
                    break
            if work_item:
                break

        if not work_item:
            return "Work item not found", "0", "Unassigned", 0

        _description = work_item.get("description", "No Description")
        _story_points = work_item.get("story_points", "0") or "0"  # Handle None value
        _assigned_to = work_item.get("assigned_to", "Unassigned")

        return _description, _story_points, _assigned_to, 0
    except (ValueError, IndexError, AttributeError) as e:
        print(f"Error populating work item info: {e}")
        return f"Error: {str(e)}", "0", "Error", 0


def get_workitem_dataframe():
    data = []
    try:
        for item_type, item_info in get_current_work_items().items():
            for item in item_info:
                temp_info = {
                    "Story ID": item["id"],
                    "Title": item["title"],
                    "State": item["state"],
                    "Type": item_type,
                    "SP": item.get("story_points", "0") or "0",  # Handle None value
                    "Assigned To": item["assigned_to"],
                }
                data.append(temp_info)
    except Exception as e:
        print(f"Error getting work item dataframe: {e}")

    if not data:
        return pd.DataFrame(columns=["Story ID", "Title", "State", "Type", "SP", "Assigned To"])

    return pd.DataFrame(data, columns=["Story ID", "Title", "State", "Type", "SP", "Assigned To"])


def get_sprint_info(sprint_num):
    # Reset the work_items_dropdown when changing sprints to avoid the mismatch error
    if not sprint_num:
        print("No sprint number provided")
        return [], get_workitem_dataframe()

    print(f"Getting information for sprint number: {sprint_num}")

    try:
        response = get_all_work_items_for_sprint(sprint_num)
        if response:
            data = response
            work_items = []
            print(f"Got response for sprint {sprint_num}")

            for type_of_item in data:
                print(f"Processing items of type {type_of_item}")
                for item in data[type_of_item]:
                    work_items.append(f"{item['id']} - {item['title']}")

            print(f"Returning {len(work_items)} work items")
            # Return empty list if no work items found to prevent dropdown errors
            return work_items if work_items else [], get_workitem_dataframe()
        else:
            print("Error fetching work items, response was None or empty")
            return [], get_workitem_dataframe()
    except Exception as e:
        print(f"Error getting sprint info: {e}")
        return [], get_workitem_dataframe()


def create_task_for_sprint_init():
    try:
        get_tasks_for_all_work_items()
        return gr.Button(value="Tasks Created Successfully!", variant="secondary", interactive=False)
    except Exception as e:
        print(f"Error creating initial tasks: {e}")
        return gr.Button(value=f"Error: {str(e)}", variant="secondary", interactive=False)


def update_task_containers(num_tasks):
    return [i < num_tasks for i in range(5)]


# Main UI
with gr.Blocks(theme=theme, title="AI Scrum Master", css="""
    .header {
        text-align: center;
        margin-bottom: 20px;
    }
    .container {
        margin: 0 auto;
        max-width: 1200px;
    }
    .status-msg {
        color: #10b981;
        font-weight: bold;
    }
    .error-msg {
        color: #ef4444;
        font-weight: bold;
    }
""") as demo:
    with gr.Row(elem_classes="header"):
        gr.Markdown("""
        # 🤖 AI Scrum Master
        ### Your intelligent assistant for Agile team management
        """)

    # Sprint and Work Item Selection Area
    with gr.Row(elem_classes="container"):
        with gr.Column(scale=1):
            sprint_num_dropdown = gr.Dropdown(
                choices=[None] + list(range(1, 9)),
                label="📅 Select Sprint Number",
                interactive=True,
                value=None
            )

        with gr.Column(scale=2):
            work_items_dropdown = gr.Dropdown(
                choices=[],
                label="📋 Select Work Item",
                interactive=True,
                value=None  # Start with no selection to avoid mismatch errors
            )

    # Work Item Details Area
    with gr.Row(elem_classes="container"):
        with gr.Column(scale=1):
            with gr.Group():
                gr.Markdown("### Work Item Details")
                story_points = gr.Textbox(label="Story Points", interactive=False)
                assigned_to = gr.Textbox(label="Assigned To", interactive=False)

        with gr.Column(scale=2):
            description = gr.Markdown()
            error_message = gr.Markdown(visible=False, elem_classes="error-msg")

    # Main Tabs Area
    with gr.Tabs() as tabs:
        # Tab 1: Create Task
        with gr.TabItem("🔨 Create Task"):
            with gr.Row():
                no_of_task = gr.Dropdown(
                    choices=list(range(0, 6)),
                    label="Number of Tasks to Create",
                    interactive=True,
                    value=1
                )

            task_containers = []
            task_visibilities = []
            for i in range(5):  # Pre-create UI for up to 5 tasks
                with gr.Row(visible=(i < 1)) as container:  # By default show only 1 task
                    task_containers.append(container)
                    task_visibilities.append(gr.Checkbox(value=(i < 1), visible=False))

                    with gr.Column(scale=3):
                        task_title = gr.Textbox(label=f"Task {i + 1} Title", value="WM - Develop")
                        task_description = gr.Textbox(label="Task Description", value="Develop Placeholder", lines=3)

                    with gr.Column(scale=2):
                        task_assigned_to = gr.Dropdown(
                            choices=LIST_OF_NAMES,
                            label="Assigned To",
                            value=None
                        )
                        original_estimate = gr.Textbox(label="Original Estimate (hours)", value="8")

                    with gr.Column(scale=1):
                        create_task_button = gr.Button("Create Task", variant="primary")
                        create_task_button.click(
                            call_create_task,
                            inputs=[work_items_dropdown, task_title, task_description, task_assigned_to,
                                    original_estimate],
                            outputs=create_task_button
                        )

            no_of_task.change(
                update_task_containers,
                inputs=no_of_task,
                outputs=task_visibilities
            )

            for i, (visibility, container) in enumerate(zip(task_visibilities, task_containers)):
                visibility.change(
                    lambda x: gr.update(visible=x),  # Changed from gr.Row.update to gr.update
                    inputs=visibility,
                    outputs=container
                )

        # Tab 2: Technical Lead Chat
        with gr.TabItem("💬 Technical Lead Chat"):
            with gr.Row():
                with gr.Column():
                    chatbot = gr.Chatbot(
                        [],
                        elem_id="chatbot",
                        height=500,
                        show_copy_button=True,
                        avatar_images=("👤", "🤖")
                    )

                    with gr.Row():
                        msg = gr.Textbox(
                            label="Share your thoughts with the Technical Lead",
                            placeholder="Type your message here...",
                            lines=3,
                            show_label=False
                        )
                        send_btn = gr.Button("Send", variant="primary")

                    with gr.Row():
                        clear_btn = gr.Button("Reset Chat History", variant="secondary")

            msg.submit(respond, [msg, work_items_dropdown], [msg, chatbot])
            send_btn.click(respond, [msg, work_items_dropdown], [msg, chatbot])
            clear_btn.click(clear_chat_history, None, [chatbot])

        # Tab 3: PR Review
        with gr.TabItem("🔍 PR Review [Client VM Only]"):
            gr.Markdown("""
            ### Pull Request Review Tool

            This feature is only available when running on the client VM.
            """)

        # Tab 4: Sprint Overview
        with gr.TabItem("📊 Sprint Overview"):
            current_sprint = gr.DataFrame(
                value=pd.DataFrame(columns=["Story ID", "Title", "State", "Type", "SP", "Assigned To"]),
                wrap=True,
                show_label=False,
                max_height=400
            )

        # Tab 5: Admin Tasks
        with gr.TabItem("⚙️ Admin Tasks"):
            with gr.Row():
                with gr.Column():
                    gr.Markdown("### One-Time Administrative Tasks")
                    create_initial_tasks_btn = gr.Button("Initialize Tasks for Sprint", variant="primary")
                    task_status = gr.Markdown("")

                    create_initial_tasks_btn.click(
                        create_task_for_sprint_init,
                        outputs=create_initial_tasks_btn
                    )


    # Connect the components
    def update_sprint_ui(sprint_num):
        # First reset the work items dropdown to prevent value mismatch errors
        items, df = get_sprint_info(sprint_num)
        return gr.update(choices=items, value=None), df  # Changed from gr.Dropdown.update to gr.update


    sprint_num_dropdown.change(
        update_sprint_ui,
        inputs=sprint_num_dropdown,
        outputs=[work_items_dropdown, current_sprint]
    )


    # Only populate work item details when a valid selection is made
    def safe_populate_work_items_info(work_item_id_title):
        if not work_item_id_title:
            return "", "0", "Unassigned", 0
        return populate_work_items_info(work_item_id_title)


    work_items_dropdown.change(
        safe_populate_work_items_info,
        inputs=work_items_dropdown,
        outputs=[description, story_points, assigned_to, no_of_task]
    )

demo.launch()