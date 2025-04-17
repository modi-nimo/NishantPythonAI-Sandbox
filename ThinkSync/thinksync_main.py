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

    def summarise_notes(self):
        msg = f"""Summarize the below notes briefly. 
        Notes: {self.get_notes()} """

        response = chat_session.send_message(content=msg)
        return response.text

    def reset_my_notes(self):
        self.notes = []
        self.store_notes()
        print("Reset whole notes")

    def extract_actions_from_note(self):
        prompt = f"""
        Identify any action items in the following text. An action item is a task or something that needs to be done. 
        List the action items clearly. If there are no action items, state that explicitly.
        Extract all actionable items from the following note. Present each action item as clear and concise statement.
        
        Consider the following note and the relevant past notes, identify any new action items that need to be done.
        Understand the conversation context that is happening over the time, through timestamps and then create a list of action items.
        
        Few Acronyms that i use:
        - US : User Story
        
        Notes: {self.get_notes()}
        
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
            json.dump(self.notes, f)

    def get_notes(self):
        return self.notes
