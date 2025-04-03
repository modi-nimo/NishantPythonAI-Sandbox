
from agno.agent import Agent
from agno.models.google import Gemini
from agno.team import Team
from dotenv import load_dotenv
from fontTools.ttLib.tables.ttProgram import instructions

gemini_model = "gemini-2.0-flash"
load_dotenv()

from agno.agent import Agent
from agno.team.team import Team

english_agent = Agent(
    name="English Agent",
    role="You only answer in English",
    model=Gemini(id=gemini_model),
)
hindi_agent = Agent(
    name="Hindi Agent",
    role="You only answer in Hindi",
    model=Gemini(id=gemini_model),

)


multi_language_team = Team(
    name="Multi Language Team",
    mode="route",
    model=Gemini(id=gemini_model),
    members=[english_agent, hindi_agent],
    show_tool_calls=True,
    markdown=True,
    description="You are a language router that directs questions to the appropriate language agent.",
    instructions=[
        "Identify the language of the user's question and direct it to the appropriate language agent.",
        "If the user asks in a language whose agent is not a team member, respond in English with:",
        "'I can only answer in the following languages: English, Hindi. Please ask your question in one of these languages.'",
        "Always check the language of the user's input before routing to an agent.",
        "For unsupported languages like Italian, respond in English with the above message.",
    ],
    show_members_responses=True,
    enable_agentic_context=True,
    share_member_interactions=True
)


# Ask "How are you?" in all supported languages
multi_language_team.print_response("Kaise ho bhai?", stream=True)  # French
# multi_language_team.print_response("Comment allez-vous?", stream=True)  # French
# multi_language_team.print_response("How are you?", stream=True)  # English
# multi_language_team.print_response("你好吗？", stream=True)  # Chinese
# multi_language_team.print_response("Come stai?", stream=True)  # Italian



