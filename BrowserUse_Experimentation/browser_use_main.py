import asyncio

from browser_use import Agent, Browser, BrowserConfig
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from constants import GEMINI_MODEL

load_dotenv()
# Run command playwright install on terminal

async def perform_task_on_browser(task_to_perform: str) -> str:
    """ Perform a task on the browser """

    browser = Browser(
        config=BrowserConfig(
            headless=True,
            # chrome_instance_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        )
    )

    async with await browser.new_context() as context:
        agent = Agent(
            task=task_to_perform,
            llm=ChatGoogleGenerativeAI(model=GEMINI_MODEL),
            browser_context=context,
            generate_gif=True
        )
        await agent.run()
        res = agent.state.history.history[-1].result[0].extracted_content

        print("-------------------")
        print(res)
        print("-------------------")
        return res


if __name__ == "__main__":
    # task = """
    # Go to google.com , search for IMDB rating of Interstellar and get me following information.
    #         1. Type: Is it a Movie or Series ?
    #         2. Rating: its Imdb Rating
    #         3. Streaming On: On what platform it is streaming.
    #         4. Title: Title of the Movie or Series
    # """

    # task = """
    # Objective: Collect all the movies that are leaving netflix in month of April
    #
    # Step 1: Navigation to Website
    # - Open new tab and go to in.flixboss.com/leaving
    # - If any popup, close it
    #
    # Step 2: Data Extraction
    # - Extract all the movies that are leaving netflix in month of April
    # - For each movie, extract the following details:
    #     - Title
    #     - Release Year
    #     - Rating
    #     - Date Leaving.
    # - Make sure to scroll whole page to load all the movies.
    #
    # Step 3: Data Formatting
    # - Format the data in JSON format.
    #
    #
    # Important: Ensure efficiency and accuracy throughout the process.
    #
    # """

    task = """
    Objective: 
    """
    asyncio.run(perform_task_on_browser(task))