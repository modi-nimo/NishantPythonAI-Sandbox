import os
import pprint

import gradio as gr
import pandas as pd
from dotenv import load_dotenv

from TechnicalLeadHelper.helper import get_iteration_info, get_all_work_items

load_dotenv()

organization: str = os.environ["ORGANIZATION"].replace(" ", "%20")
project: str = os.environ["PROJECT"].replace(" ", "%20")
iteration: str = os.environ["ITERATION"]
area: str = os.environ["AREA"]
team = os.environ["TEAM"].replace(" ", "%20")

all_work_items = {}


def get_current_sprint_info(_sprint_num=2):
    global all_work_items
    sprint_name = os.environ["SPRINT_NAME"] + str(_sprint_num)
    iteration_info = get_iteration_info(organization, project, team, sprint_name)
    all_work_items = get_all_work_items(organization, project, team, iteration_info["id"])
    data = []
    for item_type, item_info in all_work_items.items():
        for item in item_info:
            temp_info = {
                "Story ID": item["id"],
                "Title": item["title"],
                "State": item["state"],
                "Type": item_type,
                "SP": item.get("story_points", "0"),
                "Assigned To": item["assigned_to"],
            }
            data.append(temp_info)
    return pd.DataFrame(data)

demo = gr.Blocks()
with demo:
    with gr.Tab("Current Sprint Info"):
        current_sprint = gr.Dataframe(get_current_sprint_info(), label="Current Sprint Info", max_height=700, wrap=True,
                                       show_search="filter")

demo.launch()
