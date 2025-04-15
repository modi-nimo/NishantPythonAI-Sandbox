import gradio as gr
import pandas as pd
from dotenv import load_dotenv

from ThinkSync.thinksync_main import ThinkSyncManager

ui_history = []

load_dotenv()

think_sync_manager = ThinkSyncManager()

demo = gr.Blocks()

def get_notes_ui():
    notes = think_sync_manager.get_notes()
    if notes:
        notes_df = pd.DataFrame(notes)
        notes_df["timestamp"] = pd.to_datetime(notes_df["timestamp"])
        notes_df["timestamp"] = notes_df["timestamp"].dt.strftime("%A, %d %B %Y ") # %I:%M:%S %p
        return gr.Dataframe(notes_df, label="Notes", type="pandas", interactive=False)
    else:
        return gr.Dataframe(pd.DataFrame(columns=["timestamp", "message"]), label="Notes", type="pandas", interactive=False)

def take_note_from_ui(note):
    think_sync_manager.take_notes(note)
    _action_items = think_sync_manager.extract_actions_from_note()
    return get_notes_ui(),_action_items,""

with demo:
    note_ui = gr.Textbox(label="Note", submit_btn=True)
    with gr.Tab("Notes"):
        reset_notes = gr.Button("Reset Notes")
        notes_list = get_notes_ui()
        reset_notes.click(think_sync_manager.reset_my_notes())

    with gr.Tab("Action Items"):
        action_items = gr.Dataframe(value=pd.DataFrame(think_sync_manager.extract_actions_from_note()),label="Action Items", type="pandas", headers=["Action Item"], interactive=False)
    note_ui.submit(take_note_from_ui, inputs=note_ui, outputs=[notes_list,action_items,note_ui])

demo.launch()

# Share API specification with Nicolay
# Review Abhiruchi's PR for Beacon flow
# "I have reviewed Abhiruchi's PR, found some suggestion, shared with her. She will update it and let me know."
# Check the NotebookSchema Specification