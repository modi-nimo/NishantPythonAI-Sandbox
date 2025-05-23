from smolagents import LiteLLMModel, CodeAgent, tool, DuckDuckGoSearchTool

@tool
def suggest_menu(occasion: str) -> str:
    """Suggest a menu for a given occasion.

    Args:
        occasion (str): The occasion for which to suggest a menu. Allowed values are:
        - "casual" : Menu for a casual gathering
        - "formal" : Menu for a formal event
        - "superhero" : Menu for a superhero-themed party
        - "custom" : Custom menu for any other occasion
    """
    if occasion == "casual":
        return "Pizza, snacks and drinks."
    elif occasion == "formal":
        return "3-course dinner with wine and dessert."
    elif occasion == "superhero":
        return "Buffet with high-energy and healthy foods."
    else:
        return "Custom menu for the butler"


model = LiteLLMModel(
    model_id="ollama/gemma3"
)

agent = CodeAgent(tools=[],model=model, additional_authorized_imports=["datetime"])

res = agent.run("""Alfred needs to prepare for the party. Here are the tasks:
                1. Prepare the drinks - 30 minutes 
                2. Decorate the mansion - 60 minutes 
                3. Set up the menu - 45 minutes 
                4. Prepare the music playlist - 45 minutes 
                If we start right now, at what time will the party be ready?""")
print(res)