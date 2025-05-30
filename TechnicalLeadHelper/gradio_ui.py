# --- START OF FILE gradio_ui.py ---
import os
import json # Import json for parsing the status response
import gradio as gr
import pandas as pd
import requests
from dotenv import load_dotenv
from google import genai
from google.genai.types import GenerateContentConfig

# Import necessary functions from the refactored helper
from TechnicalLeadHelper.helper import (
    get_iteration_info,
    get_all_work_items,
    create_task,
    comment_on_work_item,  # Assuming this is needed for status updates
    extract_message_from_html, get_tasks_linked_to_work_item  # Assuming this might be needed for description display
)

# Import constants
from constants import LIST_OF_NAMES, GEMINI_MODEL

# Load environment variables
load_dotenv()

# --- Configuration ---
ORGANIZATION = os.environ.get("ORGANIZATION", "").replace(" ", "%20")
PROJECT = os.environ.get("PROJECT", "").replace(" ", "%20")
TEAM = os.environ.get("TEAM", "").replace(" ", "%20")
ITERATION_BASE_PATH = os.environ.get("ITERATION", "")
AREA_PATH = os.environ.get("AREA", "")
WINGMAN_UPDATE_STATUS_SLACK_URL = os.environ.get("WINGMAN_UPDATE_STATUS_SLACK_URL")

if not all([ORGANIZATION, PROJECT, TEAM, ITERATION_BASE_PATH, AREA_PATH]):
    raise ValueError("Missing required environment variables for Azure DevOps.")

# --- Global State ---
# Store current work items fetched for the selected sprint
current_work_items_data = {}
current_iteration_path = None

# --- AI Model Initialization ---
try:
    if os.environ.get("GOOGLE_API_KEY"):
        print("Using API Key for Gemini")
        model = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("Using Project JSON Key for Gemini")
        model = genai.Client(project=os.environ["PROJECT_NAME"], location=os.environ["PROJECT_LOCATION"], vertexai=True)
    else:
        raise ValueError(
            "Please set GOOGLE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS environment variable to use this demo")

    chat_session = model.chats.create(model=GEMINI_MODEL)
    # history is managed by Gradio's chatbot component
except Exception as e:
    print(f"Error initializing Gemini model: {e}")
    model = None # Set model to None if initialization fails
    chat_session = None

# --- Theme Configuration ---
theme = gr.themes.Soft(
    primary_hue="rose",
    secondary_hue="sky",
    neutral_hue="slate",
).set(
    button_primary_background_fill="*primary_500",
    button_primary_background_fill_hover="*primary_600",
    button_primary_text_color="white",
    button_secondary_background_fill="*secondary_500",
    button_secondary_background_fill_hover="*secondary_600",
    button_secondary_text_color="white",
    block_label_background_fill="*neutral_50",
    block_label_text_color="*neutral_700",
)

# --- Helper Functions for UI Logic ---

def clear_chat_history():
    """Clears the chat history and resets the chat session."""
    global chat_session
    if model:
        chat_session = model.chats.create(model=GEMINI_MODEL)
    return [] # Return empty list to clear Gradio chatbot

def get_work_item_by_id(item_id: int) -> dict | None:
    """Retrieves a work item from the current_work_items_data by ID."""
    for item_type, items in current_work_items_data.items():
        for item in items:
            if item.get("id") == item_id:
                return item
    return None

