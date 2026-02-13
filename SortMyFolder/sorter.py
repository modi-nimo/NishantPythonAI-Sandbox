import os
import shutil
import mimetypes
import time
import base64
from pathlib import Path
from typing import Optional, Tuple
from dotenv import load_dotenv
from PIL import Image
import PyPDF2
from openai import OpenAI

# Load environment variables
load_dotenv()

class SmartSorter:
    def __init__(self, api_key: Optional[str] = None):
        # Point to LM Studio local server
        self.base_url = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
        self.api_key = os.getenv("LM_STUDIO_API_KEY", "lm-studio") # Key doesn't matter for local
        
        try:
            self.client = OpenAI(base_url=self.base_url, api_key=self.api_key)
            print(f"Connected to LM Studio at {self.base_url}")
            # Try to get the loaded model ID, fallback to user env or default
            try:
                models = self.client.models.list()
                if models.data:
                    self.model_name = models.data[0].id
                    print(f"Using loaded model: {self.model_name}")
                else:
                    self.model_name = os.getenv("LM_STUDIO_MODEL", "local-model")
                    print(f"No models found in list. Using configured name: {self.model_name}")
            except Exception as e:
                self.model_name = os.getenv("LM_STUDIO_MODEL", "local-model")
                print(f"Could not auto-detect model: {e}. Using configured name: {self.model_name}")

        except Exception as e:
            print(f"Warning: Could not connect to LM Studio: {e}")
            self.client = None

        self.existing_folders = set()

        # Basic extension mapping
        self.EXT_MAP = {
            'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.heic', '.webp'],
            'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.csv', '.ppt', '.pptx'],
            'Audio': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'],
            'Video': ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'],
            'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz'],
            'Installers': ['.dmg', '.pkg', '.iso', '.exe', '.msi'],
            'Code': ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.json', '.xml', '.yaml', '.yml', '.sql', '.ipynb']
        }

    def scan_directory(self, path: Path):
        """Yields files from the directory."""
        if not path.exists():
            print(f"Directory not found: {path}")
            return

        for entry in path.iterdir():
            if entry.is_file() and entry.name != '.DS_Store' and not entry.name.startswith('.'):
                yield entry

    def scan_existing_folders(self, path: Path):
        """Scans for existing directories to reuse."""
        self.existing_folders = set()
        if not path.exists():
            return
            
        for entry in path.iterdir():
            if entry.is_dir() and not entry.name.startswith('.'):
                self.existing_folders.add(entry.name)
        
        if self.existing_folders:
            print(f"Found existing folders: {', '.join(sorted(list(self.existing_folders)))}")

    def get_basic_category(self, file_path: Path) -> str:
        """Determines category based on file extension."""
        ext = file_path.suffix.lower()
        for category, extensions in self.EXT_MAP.items():
            if ext in extensions:
                return category
        return "Others"

    def _encode_image(self, image_path):
        """Encodes image to base64 string."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def _generate_with_retry(self, messages):
        """Helper to call OpenAI API with retry logic."""
        max_retries = 3
        base_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=20
                )
                content = response.choices[0].message.content
                if content:
                    return content.strip().replace("/", "_").replace("\\", "_").replace('"', '').replace("'", "")
                return None
            except Exception as e:
                print(f"  [LM Studio Error] Attempt {attempt+1}/{max_retries}: {e}")
                time.sleep(base_delay * (attempt + 1))
        
        raise Exception("Max retries exceeded.")

    def get_smart_category(self, file_path: Path) -> str:
        """Uses Local LLM to determine a more specific category."""
        if not self.client:
            return self.get_basic_category(file_path)

        mime_type, _ = mimetypes.guess_type(file_path)
        
        folder_hint = ""
        if self.existing_folders:
            folder_list = ", ".join(sorted(list(self.existing_folders)))
            folder_hint = f" Existing folders involved: {folder_list}. PREFER using one of these if applicable."
            
        system_prompt = f"You are a file organizer. Analyze the content and suggest a single, short folder name (max 2 words) like 'Invoices', 'Vacation', 'Code', 'Receipts'.{folder_hint} Return ONLY the folder name string. Do not output JSON. Do not output markdown. Do not provide explanations."

        try:
            # Handle Images
            if mime_type and mime_type.startswith('image'):
                try:
                    base64_image = self._encode_image(file_path)
                    
                    # Prepare image message format compatible with OpenAI Vision
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user", 
                            "content": [
                                {"type": "text", "text": "Categorize this image into a single folder name."},
                                {
                                    "type": "image_url", 
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                    
                    result = self._generate_with_retry(messages)
                    if result: return result
                except Exception as e:
                    # Fallback for non-vision models or errors
                    print(f"  [Vision Error] {e}")

            # Handle Text-based Documents
            text_content = ""
            if file_path.suffix.lower() == '.pdf':
                try:
                    with open(file_path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        if len(reader.pages) > 0:
                            text_content = reader.pages[0].extract_text()[:1000] 
                except Exception:
                    pass
            elif file_path.suffix.lower() in ['.txt', '.md', '.py', '.json', '.csv', '.html', '.css', '.js', '.ipynb', '.sql']:
                try:
                    with open(file_path, 'r', errors='ignore') as f:
                        text_content = f.read(1000)
                except Exception:
                    pass
            
            if text_content:
                result = self._generate_with_retry([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Categorize this file content into a folder name:\n\n{text_content}"}
                ])
                if result: return result
                
        except Exception as e:
             # print(f"  [AI Error] Could not categorize {file_path.name}: {e}")
             pass

        # Fallback if AI fails 
        return self.get_basic_category(file_path)

    def sort_file(self, file_path: Path, use_smart: bool = False, dry_run: bool = True):
        """Determines destination and moves file."""
        if use_smart:
            print(f"🤖 Analyzing: {file_path.name}...")
            category = self.get_smart_category(file_path)
            
            # Defensive cleanup for chatty local models
            if category:
                # Remove common JSON/Markdown characters
                for char in ['{', '}', '"', "'", '`', '*', '[', ']']:
                    category = category.replace(char, '')
                
                category = category.strip()
                # Split by newline and take first non-empty line
                lines = [line.strip() for line in category.split('\n') if line.strip()]
                if lines:
                    category = lines[0]
                    # If it looks like a key-value pair "Category: Finance", take the last part
                    if ':' in category:
                        category = category.split(':')[-1].strip()
                else:
                    category = "Others"

            if len(category) > 20 or not category:
                category = self.get_basic_category(file_path)
        else:
            category = self.get_basic_category(file_path)
        
        # Final safety cleanup for filenames
        category = "".join([c for c in category if c.isalpha() or c.isdigit() or c in (' ', '_', '-')]).strip()
        if not category: category = "Others"

        dest_dir = file_path.parent / category
        dest_path = dest_dir / file_path.name

        # Handle duplicates
        counter = 1
        while dest_path.exists():
            stem = file_path.stem
            suffix = file_path.suffix
            dest_path = dest_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        print(f"  -> Moving to: {category}/{dest_path.name}")

        if not dry_run:
            dest_dir.mkdir(exist_ok=True)
            shutil.move(str(file_path), str(dest_path))
