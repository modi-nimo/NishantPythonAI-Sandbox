import json
import os
from datetime import datetime

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")
chat_session = model.start_chat()


class ThinkSyncManager:
    notes: list[dict] = []

    def __init__(self):
        self.load_notes()

    def reset_my_notes(self):
        self.notes = []
        self.store_notes()
        print("Reset whole notes")

    def extract_actions_from_note(self):
        newline = "\n"
        prompt = f"""
        You are an intelligent assistant that helps users create actionable items from their notes. 
        Below is a series of notes, each marked with a timestamp and containing the content of the note.

        Your task is to review the entire sequence of notes and identify specific actions that need to be taken. 
        These action items should be clearly stated and directly derived from the content of the notes. 
        Consider the context of the whole conversation when identifying these actions.

        **Notes:**
        {newline.join(single_note["timestamp"] + " - " + single_note["message"] for single_note in self.get_notes())}

        Output Format: <list of action items separated by new line>
        """

        response = chat_session.send_message(content=prompt)
        action_items = response.text.strip()
        if "no action items" in action_items.lower():
            return []
        else:
            return [item.strip() for item in action_items.split("\n") if item.strip()]

    def take_notes(self, text_note: str):
        note_dict = {
            "timestamp": str(datetime.now()),
            "message": text_note
        }
        self.notes.append(note_dict)
        self.store_notes()

    def load_notes(self):
        try:
            with open("notes.json", "r") as f:
                self.notes = json.load(f)
        except FileNotFoundError:
            self.notes = []
            self.store_notes()

    def store_notes(self):
        with open("notes.json", "w") as f:
            json.dump(self.notes, f, indent=4)

    def get_notes(self):
        return self.notes