def respond(user_msg: str, chatbot_history: list, work_item_id_title: str = None):
    """Handles the chat interaction with the AI model."""
    if not model or not chat_session:
        chatbot_history.append([user_msg, "AI model not initialized. Please check server logs."])
        return "", chatbot_history

    work_item = None
    # Find the work item based on id-title string
    if work_item_id_title:
        try:
            item_id = int(work_item_id_title.split(" - ")[0].strip())
            work_item = get_work_item_by_id(item_id)
        except (ValueError, IndexError, TypeError):
            print(f"Could not parse work item ID from '{work_item_id_title}'")
            pass

    # Construct the initial prompt for the first turn
    if not chatbot_history:
        user_story_title = work_item.get("title", "No Title") if work_item else "No Title"
        # Use extract_message_from_html for display purposes if needed, but raw for AI input
        technical_description = work_item.get("description", "No Description") if work_item else "No Description"
        acceptance_criteria = work_item.get("acceptance_criteria", "No Acceptance Criteria") if work_item else "No Acceptance Criteria"
        known_information = """ """
        technical_prompt = f"""
        You are an Expert Technical Lead. I will provide details about a User Story (US) and my thought process. Your goal is to ensure the US is technically sound, complete, and ready for development. Identify any technical flaws, gaps, or unanswered questions.
        Note: The application is already in production,many of the underlying implementations are already done, so focus on technical aspects rather than business logic.
        If the US is well-defined, state "The User story is well defined and ready to be worked on" and nothing else. Otherwise, ask specific questions or point out areas needing clarification.

        Acronyms:
        - US: User Story
        - WM: Wingman (Our application name)

        User Story Title: {user_story_title}

        Technical Description:
        {extract_message_from_html(technical_description)}

        Acceptance Criteria:
        {extract_message_from_html(acceptance_criteria)}

        My Thought Process:
        {user_msg}
        
        Already Known Information:
        {known_information}
        """
        final_msg = technical_prompt
    else:
        final_msg = user_msg # For subsequent turns, just use the user's message

    # Add user message to history
    chatbot_history.append({"role": "user", "content": user_msg})
    chatbot_history.append({"role": "assistant", "content": ""})# None for the assistant's response initially

    try:
        response = chat_session.send_message_stream(final_msg)
        # Update the last assistant message in history with streamed chunks
        chatbot_history[-1]["content"] = "" # Initialize assistant response string
        for chunk in response:
            if len(chunk.candidates) > 0:
                chatbot_history[-1]["content"] += chunk.candidates[0].content.parts[0].text
            yield "", chatbot_history # Yield empty message and updated history
    except Exception as e:
        print(f"Error during AI response generation: {e}")
        chatbot_history[-1]["content"] = f"Error generating response: {str(e)}"
        yield "", chatbot_history # Yield error message


def get_status_from_transcript(work_item_dataframe: pd.DataFrame, transcript_file):
    """Extracts status updates from a transcript using AI."""
    if not model:
        return pd.DataFrame(columns=["Story ID", "Title","Status"]), "AI model not initialized."

    if transcript_file is None:
        return pd.DataFrame(columns=["Story ID", "Title","Status"]), "Please upload a transcript file."

    try:
        with open(transcript_file.name, 'r') as file:
            transcript = file.read()

        if work_item_dataframe.empty:
             return pd.DataFrame(columns=["Story ID", "Title","Status"]), "No work items loaded for the current sprint."

        # Prepare work items data for the prompt
        my_work_items = work_item_dataframe[["Story ID","Title"]].to_string(index=False)

        prompt = f"""
        You are a Scrum Master analyzing a meeting transcript for daily status updates. Extract the status update for each team member related to specific work items.

        You are provided with a list of work items (ID and Title) and the meeting transcript.

        Output Format:
        Return a JSON array of objects. Each object must have the keys "Story ID" (integer), "Title" (string), and "Status" (string).
        Example:
        [{{\"Story ID\": 123, \"Title\": \"Fix login bug\", \"Status\": \"Working on the backend fix.\"}}, {{\"Story ID\": 456, \"Title\": \"Implement new feature\", \"Status\": \"Completed the UI design.\"}}]

        Work Items:
        {my_work_items}

        Transcript:
        {transcript}
        """

        # Use a temporary chat session for this specific task
        temp_chat_session = model.chats.create(model=GEMINI_MODEL)
        response = temp_chat_session.send_message(prompt, config=GenerateContentConfig(response_mime_type="application/json"))

        # Parse the JSON response
        try:
            status_list = json.loads(response.text)
            result_df = pd.DataFrame(status_list, columns=["Story ID", "Title","Status"])
            return result_df , None # Return DataFrame and no error message
        except json.JSONDecodeError:
            print(f"AI response was not valid JSON: {response.text}")
            return pd.DataFrame(columns=["Story ID", "Title","Status"]), "AI failed to return valid JSON. Please try again."

    except Exception as e:
        print(f"Error processing transcript: {e}")
        return pd.DataFrame(columns=["Story ID", "Title","Status"]), f"Error processing transcript: {str(e)}"

