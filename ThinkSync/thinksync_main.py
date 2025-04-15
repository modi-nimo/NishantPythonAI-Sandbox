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

    def take_notes(self,text_note: str):
        self.notes.append({
            "timestamp": str(datetime.now()),
            "message": text_note
        })
        self.store_notes()
        res = self.summarise_notes()
        print(res)
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


# think_sync_manager = ThinkSyncManager()
# think_sync_manager.take_notes("Hi, This is my first note.")
# think_sync_manager.take_notes("Ohh, i think i need to rethink if its First or Start of notes")
# think_sync_manager.store_notes()
# print(think_sync_manager.get_notes())