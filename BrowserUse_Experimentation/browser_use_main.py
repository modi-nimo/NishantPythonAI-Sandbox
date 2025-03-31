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
            generate_gif=False
        )
        await agent.run()
        res = agent.state.history.history[-1].result[0].extracted_content

        print("-------------------")
        print(res)
        print("-------------------")
        return res

#
# if __name__ == "__main__":
#     task = """
#     Go to google.com , search for IMDB rating of Interstellar and get me following information.
#             1. Type: Is it a Movie or Series ?
#             2. Rating: its Imdb Rating
#             3. Streaming On: On what platform it is streaming.
#             4. Title: Title of the Movie or Series
#     """
#     asyncio.run(perform_task_on_browser(task))