def call_create_task_ui(item_id_title: str | None, task_title: str, task_description: str, task_assigned_to: str, original_estimate: str):
    """Handles task creation from the UI."""
    if not item_id_title:
        return "Error: No work item selected"

    if not ORGANIZATION or not PROJECT:
         return "Error: Azure DevOps configuration missing."

    try:
        item_id = int(item_id_title.split(" - ")[0].strip())
        estimate_value = int(original_estimate) if original_estimate.isdigit() else None

        # Use the helper function directly
        res = create_task(
            organization=ORGANIZATION,
            project=PROJECT,
            task_title=task_title,
            parent_id=item_id,
            task_description=task_description,
            task_assigned_to=task_assigned_to if task_assigned_to != "Unassigned" else None,
            iteration_path=current_iteration_path, # Use the globally stored iteration path
            area_path=AREA_PATH,
            original_estimate=estimate_value
        )

        if res and res.get("id"):
            return f"Task Created successfully with ID: {res['id']}"
        else:
             return f"Failed to create task. API response: {res}"

    except (ValueError, IndexError, AttributeError) as e:
        print(f"Error creating task: {e}")
        return f"Error creating task: Invalid input or API issue - {str(e)}"
    except Exception as e:
        print(f"Unexpected error creating task: {e}")
        return f"Unexpected error creating task: {str(e)}"


def populate_work_items_info_ui(work_item_id_title: str | None):
    """Populates work item details in the UI."""
    if not work_item_id_title:
        return "", "0", "Unassigned"

    try:
        item_id = int(work_item_id_title.split(" - ")[0].strip())
        work_item = get_work_item_by_id(item_id)

        if not work_item:
            return "Work item not found in current sprint data.", "0", "Unassigned"

        # Use extract_message_from_html for displaying description
        _description = extract_message_from_html(work_item.get("description"))
        _story_points = str(work_item.get("story_points", "0") or "0") # Ensure string output
        _assigned_to = work_item.get("assigned_to", "Unassigned")

        return _description, _story_points, _assigned_to
    except (ValueError, IndexError, AttributeError) as e:
        print(f"Error populating work item info: {e}")
        return f"Error: {str(e)}", "0", "Error"
    except Exception as e:
        print(f"Unexpected error populating work item info: {e}")
        return f"Unexpected Error: {str(e)}", "0", "Error"


def get_workitem_dataframe() -> pd.DataFrame:
    """Creates a pandas DataFrame from the current_work_items_data."""
    data = []
    try:
        for item_type, item_list in current_work_items_data.items():
            for item in item_list:
                data.append({
                    "Story ID": item.get("id"),
                    "Type": item_type,
                    "Title": item.get("title"),
                    "State": item.get("state"),
                    "Assigned To": item.get("assigned_to"),
                    "SP": str(item.get("story_points", "1") or "1"), # Ensure string output
                    "Created Date": item.get("created_date"),
                })
    except Exception as e:
        print(f"Error preparing work item dataframe: {e}")

    if not data:
        return pd.DataFrame(columns=["Story ID", "Type", "Title", "State",  "Assigned To","SP","Created Date"])

    result_dataframe = pd.DataFrame(data)
    # Ensure columns are in the desired order and handle potential missing columns
    desired_columns = ["Story ID", "Type", "Title", "State", "Assigned To", "SP", "Created Date"]
    result_dataframe = result_dataframe.reindex(columns=desired_columns)

    # Sort and drop the Created Date column for display
    result_dataframe = result_dataframe.sort_values(by="Created Date", na_position='last').reset_index(drop=True)
    result_dataframe = result_dataframe.drop("Created Date", axis=1)

    return result_dataframe


