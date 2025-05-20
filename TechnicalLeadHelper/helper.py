# --- START OF FILE helper.py ---
import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from constants import NISHANT_MODI # Assuming constants.py exists and has NISHANT_MODI

load_dotenv()

# --- Configuration ---
PERSONAL_ACCESS_TOKEN = os.environ.get("PERSONAL_ACCESS_TOKEN")
if not PERSONAL_ACCESS_TOKEN:
    raise ValueError("PERSONAL_ACCESS_TOKEN environment variable not set.")

AUTH = ("", PERSONAL_ACCESS_TOKEN)

# Base URL for Azure DevOps API
BASE_URL = "https://dev.azure.com"

# --- Helper Functions ---

def _make_azure_request(method, url, **kwargs):
    """Helper function to make authenticated requests to Azure DevOps API."""
    try:
        response = requests.request(method, url, auth=AUTH, **kwargs)
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return None

def get_iteration_info(organization: str, project: str, team: str, sprint_name: str) -> dict | None:
    """Gets iteration information for a given sprint name."""
    print(f"Getting Iteration info for sprint name: {sprint_name}")
    url = f"{BASE_URL}/{organization}/{project}/{team}/_apis/work/teamsettings/iterations?api-version=7.1"
    data = _make_azure_request("GET", url)

    if data and "value" in data:
        for iteration_data in data["value"]:
            if iteration_data.get("name") == sprint_name:
                return iteration_data
    return None

def extract_message_from_html(html_content: str | None) -> str:
    """Extracts text from HTML content."""
    if not html_content:
        return "No content defined."
    return BeautifulSoup(html_content, 'html.parser').get_text(separator=' ', strip=True)

def get_all_work_items(organization: str, project: str, team: str, iteration_id: str, types: list[str] = None) -> dict:
    """Gets all specified work items for a given iteration ID."""
    if types is None:
        types = ["User Story", "Bug"]

    print(f"Getting all work items for iteration id: {iteration_id}")
    dict_of_all_workitems = {item_type: [] for item_type in types}

    url = f"{BASE_URL}/{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iteration_id}/workitems?api-version=7.1"
    response_data = _make_azure_request("GET", url)

    if response_data and "workItemRelations" in response_data:
        for relation in response_data["workItemRelations"]:
            target_url = relation.get("target", {}).get("url")
            if not target_url:
                continue

            work_item_details = _make_azure_request("GET", target_url)

            if work_item_details:
                fields = work_item_details.get("fields", {})
                work_item_type = fields.get("System.WorkItemType")

                if work_item_type in types:
                    item_info = {
                        "id": work_item_details.get("id"),
                        "title": fields.get("System.Title"),
                        "state": fields.get("System.State"),
                        "assigned_to": fields.get("System.AssignedTo", {}).get("displayName", "Not Assigned Yet"),
                        "comments": fields.get("System.CommentCount", 0),
                        "created_date": fields.get("System.CreatedDate"),
                    }

                    # Map Azure DevOps states to simpler terms
                    if item_info["state"] == "New":
                        item_info["state"] = "To Do"
                    elif item_info["state"] == "Active":
                        item_info["state"] = "In Progress"
                    elif item_info["state"] == "Closed":
                        item_info["state"] = "Done"

                    if work_item_type == "Bug":
                        item_info["original_estimate"] = fields.get("Microsoft.VSTS.Scheduling.OriginalEstimate", 0)
                        item_info["completed_work"] = fields.get("Microsoft.VSTS.Scheduling.CompletedWork", 0)
                        item_info["remaining_work"] = fields.get("Microsoft.VSTS.Scheduling.RemainingWork", 0)
                        item_info["system_info"] = extract_message_from_html(fields.get("Microsoft.VSTS.TCM.SystemInfo"))
                        item_info["resolution"] = extract_message_from_html(fields.get("Microsoft.VSTS.Common.Resolution"))

                    elif work_item_type == "User Story":
                        item_info["acceptance_criteria"] = extract_message_from_html(fields.get("Microsoft.VSTS.Common.AcceptanceCriteria"))
                        item_info["story_points"] = fields.get("Microsoft.VSTS.Scheduling.StoryPoints")
                        # Keeping description as raw HTML for potential display in UI
                        item_info["description"] = fields.get("System.Description", "<p>No Description Defined</p>")

                    dict_of_all_workitems[work_item_type].append(item_info)

    return dict_of_all_workitems

