from __future__ import annotations

"""
AgriSense ML Service — Chat Chain
===================================

Purpose:
    Orchestrates the LangChain chain that connects the prompt template
    to the Gemini LLM. This is the core "brain" of the chatbot.

    Phase 1-2: Simple chain (prompt → LLM).
    Phase 5:   Extended with retriever context injection.

Why it exists:
    Separates LLM orchestration from HTTP handling (app.py) and
    business logic (chat_service.py). The chain is a pure function:
    input query + context → output response.

Interactions:
    - Uses: chatbot/prompts/system.py (prompt template)
    - Uses: chatbot/config/settings.py (LLM config)
    - Called by: chatbot/services/chat_service.py
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser

from chatbot.config.settings import get_settings
from chatbot.prompts.system import CHAT_PROMPT
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


def get_llm() -> ChatGoogleGenerativeAI:
    """
    Initializes and returns the Gemini LLM instance.
    Configuration (model name, temperature) comes from centralized settings.
    """
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=settings.LLM_TEMPERATURE,
        convert_system_message_to_human=True,
    )


async def run_chat_chain(
    user_input: str,
    chat_history: list[dict] | None = None,
    knowledge_context: str = "",
    memory_context: str = "",
) -> str:
    """
    Executes the chat chain: builds prompt with context → sends to Gemini → returns text.

    Args:
        user_input:        The user's current message.
        chat_history:      List of prior messages [{"role": "human"/"ai", "content": "..."}].
        knowledge_context: Retrieved knowledge base text (injected into prompt).
        memory_context:    Retrieved long-term memory text (injected into prompt).

    Returns:
        The AI-generated response string.
    """
    logger.info("Running chat chain for input: %s", user_input[:80])

    llm = get_llm()
    chain = CHAT_PROMPT | llm | StrOutputParser()

    # Convert chat history dicts to LangChain message objects
    formatted_history = []
    if chat_history:
        for msg in chat_history:
            if msg["role"] == "human":
                formatted_history.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "ai":
                formatted_history.append(AIMessage(content=msg["content"]))

    # Fill empty context with informative placeholders
    if not knowledge_context.strip():
        knowledge_context = "No relevant documents found in the knowledge base."
    if not memory_context.strip():
        memory_context = "No stored information about this user."

    response = await chain.ainvoke(
        {
            "input": user_input,
            "chat_history": formatted_history,
            "knowledge_context": knowledge_context,
            "memory_context": memory_context,
        }
    )

    logger.info("Chain response generated (%d chars)", len(response))
    return response
