import base64

from dotenv import load_dotenv

load_dotenv()

import os
import google.generativeai as genai

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
final_html_output = ""


def upload_to_gemini(path, mime_type=None):
    file = genai.upload_file(path, mime_type=mime_type)
    print(f"Uploaded file '{file.display_name}' as: {file.uri}")
    return file


def image_to_html(image_path: str) -> str:
    """
    This function will convert your image to HTML Code. The input to this function is path to image and output is HTML code.
    :param image_path: The path of image
    :return: HTML Code
    """
    global final_html_output
    final_html_output = ""
    # Create the model
    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash-exp",
        generation_config=generation_config,
    )

    # You may need to update the file paths
    files = [
        upload_to_gemini(image_path, mime_type="image/jpeg"),
    ]

    chat_session = model.start_chat(
        history=[
            {
                "role": "user",
                "parts": [
                    files[0],
                ],
            },
        ]
    )
    prompt = """Can you generate a HTML code for this screenshot that looks exactly like this.
    I want the output in following format:
    {"html": <generated_html_code>}
    Do not add ```json or ```  in the output.
    """
    response = chat_session.send_message(prompt)
    received_response = response.text.replace("```json", "").replace("```", "")
    try:
        received_response = eval(received_response)
        final_html_output = received_response = received_response.get("html", "")
    except:
        print("Error in response")

    with open("output.html", "w") as file:
        file.write(received_response)
    return "I have generated the HTML code as per the given image"


def instruction_to_html(instruction: str) -> str:
    """
    This function will convert your user instruction to HTML Code. The input to this function is instruction and output is HTML code.
    :param instruction: The changes  user want in the HTML code
    :return:
    """
    # Create the model
    global final_html_output
    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
    )

    chat_session = model.start_chat(
        history=[
            {
                "role": "user",
                "parts": [final_html_output],
            },
        ]
    )
    prompt = """User has requested for following changes in the HTML code: """ + instruction + """
    Can you regenerate the whole HTML code with the given changes.
    I want the output in following format:
    {"html": <complete_regenerated_html_code>}
    Do not add ```json or ```  in the output.
    """
    response = chat_session.send_message(prompt)
    received_response = response.text.replace("```json", "").replace("```", "")
    try:
        received_response = eval(received_response)
        final_html_output = received_response = received_response.get("html", "")
    except:
        print("Error in response")

    with open("output.html", "w") as file:
        file.write(received_response)
    return "Instruction corrected in HTML"


def content_specification(content_specificatiion: str) -> str:
    """
    This function should be used when user want to replace the Content of page with certain theme / content.
    :param content_specificatiion: Type of content user want to replace the HTML with.
    :return:
    """
    # Create the model
    global final_html_output
    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
    )

    chat_session = model.start_chat(
        history=[
            {
                "role": "user",
                "parts": [final_html_output],
            },
        ]
    )
    prompt = """
    User want to rewritten the whole HTML code around following content or theme: """ + content_specificatiion + """
    Make sure you replace all Lorem Ipsum with the content related to the theme.
    DO NOT REPLACE ANY ELEMENT OR CHANGE ANY COLOR OR ANY HTML ELEMENT. Just replace the text. 

    Understand the nature of theme and try to maintain same tone and style of the content.

    I want the output in following format:
    {"html": <complete_regenerated_html_code>}
    Do not add ```json or ```  in the output.
    """
    response = chat_session.send_message(prompt)
    received_response = response.text.replace("```json", "").replace("```", "")
    try:
        received_response = eval(received_response)
        final_html_output = received_response = received_response.get("html", "")
    except:
        print("Error in response")

    with open("output.html", "w") as file:
        file.write(received_response)
    return "Content Specification added to HTML"