def create_task(organization: str, project: str, task_title: str, parent_id: int | None = None,
                task_description: str | None = None, task_assigned_to: str | None = None,
                iteration_path: str | None = None, area_path: str | None = None,
                original_estimate: int | float | None = None) -> dict | None:
    """Creates a new Task work item."""
    print("Creating a task.")
    url = f"{BASE_URL}/{organization}/{project}/_apis/wit/workitems/$Task?api-version=7.1"
    headers = {"Content-Type": "application/json-patch+json"}

    data = [{"op": "add", "path": "/fields/System.Title", "value": task_title}]

    if iteration_path:
        data.append({"op": "add", "path": "/fields/System.IterationPath", "value": iteration_path})
    if area_path:
        data.append({"op": "add", "path": "/fields/System.AreaPath", "value": area_path})
    if parent_id:
        data.append({
            "op": "add",
            "path": "/relations/-",
            "value": {
                "rel": "System.LinkTypes.Hierarchy-Reverse",
                "url": f"{BASE_URL}/{organization}/{project}/_apis/wit/workitems/{parent_id}",
                "attributes": {"comment": "Parent"}
            }
        })
    if task_description:
        data.append({"op": "add", "path": "/fields/System.Description", "value": task_description})
    if task_assigned_to:
        data.append({"op": "add", "path": "/fields/System.AssignedTo", "value": task_assigned_to})
    if original_estimate is not None:
        data.append({"op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", "value": original_estimate})
        data.append({"op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork", "value": original_estimate})
        data.append({"op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork", "value": 0})

    return _make_azure_request("POST", url, headers=headers, json=data)

def comment_on_work_item(organization: str, project: str, item_id: int, comment: str) -> str:
    """Adds a comment to a work item."""
    print(f"Adding comment to work item {item_id}")
    url = f"{BASE_URL}/{organization}/{project}/_apis/wit/workitems/{item_id}?api-version=7.1"
    headers = {"Content-Type": "application/json-patch+json"}
    data = [{"op": "add", "path": "/fields/System.History", "value": comment}] # Using value directly

    response = _make_azure_request("PATCH", url, headers=headers, json=data)
    return "Comment added." if response else "Failed to add comment. Try again later."

def get_tasks_linked_to_work_item(organization: str, project: str, work_item_id: int) -> list[int]:
    """Gets the IDs of tasks linked to a work item."""
    print(f"Getting tasks linked to work item {work_item_id}")
    url = f"{BASE_URL}/{organization}/{project}/_apis/wit/workitems/{work_item_id}?$expand=relations&api-version=7.1"
    data = _make_azure_request("GET", url)
    tasks = []
    if data and "relations" in data:
        for relation in data.get("relations", []):
            if relation.get("rel") == "System.LinkTypes.Hierarchy-Forward":
                target_url = relation.get("url")
                if target_url:
                    try:
                        task_id = int(target_url.split("/")[-1])
                        tasks.append(task_id)
                    except ValueError:
                        print(f"Could not parse task ID from URL: {target_url}")
                        pass # Ignore invalid URLs

    return tasks

def run_wiql_query(organization: str, project: str, wiql_query: str) -> dict | None:
    """Runs a WIQL query."""
    print("Running WIQL query")
    url = f"{BASE_URL}/{organization}/{project}/_apis/wit/wiql?api-version=7.1"
    headers = {"Content-Type": "application/json"}
    data = {"query": wiql_query}
    return _make_azure_request("POST", url, headers=headers, json=data)

# --- END OF FILE helper.py ---