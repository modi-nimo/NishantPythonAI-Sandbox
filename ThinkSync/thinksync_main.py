import json
import os
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import chromadb

load_dotenv()

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")
chat_session = model.start_chat()

chromadb_client = chromadb.PersistentClient(path=".")
notes_collection = chromadb_client.get_or_create_collection(name="thinksync_notes")

EMBEDDING_MODEL_NAME = "text-embedding-004" # Or a Gemini embedding model if available

class ThinkSyncManager:
    notes: list[dict] = []

    def __init__(self):
        self.load_notes()

    def summarise_notes(self):
        msg = f"""Summarize the below notes briefly. 
        Notes: {self.get_notes()} """

        response = chat_session.send_message(content=msg)
        return response.text

    def extract_actions_from_note(self):
        prompt = f"""
        Identify any action items in the following text. An action item is a task or something that needs to be done. 
        List the action items clearly. If there are no action items, state that explicitly.
        Extract all actionable items from the following note. Present each action item as clear and concise statement.
        
        Consider the following note and the relevant past notes, identify any new action items that need to be done.
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
        self.store_note_with_embeddings(note_dict)
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

    def generate_embeddings_for_note(self, note_content):
        from google import genai
        from google.genai.types import EmbedContentConfig
        client = genai.Client()
        response = client.models.embed_content(
            model=EMBEDDING_MODEL_NAME,
            contents=[note_content],
            config=EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=768
            )
        )
        self.store_notes()
        return response.embeddings[0].values

    def store_note_with_embeddings(self, note:dict):
        embedding = self.generate_embeddings_for_note(note["message"])
        if embedding:
            notes_collection.add(
                documents=[note["message"]],
                embeddings=[embedding],
                metadatas=[{"datetime": note["timestamp"]}],
                ids=[str(note["timestamp"])]
            )
    def retrieve_relevant_notes(self, query_msg, n_result=3):
        new_embedding = self.generate_embeddings_for_note(query_msg)
        if new_embedding:
            results = notes_collection.query(
                query_embeddings=[new_embedding],
                n_results=n_result
            )
            return results["documents"][0]
        return []
