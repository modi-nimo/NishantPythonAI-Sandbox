import os
from typing import Dict, List, Optional, Tuple, Union
import pandas as pd
import gradio as gr
import google.generativeai as genai
import requests
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
    primary_hue="rose",
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
    global history
    history.clear()
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
        acceptance_criteria = work_item.get("acceptance_criteria", "No Acceptance Criteria") if work_item else "No Acceptance Criteria"
        technical_prompt = f"""
        I will give you a task, with its technical description, acceptance criteria and my thought process. You will act as Expert Technical Lead and help me with making sure the User story is airtight , without any technical flaws or gaps. 
        Try to think from lens of Technical Lead and see if the User story is complete and ready to be worked on.
        If you feel like the User Story is not ready, ask questions.
        Feel free to ask any questions or doubts before answering.
        If the User story is well defined and dont have any gaps, then just say "The User story is well defined and ready to be worked on" and nothing else.
        
        Some Acronyms you might need to know:
        - US: User Story
        - WM - Wingman ( Name of our application )

        User Story Title: {user_story_title}

        Technical Description: 
        {technical_description}

        Acceptance Criteria:
        {acceptance_criteria}
        
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
        return gr.update(value="Error: No work item selected", interactive=False, variant="secondary")

    try:
        # Extract the item ID from the dropdown string
        item_id = item_id_title.split(" - ")[0].strip()
        item_id = int(item_id)

        res = technical_lead_team.run(
            f"Create a Task for {item_id} User story, with title {task_title}, "
            f"description {task_description}, assigned to {task_assigned_to}, "
            f"original estimate {original_estimate}"
        )
        return gr.update(value=f"Task Created: {res.content}", interactive=False, variant="secondary")
    except (ValueError, IndexError, AttributeError) as e:
        print(f"Error creating task: {e}")
        return gr.update(value=f"Error creating task: {str(e)}", interactive=False, variant="secondary")


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
                    "Type": item_type,
                    "Title": item["title"],
                    "State": item["state"],
                    "Assigned To": item["assigned_to"],
                    "SP": item.get("story_points", "1") or "1",  # Handle None value
                    "Created Date": item.get("created_date"),
                }
                data.append(temp_info)
    except Exception as e:
        print(f"Error getting work item dataframe: {e}")

    if not data:
        return pd.DataFrame(columns=["Story ID", "Type", "Title", "State",  "Assigned To","SP","Created Date"])

    result_dataframe = pd.DataFrame(data, columns=["Story ID", "Type", "Title", "State",  "Assigned To","SP","Created Date"])
    result_dataframe = result_dataframe.sort_values(by="Created Date")

    return result_dataframe


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
        return "✅ Tasks initialized successfully!"
    except Exception as e:
        print(f"Error creating initial tasks: {e}")
        return f"❌ Error: {str(e)}"


def update_task_containers(num_tasks):
    return [i < num_tasks for i in range(5)]

def update_status_via_slack(work_item, status):
    print(work_item)
    print(status)
    url = os.getenv("SLACK_WEBHOOK_URL")
    data = {
        "message": status,
        "id": work_item.split()[0].strip()
    }
    requests.post(url,json=data)
    return ""

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
    .centered {
        display: flex;
        justify-content: center;
    }
    .dashboard {
        padding: 10px;
        border-radius: 8px;
        background-color: #f9fafb;
    }
""") as demo:
    with gr.Row(elem_classes="header"):
        gr.Markdown("""
        # 🤖 AI Scrum Master
        ### Your intelligent assistant for Agile team management
        """)

    # Sprint Selection
    with gr.Row():
        with gr.Column():
            sprint_num_dropdown = gr.Dropdown(
                choices=[None] + list(range(1, 9)),
                label="📅 Select Sprint Number",
                interactive=True,
                value=None
            )
            status_message = gr.Markdown("")
            with gr.Accordion("Admin Actions", open=False):
                admin_action = gr.Button("Initialize Tasks for Sprint", variant="primary")

            admin_action.click(
                create_task_for_sprint_init,
                outputs=status_message
            )

    # Sprint Dashboard
    with gr.Accordion("🏠 Sprint Dashboard", open=False):
        with gr.Row(elem_classes="dashboard"):
            current_sprint = gr.DataFrame(
                value=pd.DataFrame(columns=["Story ID", "Title", "State", "Type", "SP", "Assigned To"]),
                wrap=True,
                show_label=False,
                max_height=300
            )

    # Work Item Section
    with gr.Tabs() as tabs:
        # Update Status
        with gr.TabItem("📊 Update Status"):
            with gr.Row():
                with gr.Column(scale=1):
                    update_item_dropdown = gr.Dropdown(
                        choices=[],
                        label="Select Work Item",
                        interactive=True,
                        value=None
                    )
                    update_status = gr.Textbox(label="Update Status", submit_btn=True)
                    update_status.submit(update_status_via_slack, inputs=[update_item_dropdown, update_status],
                                         outputs=update_status)

        # Combined Work Item Selection and Management Tab
        with gr.TabItem("📋 Work Item Management"):
            with gr.Row():
                # Left column for selection and details
                with gr.Column(scale=1):
                    work_items_dropdown = gr.Dropdown(
                        choices=[],
                        label="Select Work Item",
                        interactive=True,
                        value=None
                    )

                    with gr.Group():
                        gr.Markdown("### Details")
                        story_points = gr.Textbox(label="Story Points", interactive=False)
                        assigned_to = gr.Textbox(label="Assigned To", interactive=False)

                    description = gr.Markdown()

                # Right column for task creation
                with gr.Column(scale=1):
                    gr.Markdown("### Create Task")
                    task_title = gr.Textbox(label="Task Title", value="WM - Develop")
                    task_description = gr.Textbox(label="Task Description", value="Develop Placeholder", lines=3)

                    with gr.Row():
                        task_assigned_to = gr.Dropdown(
                            choices=LIST_OF_NAMES,
                            label="Assigned To",
                            value=None
                        )
                        original_estimate = gr.Textbox(label="Hours", value="8")

                    create_task_button = gr.Button("Create Task", variant="primary")
                    task_status = gr.Markdown("")

                    create_task_button.click(
                        call_create_task,
                        inputs=[work_items_dropdown, task_title, task_description, task_assigned_to, original_estimate],
                        outputs=task_status
                    )

        # Technical Lead Chat Tab
        with gr.TabItem("💬 Technical Lead Chat"):
            with gr.Row():
                with gr.Column():
                    chatbot = gr.Chatbot(
                        [],
                        elem_id="chatbot",
                        type="messages",
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

                    with gr.Row(elem_classes="centered"):
                        clear_btn = gr.Button("Reset Chat", variant="secondary")

            msg.submit(respond, [msg, work_items_dropdown], [msg, chatbot])
            send_btn.click(respond, [msg, work_items_dropdown], [msg, chatbot])
            clear_btn.click(clear_chat_history, None, [chatbot])


    # Connect the components
    def update_sprint_ui(sprint_num):
        # First reset the work items dropdown to prevent value mismatch errors
        items, df = get_sprint_info(sprint_num)
        return gr.update(choices=items, value=None),gr.update(choices=items, value=None), df, ""


    sprint_num_dropdown.change(
        update_sprint_ui,
        inputs=sprint_num_dropdown,
        outputs=[work_items_dropdown,update_item_dropdown, current_sprint, status_message]
    )


    # Only populate work item details when a valid selection is made
    def safe_populate_work_items_info(work_item_id_title):
        if not work_item_id_title:
            return "", "0", "Unassigned"
        description, points, assignee, _ = populate_work_items_info(work_item_id_title)
        return description, points, assignee


    work_items_dropdown.change(
        safe_populate_work_items_info,
        inputs=work_items_dropdown,
        outputs=[description, story_points, assigned_to]
    )

demo.launch()