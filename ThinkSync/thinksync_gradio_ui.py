import gradio as gr
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

from ThinkSync.thinksync_main import ThinkSyncManager

load_dotenv()

think_sync_manager = ThinkSyncManager()


def get_notes():
    notes = think_sync_manager.get_notes()
    if notes:
        notes_df = pd.DataFrame(notes)
        notes_df = notes_df.sort_values(by="timestamp", ascending=False)
        notes_df["timestamp"] = pd.to_datetime(notes_df["timestamp"])
        notes_df["timestamp"] = notes_df["timestamp"].dt.strftime("%A, %d %B %Y")
        return notes_df
    else:
        return pd.DataFrame(columns=["timestamp", "message"])


def take_note(note, notes_df):
    if not note.strip():
        # Create HTML notification for warning
        warning_html = """<div style="padding: 10px; background-color: #fff3cd; color: #856404; border-radius: 4px; margin-bottom: 10px;">
            <strong>Warning:</strong> Please enter a note first.
        </div>"""
        return notes_df, warning_html, "", pd.DataFrame(think_sync_manager.extract_actions_from_note(),
                                                        columns=["Action Items"])

    think_sync_manager.take_notes(note)
    new_notes_df = get_notes()
    action_items_df = pd.DataFrame(think_sync_manager.extract_actions_from_note(), columns=["Action Items"])

    # Create HTML notification for success
    success_html = """<div style="padding: 10px; background-color: #d4edda; color: #155724; border-radius: 4px; margin-bottom: 10px;">
        <strong>Success:</strong> Note added successfully!
    </div>"""
    return new_notes_df, success_html, "", action_items_df


def filter_notes(search_term, date_filter, notes_df):
    if notes_df.empty:
        return notes_df

    filtered_df = notes_df.copy()

    # Apply search filter if provided
    if search_term:
        filtered_df = filtered_df[filtered_df["message"].str.contains(search_term, case=False)]

    # Apply date filter if provided
    if date_filter:
        date_str = datetime.strptime(date_filter, "%Y-%m-%d").strftime("%A, %d %B %Y")
        filtered_df = filtered_df[filtered_df["timestamp"].str.contains(date_str, case=False)]

    return filtered_df


def reset_notes_func():
    think_sync_manager.reset_my_notes()

    # Create HTML notification for reset
    reset_html = """<div style="padding: 10px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-bottom: 10px;">
        <strong>Reset:</strong> All notes have been deleted.
    </div>"""

    return (
        pd.DataFrame(columns=["timestamp", "message"]),
        reset_html,
        pd.DataFrame(columns=["Action Items"])
    )


def clear_filters(df):
    # Create HTML notification for filters cleared
    info_html = """<div style="padding: 10px; background-color: #d1ecf1; color: #0c5460; border-radius: 4px; margin-bottom: 10px;">
        <strong>Info:</strong> Filters have been cleared.
    </div>"""

    return "", "", get_notes(), info_html


with gr.Blocks(theme=gr.themes.Soft(primary_hue="blue")) as demo:
    gr.Markdown("# ThinkSync - Note Taking & Action Item Tracker")

    with gr.Row():
        # Left column for input and filters
        with gr.Column(scale=1):
            note_input = gr.Textbox(
                label="Take a New Note",
                placeholder="Type your note here...",
                lines=4,
                show_label=True
            )

            with gr.Row():
                submit_btn = gr.Button("Add Note", variant="primary")
                clear_btn = gr.Button("Clear")

            # Notification area with HTML
            notification = gr.HTML()

            # Filters in an accordion
            with gr.Accordion("Filter Notes", open=False):
                search_term = gr.Textbox(label="Search in notes", placeholder="Enter keywords...")
                date_filter = gr.Textbox(label="Filter by date (YYYY-MM-DD)", placeholder="e.g. 2025-04-22")
                with gr.Row():
                    filter_btn = gr.Button("Apply Filters", variant="primary")
                    clear_filter_btn = gr.Button("Clear Filters")

            # Settings in an accordion
            with gr.Accordion("Settings", open=False):
                reset_btn = gr.Button("Reset All Notes", variant="stop")
                gr.Markdown("⚠️ Warning: This will delete all data")

        # Right column for the unified view
        with gr.Column(scale=2):
            gr.Markdown("### Your Notes")
            notes_df = gr.Dataframe(
                value=get_notes(),
                headers=["Date", "Note Content"],
                datatype=["text", "text"],
                col_count=(2, "fixed"),
                wrap=True,
                max_height=300,
                interactive=False
            )

            gr.Markdown("### Action Items")
            action_items_df = gr.Dataframe(
                value=pd.DataFrame(think_sync_manager.extract_actions_from_note(), columns=["Action Items"]),
                headers=["Action Items"],
                col_count=(1, "fixed"),
                wrap=True,
                max_height=200
            )
            gr.Markdown("*Action items are automatically extracted from your notes*")

    # Event handlers
    submit_btn.click(
        take_note,
        inputs=[note_input, notes_df],
        outputs=[notes_df, notification, note_input, action_items_df]
    )

    clear_btn.click(
        lambda: "",
        outputs=note_input
    )

    filter_btn.click(
        filter_notes,
        inputs=[search_term, date_filter, notes_df],
        outputs=notes_df
    )

    clear_filter_btn.click(
        clear_filters,
        inputs=notes_df,
        outputs=[search_term, date_filter, notes_df, notification]
    )

    reset_btn.click(
        reset_notes_func,
        outputs=[notes_df, notification, action_items_df]
    )

demo.launch()