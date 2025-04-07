import json
import os

from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv

from TechnicalLeadHelper.helper import get_all_work_items, get_iteration_info, comment_on_work_item, create_task
from constants import GEMINI_MODEL

load_dotenv()

organization: str = os.environ["ORGANIZATION"].replace(" ", "%20")
project: str = os.environ["PROJECT"].replace(" ", "%20")
iteration: str = os.environ["ITERATION"]
area: str = os.environ["AREA"]
team = os.environ["TEAM"].replace(" ", "%20")

all_work_items = {}


##### TOOLS BOX ######

def get_all_work_items_for_sprint(sprint_number: int):
    """
    Get all work items for a given sprint number.
    :param sprint_number: Sprint number to get work items for.
    :return:
    """
    global all_work_items
    if len(all_work_items.items()) > 0:
        return all_work_items
    sprint_name = os.environ["SPRINT_NAME"] + str(sprint_number)
    iteration_info = get_iteration_info(organization, project, team, sprint_name)
    all_work_items = get_all_work_items(organization, project, team, iteration_info["id"])


def get_count_of_work_items() -> str:
    """
    Get the count of work items.
    :return: Count of User Stories and Bugs in the sprint.
    """
    print("Getting count of work items")
    if all_work_items:
        return f"There are {len(all_work_items['User Story'])} user stories and {len(all_work_items['Bug'])} bugs in the sprint."
    else:
        return f"There are no work items in the sprint. Please populate the work items first."


def list_down_all_items_by_type(item_type: str) -> str:
    """
    List down all items by type.
    :param item_type: Type of item to list down. Default is "User Story". Possible values are "User Story" and "Bug".
    :return: String containing the list of items.
    """
    print("Listing down all items by type:", item_type)
    if all_work_items.get(item_type):
        list_of_items = [f'ID: {item["id"]} , Title: {item["title"]}' for item in all_work_items[item_type]]
        return '\n'.join(list_of_items)
    else:
        return "No items found for the given type."


def get_single_work_item_info(item_id: int) -> str | dict:
    """
    Get all the information of a single User Story. Information like Title, Description, Assigned To, State, Story Points.
    :param item_id: ID of the work item to get information for.
    :return: String containing the information of the work item.
    """
    print("Getting information for item ID:", item_id)
    for item_type, items in all_work_items.items():
        for item in items:
            if item["id"] == item_id:
                return json.dumps(item)
                # return item
    return "No work item found with the given ID."


def add_comment_to_work_item(item_id: int, comment: str) -> str:
    """
    Add a comment to given work item.
    :param item_id: ID of work item.
    :param comment: Comment to be added.
    :return: Details of Comment added.
    """
    res = comment_on_work_item(item_id, comment, organization, project)
    return res


def create_a_task_for_work_item(item_id: int, task_title: str, task_description: str, task_assigned_to: str,
                                original_estimate: int = 8) -> str:
    """
    Create a task for the given work item.
    :param item_id: ID of the work item.
    :param task_title: Title of the task.
    :param task_description: Description of the task.
    :param task_assigned_to: Assigned to user.
    :param original_estimate: Original estimate of the task.
    :return: Task created successfully message.
    """
    res = create_task(task_title=task_title, parent_id=item_id, organization=organization, project=project,
                      task_description=task_description, task_assigned_to=task_assigned_to, iteration=iteration,
                      area=area, original_estimate=original_estimate)
    _id = res.get("id", "No ID")
    return f"Task created successfully with ID: {_id}"


##### AGENT #####

technical_lead_agent = Agent(
    name="Technical Lead Agent",
    model=Gemini(id=GEMINI_MODEL),
    tools=[get_count_of_work_items, list_down_all_items_by_type, get_single_work_item_info, add_comment_to_work_item,
           create_a_task_for_work_item],
    show_tool_calls=True,
    markdown=True
)

if __name__ == "__main__":
    sprint_number = 1  # Replace with the desired sprint number
    get_all_work_items_for_sprint(sprint_number)
    while True:
        user_message = input("Enter your message: ")
        technical_lead_agent.print_response(user_message, stream=True)