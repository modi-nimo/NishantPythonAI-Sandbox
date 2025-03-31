import os
import pprint

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from helper import get_all_work_items, get_iteration_info, create_task

load_dotenv()

organization: str = os.environ["ORGANIZATION"].replace(" ", "%20")
project: str = os.environ["PROJECT"].replace(" ", "%20")
iteration: str = os.environ["ITERATION"]
area: str = os.environ["AREA"]

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class Task(BaseModel):
    task_title: str
    parent_id: int
    task_description: str
    task_assigned_to: str
    original_estimate: int


@app.post("/create_task")
async def create_task_ui(task: Task):
    res = create_task(task.task_title, task.parent_id, organization, project, task.task_description,
                      task.task_assigned_to, iteration, area, task.original_estimate)
    return res


@app.get("/get_all_work_items")
def get_all_work_items_by_sprint_num(sprint_number: int):
    team = os.environ["TEAM"].replace(" ", "%20")
    sprint_name = os.environ["SPRINT_NAME"] + str(sprint_number)

    global iteration
    iteration = os.environ["ITERATION"] + str(sprint_number)

    iteration_info = get_iteration_info(organization, project, team, sprint_name)
    result = get_all_work_items(organization, project, team, iteration_info["id"])
    pprint.pprint(result)

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run('main:app', host="0.0.0.0")
