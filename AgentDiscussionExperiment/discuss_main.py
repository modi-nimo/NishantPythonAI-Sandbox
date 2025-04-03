# Idea is to create two agents that will discuss on a topic and debate / reach to a conclusion with each other.


from agno.agent import Agent
from agno.models.google import Gemini
from agno.team.team import Team
from dotenv import load_dotenv

gemini_model = "gemini-2.0-flash"
load_dotenv()

ui_developer_agent = Agent(
    name = "UI Developer Agent",
    role="You act like Angular UI Developer.. You can help with writing technical description of how you can complete a UI Tasks, estimate the story point and time required to complete the task.",
    model=Gemini(id=gemini_model)
)

python_developer_agent = Agent(
    name= "Python Developer Agent",
    role="You act like Senior Python Developer. You can help with writing technical description of how you can complete a Python Tasks, estimate the story point and time required to complete the task.",
    model=Gemini(id=gemini_model)
)

technical_lead_agent = Agent(
    name= "Technical Lead Agent",
    role="You act like Technical Lead. You can help with dividing a user story in tasks. Based on the estimation of the tasks, you can also help with estimating the story point and time required to complete the user story.",
    model=Gemini(id=gemini_model)
)

project_manager_agent = Agent(
    name= "Project Manager Agent",
    role="You act like Project Manager. You have to define tasks for Angular Developer and Python Developer .You can help with writing description and acceptance criteria for a user story.",
    model=Gemini(id=gemini_model)
)


multi_skills_team = Team(
    name="Multi Skills Team",
    mode="coordinate",
    model=Gemini(id="gemini-2.0-flash"),
    members=[ui_developer_agent, python_developer_agent, technical_lead_agent, project_manager_agent],
    markdown=True,
    description="You are a task router that directs certain tasks to the appropriate agent.",
    instructions=
    """
    You will perform the following tasks and complete it using appropriate agent:
    1. Generate a Proper Description and Acceptance Criteria for the User Story.
    2. Divide the User Story into Tasks.
    3. Estimate the Story Points and Time required to complete the User Story.
    4. For each task, provide a technical description of how you can complete the task.

    Always check the task to do before routing to an agent.
    Remember: You are the final gatekeeper of the task. You need to make sure that the task is completed by the appropriate agent.
    """
    ,
    success_criteria="You have a proper description and acceptance criteria for the user story. You have divided the user story into tasks. You have estimated the story points and time required to complete the user story. You have provided a technical description of how you can complete each task. You have estimated the story points and time required to complete each task.",
    show_members_responses=True,
    enable_team_history=True,
    # enable_agentic_context=True, # NOT WORKING WITH GEMINI
    share_member_interactions=True,
    debug_mode=True,
    use_json_mode=True
)


multi_skills_team.print_response("""
Complete the task for following user story:

Title: Unification of embeddings into a single table

Description about the user story:
    The current 4 embedding tables could be unified into a single one to allow for more flexibility. 
    The different embeddings can be identified by a "type" field.
    
    Proposed unified embeddings table structure:
    - Item name
    - Item type (enum)
        * Business term
        * Table
        * Column
        * Example question
    - Content
    - Dictionary ID
    - Embedding
    - Last Updated At
    
    The disadvantage of the current approach, is that we tied a metadata value (which by definition can be dynamically defined by users) to be matched to a specific table of embeddings (Like Table Name / Column Name). These fields should not be hardcoded to match an embedding, a domain might not even require embeddings.
    The advantage of the new approach, will let us to create new embeddings for future implementations, that might require different structures than just Table, Column or whatever. 
    In the current world, we are having a problem now, that we need to rename the column name, and by doing that, we will introduce a problem in the current code, so either the embedding works with property names (causing it to potentially be inaccurate) or 
""")