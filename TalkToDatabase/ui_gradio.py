import gradio as gr
import requests


base_url = "http://localhost:8000"

def refresh_database_schema():
    """
    Function to refresh the database schema.
    This is a placeholder function that simulates refreshing the schema.
    """
    response = requests.get(f"{base_url}/refresh_db_schema")
    if response.status_code != 200:
        return "<span style='color: red;'>Error refreshing database schema.</span>"
    return f"<span style='color: green;'> {response.json()['response']} </span>"

smart_db = gr.Blocks()

with smart_db:
    gr.Markdown("# SmartDB - Your AI Database Assistant")
    with gr.Row():
        status = gr.Markdown("## Status: Ready")
    with gr.Row():
        with gr.Column(scale=1):
            refresh_db_button = gr.Button("Refresh Database Schema", variant="primary", elem_id="refresh-button")
            refresh_db_button.click(refresh_database_schema, outputs=status)

    with gr.Row():
        with gr.Column(scale=2):
            query_input = gr.Textbox(label="Enter your query", placeholder="Type your SQL query here...")
            submit_button = gr.Button("Submit Query")

        with gr.Column(scale=1):
            response_output = gr.Textbox(label="Response", interactive=False)

    submit_button.click(fn=lambda x: "This is a placeholder response for: " + x, inputs=query_input, outputs=response_output)

smart_db.launch(share=False, enable_monitoring=True)