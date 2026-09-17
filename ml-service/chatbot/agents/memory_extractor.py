import logging
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable

from chatbot.config.settings import get_settings

logger = logging.getLogger(__name__)

MEMORY_EXTRACTION_PROMPT = """
You are an agricultural AI assistant. Your task is to analyze the user's message and extract ONLY permanent, important facts about the user's agricultural profile.

Examples of important facts:
- Farm location or state (e.g., Punjab, Maharashtra)
- Farm size (e.g., 5 acres, 2 hectares)
- Crops grown (e.g., wheat, rice, sugarcane)
- Soil type or irrigation methods

Examples of things to IGNORE:
- General greetings
- Immediate questions (e.g., "how much urea should I add today?")
- Casual chat

If the message contains an important fact, extract it as a concise statement (e.g., "User grows wheat on 5 acres in Punjab").
If the message DOES NOT contain any new important fact, return EXACTLY the string: "NO_FACT". Do not return anything else.

User Message:
{message}
"""

def get_llm() -> Runnable:
    settings = get_settings()
    # Prefer GROQ if available for speed, otherwise fallback to Gemini
    if settings.GROQ_API_KEY:
        from langchain_groq import ChatGroq
        return ChatGroq(api_key=settings.GROQ_API_KEY, model="llama3-70b-8192", temperature=0)
    else:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)

async def extract_memory_from_message(message: str) -> str | None:
    """
    Extracts permanent facts from a user message.
    Returns the fact string, or None if no fact was found.
    """
    try:
        llm = get_llm()
        prompt = PromptTemplate.from_template(MEMORY_EXTRACTION_PROMPT)
        chain = prompt | llm | StrOutputParser()
        
        result = await chain.ainvoke({"message": message})
        
        result = result.strip()
        if "NO_FACT" in result or not result:
            return None
            
        return result
    except Exception as e:
        logger.error(f"Error in memory extractor: {e}")
        return None