def get_sprint_info_ui(sprint_num: str | None):
    """Fetches sprint info and updates UI components."""
    global current_work_items_data
    global current_iteration_path

    # Reset state when sprint changes or is cleared
    current_work_items_data = {}
    current_iteration_path = None
    work_item_dropdown_choices = []
    df = get_workitem_dataframe() # Get empty/current dataframe

    if sprint_num is None:
        print("No sprint number provided")
        return work_item_dropdown_choices, work_item_dropdown_choices, df, "" # Return empty choices and dataframe

    try:
        sprint_number = int(sprint_num)
        sprint_name = os.environ.get("SPRINT_NAME", "Sprint ") + str(sprint_number) # Use environment variable for base name

        if not ORGANIZATION or not PROJECT or not TEAM:
             return work_item_dropdown_choices, work_item_dropdown_choices, df, "Error: Azure DevOps configuration missing."

        iteration_info = get_iteration_info(ORGANIZATION, PROJECT, TEAM, sprint_name)

        if not iteration_info:
            return work_item_dropdown_choices, work_item_dropdown_choices, df, f"Error: Sprint '{sprint_name}' not found."

        current_iteration_path = iteration_info.get("path") # Store the full iteration path

        # Fetch work items using the helper function
        work_items_data = get_all_work_items(ORGANIZATION, PROJECT, TEAM, iteration_info["id"])

        if work_items_data is None:
             return work_item_dropdown_choices, work_item_dropdown_choices, df, f"Error fetching work items for sprint '{sprint_name}'."

        current_work_items_data = work_items_data # Store fetched data

        # Prepare dropdown choices
        for item_type, items in current_work_items_data.items():
            for item in items:
                 # Ensure item has 'id' and 'title' before adding
                if item and item.get("id") is not None and item.get("title") is not None:
                    work_item_dropdown_choices.append(f"{item['id']} - {item['title']}")

        df = get_workitem_dataframe() # Generate dataframe from fetched data

        print(f"Returning {len(work_item_dropdown_choices)} work items for sprint {sprint_num}")
        return gr.update(choices=work_item_dropdown_choices), gr.update(choices=work_item_dropdown_choices), df, f"Successfully loaded sprint {sprint_num}."

    except ValueError:
        return work_item_dropdown_choices, work_item_dropdown_choices, df, "Invalid sprint number."
    except Exception as e:
        print(f"Error getting sprint info: {e}")
        return work_item_dropdown_choices, work_item_dropdown_choices, df, f"An unexpected error occurred: {str(e)}"


def create_task_for_sprint_init_ui():
    """Initializes placeholder tasks for work items in the current sprint."""
    if not current_work_items_data:
        return "❌ No sprint data loaded. Please select a sprint first."

    if not ORGANIZATION or not PROJECT:
         return "❌ Error: Azure DevOps configuration missing."

    success_count = 0
    fail_count = 0

    for work_item_type, work_items in current_work_items_data.items():
        print(f"Attempting to create tasks for {work_item_type}s")
        for single_work_item in work_items:
            item_id = single_work_item.get("id")
            item_title = single_work_item.get("title", "Untitled")
            assigned_to = single_work_item.get("assigned_to")
            story_points = single_work_item.get("story_points")

            if item_id is None:
                print(f"Skipping work item with missing ID: {item_title}")
                fail_count += 1
                continue

            # Check if tasks already exist for this work item (optional, but good practice)
            # This would require fetching relations for each work item, which can be slow.
            # For simplicity in this refactor, we'll skip this check unless explicitly requested.
            tasks = get_tasks_linked_to_work_item(ORGANIZATION, PROJECT, item_id)
            if tasks:
                print(f"Tasks already exist for work item {item_id}. Skipping.")
                continue

            # Determine original estimate
            original_estimate = 8 # Default estimate
            if work_item_type == "User Story" and story_points is not None:
                try:
                    original_estimate = int(story_points) * 8
                except (ValueError, TypeError):
                    print(f"Warning: Could not parse story points '{story_points}' for item {item_id}. Using default estimate.")
                    original_estimate = 8
            elif work_item_type == "Bug":
                 # You might have a different default or logic for bugs
                 original_estimate = single_work_item.get("original_estimate", 8)


            # Create the task
            res = create_task(
                organization=ORGANIZATION,
                project=PROJECT,
                task_title=f"WM - Develop for {item_title}",
                parent_id=item_id,
                task_description="Placeholder task to log your efforts.",
                task_assigned_to=assigned_to if assigned_to != "Not Assigned Yet" else None,
                iteration_path=current_iteration_path,
                area_path=AREA_PATH,
                original_estimate=original_estimate
            )

            if res and res.get("id"):
                print(f"Created task {res['id']} for work item {item_id}")
                success_count += 1
            else:
                print(f"Failed to create task for work item {item_id}. Response: {res}")
                fail_count += 1

    return f"✅ Task initialization complete. Successfully created {success_count} tasks, failed for {fail_count} items."

