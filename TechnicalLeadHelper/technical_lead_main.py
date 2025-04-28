import json
import os

from groq import Groq
from agno.agent import Agent
from agno.models.google import Gemini
from agno.team import Team
from dotenv import load_dotenv

from TechnicalLeadHelper.helper import get_all_work_items, get_iteration_info, comment_on_work_item, create_task, \
    get_tasks_linked_to_work_item
from constants import GEMINI_MODEL, LIST_OF_NAMES

load_dotenv()

organization: str = os.environ["ORGANIZATION"].replace(" ", "%20")
project: str = os.environ["PROJECT"].replace(" ", "%20")
iteration: str = os.environ["ITERATION"]
area: str = os.environ["AREA"]
team = os.environ["TEAM"].replace(" ", "%20")

all_work_items = {}

def get_current_work_items():
    return all_work_items

def get_tasks_for_all_work_items():
    for work_item_type , work_items in all_work_items.items():
        print("Creating task for work item type:", work_item_type)
        for single_work_item in work_items:
            id = single_work_item["id"]
            tasks = get_tasks_linked_to_work_item(id, organization, project)
            if len(tasks) == 0:
                if single_work_item.get("assigned_to") in LIST_OF_NAMES:
                    res = create_task(
                        task_title="WM - Develop for " + single_work_item["title"],
                        parent_id=id,
                        organization=organization,
                        project=project,
                        task_description="Placeholder task to log your efforts",
                        task_assigned_to=single_work_item["assigned_to"],
                        iteration=iteration,
                        area=area,
                        original_estimate=str(int(single_work_item["story_points"])*8) if single_work_item.get("story_points") else 8
                    )
                    print(res)
                    print(single_work_item["id"])

    print("Done For all work items")

##### TOOLS BOX ######

def get_all_work_items_for_sprint(_sprint_number: int):
    """
    Get all work items for a given sprint number.
    :param _sprint_number: Sprint number to get work items for.
    :return:
    """
    global all_work_items
    global iteration
    iteration = os.environ["ITERATION"] + str(_sprint_number)
    if len(all_work_items.items()) > 0:
        return all_work_items
    sprint_name = os.environ["SPRINT_NAME"] + str(_sprint_number)
    iteration_info = get_iteration_info(organization, project, team, sprint_name)
    all_work_items = get_all_work_items(organization, project, team, iteration_info["id"])
    return all_work_items

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
    print(res)
    _id = res.get("id", "No ID")
    return f"Task created successfully with ID: {_id}"

def rewrite_content(content: str) -> str:
    """
    Rewrite the content to improve the overall quality.
    :param content: Content to be rewritten.
    :return: Rewritten content.
    """
    print("Rewriting content")
    # Use the Gemini model to rewrite the content
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    response = client.chat.completions.create(
        messages=[
            {"role":"system","content":"Please proofread the content. Correct grammatical and spelling mistakes, and improve the overall quality of the content."},
            {"role":"user","content":content}
        ],
        model = "mistral-saba-24b"
    )
    content = response.choices[0].message.content
    return content


##### AGENT #####

content_writer_agent = Agent(
    name="Content Writer Agent",
    model=Gemini(id=GEMINI_MODEL),
    tools=[rewrite_content],
    show_tool_calls=True,
    markdown=True
)

work_item_manager = Agent(
    name="Work Item Manager",
    model=Gemini(id=GEMINI_MODEL),
    tools=[get_count_of_work_items,list_down_all_items_by_type,get_single_work_item_info],
    show_tool_calls=True,
    markdown=True
)

task_and_comment_agent = Agent(
    name="Task and Comment Agent",
    model=Gemini(id=GEMINI_MODEL),
    tools=[add_comment_to_work_item,create_a_task_for_work_item],
    show_tool_calls=True,
    markdown=True
)

technical_lead_team = Team(
    name="Technical Lead Team",
    mode="coordinate",
    model=Gemini(id=GEMINI_MODEL),
    members=[content_writer_agent, work_item_manager, task_and_comment_agent],
    markdown=True,
    description="You are a task router that directs certain tasks to the appropriate agent.",
    instructions="""
     You will perform the tasks and complete it using appropriate agent. Things to consider while performing the tasks:
     1. Whenever user is asking you to add a comment to a work item, rewrite the content of comment , to be grammatical correct, easy to understand and well written.
     2. Whenever user is asking you to create a task, rewrite the task description, to be professionally written without any grammatical errors and spelling mistakes.
     3. Try to answer the user query in a crisp and clear manner.
     
     Always check the task to do before routing to an agent.
     Always respond me the final answer in a markdown format.
     
     Remember: You are the final gatekeeper of the task. You need to make sure that the task is completed by the appropriate agent.
     
     """,
    show_members_responses=True,
    enable_team_history=True,
    share_member_interactions=True,
    debug_mode=True,
    use_json_mode=True
)

# if __name__ == "__main__":
#     sprint_number = 1  # Replace with the desired sprint number
#     get_all_work_items_for_sprint(sprint_number)
#     while True:
#         user_message = input("Enter your message: ")
#         technical_lead_team.print_response(user_message, stream=True)