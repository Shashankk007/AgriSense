from __future__ import annotations

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

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

from langchain_core.runnables import Runnable
from langchain_groq import ChatGroq

def get_llm() -> Runnable:
    settings = get_settings()
    
    fallback_llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.0, # Use 0.0 for deterministic extraction
        convert_system_message_to_human=True,
    )
    
    if settings.GROQ_API_KEY:
        logger.info("Configuring Memory Extractor LLM with Groq as primary, Google as fallback.")
        primary_llm = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.0,
        )
        return primary_llm.with_fallbacks([fallback_llm])
        
    return fallback_llm

async def extract_memory_from_message(message: str) -> str | None:
    """
    Analyzes the user message and extracts important agricultural facts.
    Returns the fact string, or None if no fact was found.
    """
    try:
        logger.info("Running memory extractor on message: %s", message[:50])
        llm = get_llm()
        prompt = PromptTemplate.from_template(MEMORY_EXTRACTION_PROMPT)
        chain = prompt | llm | StrOutputParser()
        
        result = await chain.ainvoke({"message": message})
        result = result.strip()
        
        if result == "NO_FACT" or "NO_FACT" in result:
            logger.debug("No fact extracted.")
            return None
            
        logger.info("Extracted memory fact: %s", result)
        return result
    except Exception as e:
        logger.error("Memory extraction failed: %s", str(e), exc_info=True)
        return None