def update_status_via_transcript_ui(work_item_dataframe: pd.DataFrame):
    """Updates status for work items based on the processed transcript DataFrame."""
    if work_item_dataframe.empty:
        return "No status updates to apply."

    if not ORGANIZATION or not PROJECT:
         return "Error: Azure DevOps configuration missing."

    success_count = 0
    fail_count = 0

    for index, row in work_item_dataframe.iterrows():
        item_id = row.get("Story ID")
        status_comment = row.get("Status")

        if item_id is None or pd.isna(item_id) or not isinstance(item_id, (int, float)):
             print(f"Skipping row with invalid Story ID: {item_id}")
             fail_count += 1
             continue

        # Ensure item_id is an integer
        item_id = int(item_id)

        if status_comment and pd.notna(status_comment):
            # Use the helper function to add the comment
            # res = comment_on_work_item(ORGANIZATION, PROJECT, item_id, str(status_comment)) # Ensure comment is a string

            # if "Comment added." in res:
            #     print(f"Updated status for work item {item_id}")
            #     success_count += 1
            # else:
            #     print(f"Failed to update status for work item {item_id}. Result: {res}")
            #     fail_count += 1
            update_status_via_slack_ui(str(item_id),status_comment)
            print(f"Updated status for work item {item_id}")
            success_count += 1
        else:
            print(f"Skipping work item {item_id} due to empty status.")
            # Decide if this should count as a failure or just a skip
            fail_count += 1 # Uncomment if empty status should be a failure

    return f"Status update complete. Successfully updated {success_count} work items, failed for {fail_count} items.", None, None


def update_status_via_slack_ui(work_item_id_title: str | None, status: str):
    """Sends a status update to a Slack webhook."""
    if not work_item_id_title:
        return "Error: No work item selected."

    if not WINGMAN_UPDATE_STATUS_SLACK_URL:
        return "Error: Slack webhook URL not configured."

    try:
        item_id = int(work_item_id_title.split(" - ")[0].strip())
        data = {
            "message": status,
            "id": str(item_id) # Ensure ID is a string for the payload
        }
        response = requests.post(WINGMAN_UPDATE_STATUS_SLACK_URL, json=data)
        response.raise_for_status() # Raise HTTPError for bad responses
        return "Status updated via Slack.",""
    except (ValueError, IndexError, TypeError) as e:
        print(f"Error parsing work item ID: {e}")
        return f"Error: Invalid work item selection - {str(e)}",""
    except requests.exceptions.RequestException as e:
        print(f"Error sending status to Slack: {e}")
        return f"Error sending status update to Slack: {str(e)}",""
    except Exception as e:
        print(f"An unexpected error occurred during Slack update: {e}")
        return f"An unexpected error occurred: {str(e)}",""


