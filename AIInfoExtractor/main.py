import gradio as gr
import os
import sys
import io
import threading
import time
from queue import Queue, Empty

import geai_solution  # Imports and loads .env via geai_solution

output_queue = Queue()


class QueueIO:
    def __init__(self, queue_obj, filter_debug_messages=True):
        self.queue = queue_obj
        self.buffer = ""
        self.filter_debug = filter_debug_messages

    def write(self, data):
        self.buffer += data
        while True:
            # Normalize line endings for consistent splitting
            self.buffer = self.buffer.replace('\r\n', '\n').replace('\r', '\n')
            if '\n' in self.buffer:
                line, self.buffer = self.buffer.split('\n', 1)
                if self.filter_debug and line.startswith("DEBUG"):
                    # print(f"Filtered out: {line}", file=sys.__stderr__) # For dev debugging
                    continue  # Skip putting this DEBUG line to queue
                self.queue.put(line + '\n')
            else:
                break  # No more full lines in buffer

    def flush(self):
        if self.buffer:
            # Process any remaining content in the buffer, applying filter
            self.buffer = self.buffer.replace('\r\n', '\n').replace('\r', '\n')
            if not (self.filter_debug and self.buffer.startswith("DEBUG")):
                self.queue.put(self.buffer)
            # Add a newline if the flushed buffer doesn't end with one,
            # only if it wasn't filtered and wasn't empty.
            if not (self.filter_debug and self.buffer.startswith("DEBUG")) and self.buffer and not self.buffer.endswith(
                    '\n'):
                self.queue.put('\n')
            self.buffer = ""

    def isatty(self):
        return False


def run_agent_process_in_thread(uploaded_file_path_1: str, uploaded_file_path_2: str, filter_debug_logs: bool):
    original_stdout = sys.stdout

    if not os.getenv("GEAI_API_KEY") or not os.getenv("GEAI_BASE_URL"):
        output_queue.put("--- CONFIGURATION ERROR ---\n")
        output_queue.put("GEAI_API_KEY or GEAI_BASE_URL environment variables are not set.\n")
        output_queue.put("Please ensure they are set in a .env file or your environment.\n")
        output_queue.put("--- AGENT PROCESS HALTED ---\n")
        output_queue.put(None)
        return

    # Pass the filter_debug_logs flag to QueueIO
    sys.stdout = QueueIO(output_queue, filter_debug_messages=filter_debug_logs)

    try:
        output_queue.put("--- AGENT PROCESS STARTED ---\n")
        output_queue.put(f"Processing File 1: {os.path.basename(uploaded_file_path_1)}\n")
        output_queue.put(f"Processing File 2: {os.path.basename(uploaded_file_path_2)}\n")
        output_queue.put("Please wait, this may take some time...\n\n")

        task_prompt = f"Compare the two PDF files: '{os.path.basename(uploaded_file_path_1)}' and '{os.path.basename(uploaded_file_path_2)}. Also notify the relevant teams.'" \

        geai_solution.tax_handling_team.print_response(task_prompt,stream=True,stream_intermediate_steps=True)
        output_queue.put("\n--- AGENT PROCESS COMPLETED ---\n")

    except Exception as e:
        output_queue.put(f"\n--- UNEXPECTED ERROR IN AGENT THREAD ---\n")
        import traceback
        output_queue.put(traceback.format_exc())
        output_queue.put(f"--- END ERROR --- \n")
    finally:
        if isinstance(sys.stdout, QueueIO):
            sys.stdout.flush()
        sys.stdout = original_stdout
        output_queue.put(None)


def handle_compare_button_click(file_1_obj, file_2_obj):
    if not file_1_obj or not file_2_obj:
        yield "Please upload both PDF files."
        return

    while not output_queue.empty():
        try:
            output_queue.get_nowait()
        except Empty:
            break

    # Determine whether to filter debug logs based on the team's setting
    # If team.debug_mode is False, we want to filter (filter_debug_logs = True)
    # If team.debug_mode is True, we don't want to filter (filter_debug_logs = False)
    should_filter_debug_logs = not geai_solution.tax_handling_team.debug_mode

    thread = threading.Thread(
        target=run_agent_process_in_thread,
        args=(file_1_obj.name, file_2_obj.name, should_filter_debug_logs)  # Pass the flag
    )
    thread.start()

    current_log_display = ""
    while True:
        try:
            message_part = output_queue.get(timeout=0.1)
            if message_part is None: break
            current_log_display += message_part
            yield current_log_display
        except Empty:
            if not thread.is_alive() and output_queue.empty(): break
            yield current_log_display

    thread.join()

    while not output_queue.empty():
        try:
            message_part = output_queue.get_nowait()
            if message_part is None: continue
            current_log_display += message_part
        except Empty:
            break

    yield current_log_display


# --- Gradio UI Definition ---
demo = gr.Blocks(title="Tax Handling Team Agentic AI", theme=gr.themes.Soft())  # Added a soft theme

with demo:
    gr.Markdown(
        """
        <div style="text-align: center;">
            <h1>📄 Tax Handling Team Agentic AI 📊</h1>
            <p>Upload two PDF files to compare their sections. The agent team will process them and show their activities below.</p>
            <p style="font-size:0.9em; color:gray;">Ensure your <code>.env</code> file is configured with <code>GEAI_API_KEY</code> and <code>GEAI_BASE_URL</code>.</p>
        </div>
        """
    )

    with gr.Row():
        file_1_input = gr.File(label="Upload PDF File 1", file_types=[".pdf"], type="filepath", scale=1)
        file_2_input = gr.File(label="Upload PDF File 2", file_types=[".pdf"], type="filepath", scale=1)

    compare_button = gr.Button("🚀 Compare Sections and Notify Teams", variant="primary", scale=1)

    with gr.Accordion("Agent Activity Log ▼", open=True):  # Makes the log collapsible
        activity_log_display = gr.Markdown(
            "Agent activities will appear here once you click the button...",
            elem_id="activity-log"  # For potential CSS styling
        )

    # Simple CSS to make the log look a bit more like a terminal
    demo.css = """
        #activity-log {
            background-color: #f5f5f5; /* Light grey background */
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            max-height: 600px; /* Limit height and make scrollable */
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace; /* Monospace font */
            white-space: pre-wrap; /* Preserve whitespace and wrap lines */
            line-height: 1.4;
        }
        #activity-log h1, #activity-log h2, #activity-log h3 { /* Style headers within log if any */
            font-family: sans-serif;
        }
    """

    compare_button.click(
        fn=handle_compare_button_click,
        inputs=[file_1_input, file_2_input],
        outputs=[activity_log_display]
    )

if __name__ == "__main__":
    demo.launch()