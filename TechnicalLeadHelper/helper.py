import os

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from constants import NISHANT_MODI

load_dotenv()

personal_access_token = os.environ["PERSONAL_ACCESS_TOKEN"]
auth = ("", personal_access_token)

def get_iteration_info(organization, project, team,  _sprint_name):
    print("Getting Iteration info for sprint name:", _sprint_name)
    url = f"https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations?api-version=7.1"

    response = requests.get(url, auth=auth)

    data = response.json()

    for single_data in data["value"]:

        if single_data["name"] == _sprint_name:
            return single_data

    return None

def extract_message_from_html(_html):
    resp = BeautifulSoup(_html, 'html.parser').text
    return resp


def get_all_work_items(organization, project, team, iteration_id, types=["User Story", "Bug"]):
    print("Getting all work items for iteration id:", iteration_id)
    dict_of_all_workitems = {
        "Bug": [],
        "User Story": []
    }  # Key is the type of work item and value is the list of work items

    url = f"https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iteration_id}/workitems?api-version=7.1"

    response = requests.get(url, auth=auth)

    for single_res in response.json()["workItemRelations"]:

        url_resp = requests.get(single_res["target"]["url"], auth=auth)

        work_item_details = url_resp.json()

        id = work_item_details["id"]

        work_item_type = work_item_details["fields"]["System.WorkItemType"]

        work_item_info = {"id": id}

        if work_item_type in types:

            work_item_details_fields = work_item_details["fields"]

            work_item_info["title"] = work_item_details_fields["System.Title"]

            work_item_info["state"] = work_item_details_fields["System.State"]
            if work_item_info["state"] == "New":
                work_item_info["state"] = "To Do"
            elif work_item_info["state"] == "Active":
                work_item_info["state"] = "In Progress"
            elif work_item_info["state"] == "Closed":
                work_item_info["state"] = "Done"

            work_item_info["assigned_to"] = work_item_details_fields.get("System.AssignedTo",
                                                                         {"displayName": "Not Assigned Yet"}).get(
                "displayName")

            work_item_info["comments"] = work_item_details_fields.get("System.CommentCount", 0)
            work_item_info["created_date"] = work_item_details_fields.get("System.CreatedDate", None)

            if work_item_type == "Bug":

                work_item_info["original_estimate"] = work_item_details_fields.get(
                    "Microsoft.VSTS.Scheduling.OriginalEstimate", 0)

                work_item_info["completed_work"] = work_item_details_fields.get(
                    "Microsoft.VSTS.Scheduling.CompletedWork", 0)

                work_item_info["remaining_work"] = work_item_details_fields.get(
                    "Microsoft.VSTS.Scheduling.RemainingWork", 0)

                work_item_info["system_info"] = extract_message_from_html(
                    work_item_details_fields.get("Microsoft.VSTS.TCM.SystemInfo", "<p> No System Info Defined </p>"))

                work_item_info["resolution"] = extract_message_from_html(
                    work_item_details_fields.get("Microsoft.VSTS.Common.Resolution", "<p> No Resolution Defined </p>"))

            elif work_item_type == "User Story":

                work_item_info["acceptance_criteria"] = extract_message_from_html(
                    work_item_details_fields.get("Microsoft.VSTS.Common.AcceptanceCriteria",
                                                 "<p> No Acceptance Criteria Defined </p>"))

                work_item_info["story_points"] = work_item_details_fields.get("Microsoft.VSTS.Scheduling.StoryPoints")

                # work_item_info["description"] = extract_message_from_html(
                #     work_item_details_fields.get("System.Description", "<p> No Description Defined </p>"))

                work_item_info["description"] = work_item_details_fields.get("System.Description",
                                                                             "<p> No Description Defined </p>")
            dict_of_all_workitems[work_item_type].append(work_item_info)

    return dict_of_all_workitems


def create_task(task_title, parent_id, organization, project, task_description=None, task_assigned_to=None,
                iteration=None, area=None,
                original_estimate=None):
    print("Creating a task.")
    url = f"https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/$Task?api-version=7.1"
    headers = {
        "Content-Type": "application/json-patch+json"
    }
    data = [
        {
            "op": "add",
            "path": "/fields/System.Title",
            "from": None,
            "value": task_title
        }
    ]
    if iteration:
        data.append(
            {
                "op": "add",
                "path": "/fields/System.IterationPath",
                "from": None,
                "value": iteration
            }
        )
    if area:
        data.append(
            {
                "op": "add",
                "path": "/fields/System.AreaPath",
                "from": None,
                "value": area
            }
        )
    if parent_id:
        data.append(
            {
                "op": "add",
                "path": "/relations/-",
                "from": None,
                "value": {
                    "rel": "System.LinkTypes.Hierarchy-Reverse",
                    "url": f"https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{parent_id}",
                    "attributes": {
                        "comment": "Parent"
                    }
                }
            }
        )

    if task_description:
        data.append(
            {
                "op": "add",
                "path": "/fields/System.Description",
                "from": None,
                "value": task_description
            }
        )
    if task_assigned_to:
        data.append(
            {
                "op": "add",
                "path": "/fields/System.AssignedTo",
                "from": None,
                "value": task_assigned_to
            }
        )
    if original_estimate:
        data.append(
            {
                "op": "add",
                "path": "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate",
                "from": None,
                "value": original_estimate
            }
        )

        data.append(
            {
                "op": "add",
                "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
                "from": None,
                "value": original_estimate
            }
        )

        data.append(
            {
                "op": "add",
                "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
                "from": None,
                "value": 0
            }
        )

    response = requests.post(url, auth=auth, headers=headers, json=data)
    return response.json()


def comment_on_work_item(item_id: int, comment: str, organization, project) -> str:
    url = f"https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{item_id}?api-version=7.1"
    headers = {
        "Content-Type": "application/json-patch+json"
    }
    data = [
        {
            "op": "add",
            "path": "/fields/System.History",
            "from": NISHANT_MODI,
            "value": comment
        }
    ]
    response = requests.patch(url, auth=auth, headers=headers, json=data)
    res = "Comment added." if response.status_code == 200 else "Failed to add comment. Try again later"
    return res


def get_tasks_linked_to_work_item(work_item_id: int, organization, project) -> list:
    url = f"https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{work_item_id}?$expand=relations&api-version=7.1"
    response = requests.get(url, auth=auth)
    data = response.json()
    tasks = []
    for relation in data["relations"]:
        if relation["rel"] == "System.LinkTypes.Hierarchy-Forward":
            tasks.append(relation["url"].split("/")[-1])
    return tasks


def run_wiql_query(wiql_query, organization, project):
    url = f"https://dev.azure.com/{organization}/{project}/_apis/wit/wiql?api-version=7.1"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "query": wiql_query
    }
    response = requests.post(url, auth=auth, headers=headers, json=data)
    return response.json()