# --- Gradio UI Layout ---
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
                choices=[None] + list(range(0, 7)), # Assuming sprints 0-6
                label="📅 Select Sprint Number",
                interactive=True,
                value=None # Start with no sprint selected
            )
            status_message = gr.Markdown("")
            with gr.Accordion("Admin Actions", open=False):
                admin_action = gr.Button("Initialize Tasks for Sprint", variant="primary")

            admin_action.click(
                create_task_for_sprint_init_ui,
                outputs=status_message
            )

    # Sprint Dashboard
    with gr.Accordion("🏠 Sprint Dashboard", open=True): # Open by default for visibility
        with gr.Row(elem_classes="dashboard"):
            current_sprint_df = gr.DataFrame(
                value=pd.DataFrame(columns=["Story ID", "Type", "Title", "State",  "Assigned To","SP"]),
                wrap=True,
                show_label=False,
                show_copy_button=True,
                max_height=300
            )

    # Work Item Section
    with gr.Tabs() as tabs:
        # Update Status via Manual Input
        with gr.TabItem("📊 Update Status (Manual)"):
            with gr.Row():
                with gr.Column(scale=1):
                    update_item_dropdown = gr.Dropdown(
                        choices=[], # Populated by sprint selection
                        label="Select Work Item",
                        interactive=True,
                        value=None
                    )
                    update_status_textbox = gr.Textbox(label="Status Update (for Slack/Comment)", lines=2, submit_btn=True)
                    update_status_button = gr.Button("Update Status", variant="primary")

                    update_status_button.click(
                        update_status_via_slack_ui, # Call Slack update function
                        inputs=[update_item_dropdown, update_status_textbox],
                        outputs=[status_message,update_status_textbox] # Use the main status message area
                    )
                    update_status_textbox.submit( # Allow submitting with Enter key
                         update_status_via_slack_ui,
                         inputs=[update_item_dropdown, update_status_textbox],
                         outputs=[status_message,update_status_textbox]
                    )


        # Update Status Via Transcript
        with gr.TabItem("📊 Update Status Via Transcript"):
            with gr.Row():
                with gr.Column(scale=1):
                    status_transcript_df = gr.DataFrame(
                        value=pd.DataFrame(columns=["Story ID", "Title","Status"]),
                        interactive=True,
                        wrap=True,
                        show_label=False,
                        show_copy_button=True,
                        max_height=300
                    )
                    upload_transcript = gr.File(label="Upload Transcript (.txt)", file_types=[".txt"])
                    process_transcript_button = gr.Button("Process Transcript", variant="secondary")
                    apply_status_button = gr.Button("Apply Status Updates", variant="primary")

                    process_transcript_button.click(
                        get_status_from_transcript,
                        inputs=[current_sprint_df, upload_transcript],
                        outputs=[status_transcript_df, status_message] # Output DataFrame and status message
                    )
                    apply_status_button.click(
                        update_status_via_transcript_ui,
                        inputs=[status_transcript_df],
                        outputs=[status_message, status_transcript_df, upload_transcript] # Output status message
                    )


        # Combined Work Item Selection and Management Tab
        with gr.TabItem("📋 Work Item Management"):
            with gr.Row():
                # Left column for selection and details
                with gr.Column(scale=1):
                    work_items_dropdown = gr.Dropdown(
                        choices=[], # Populated by sprint selection
                        label="Select Work Item",
                        interactive=True,
                        value=None # Start with no item selected
                    )

                    with gr.Group():
                        gr.Markdown("### Details")
                        story_points_display = gr.Textbox(label="Story Points", interactive=False)
                        assigned_to_display = gr.Textbox(label="Assigned To", interactive=False)

                    # Use Markdown component to display potentially HTML description
                    description_display = gr.Markdown(label="Description")

                # Right column for task creation
                with gr.Column(scale=1):
                    gr.Markdown("### Create Task")
                    task_title_input = gr.Textbox(label="Task Title", value="WM - Develop")
                    task_description_input = gr.Textbox(label="Task Description", value="Develop Placeholder", lines=3)

                    with gr.Row():
                        task_assigned_to_dropdown = gr.Dropdown(
                            choices=["Unassigned"] + LIST_OF_NAMES, # Add Unassigned option
                            label="Assigned To",
                            value="Unassigned",
                        )
                        original_estimate_input = gr.Textbox(label="Hours", value="8", type="text") # Keep as text for flexibility

                    create_task_button = gr.Button("Create Task", variant="primary")
                    task_status_message = gr.Markdown("") # Dedicated status for task creation

                    create_task_button.click(
                        call_create_task_ui,
                        inputs=[work_items_dropdown, task_title_input, task_description_input, task_assigned_to_dropdown, original_estimate_input],
                        outputs=task_status_message
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
                        msg_input = gr.Textbox(
                            label="Share your thoughts with the Technical Lead",
                            placeholder="Type your message here...",
                            lines=3,
                            show_label=False
                        )
                        send_btn = gr.Button("Send", variant="primary")

                    with gr.Row(elem_classes="centered"):
                        clear_btn = gr.Button("Reset Chat", variant="secondary")

            # Chat interactions
            msg_input.submit(respond, [msg_input, chatbot, work_items_dropdown], [msg_input, chatbot])
            send_btn.click(respond, [msg_input, chatbot, work_items_dropdown], [msg_input, chatbot])
            clear_btn.click(clear_chat_history, None, [chatbot])


    # --- Event Listeners ---

    # Update UI when sprint number changes
    sprint_num_dropdown.change(
        get_sprint_info_ui,
        inputs=sprint_num_dropdown,
        outputs=[work_items_dropdown, update_item_dropdown, current_sprint_df, status_message]
    )

    # Update work item details when a work item is selected in the dropdown
    work_items_dropdown.change(
        populate_work_items_info_ui,
        inputs=work_items_dropdown,
        outputs=[description_display, story_points_display, assigned_to_display]
    )

# --- Launch the app ---
demo.launch()
# --- END OF FILE gradio_ui.py ---