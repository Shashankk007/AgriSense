from __future__ import annotations

"""
AgriSense ML Service — Chat Service (Fully Wired)
===================================================

Purpose:
    Business logic orchestrator for the chat endpoint. This is the layer
    between the FastAPI route and the LangChain chain.

    It handles the full RAG pipeline:
    1. Retrieve relevant knowledge from vector store
    2. Retrieve relevant user memories
    3. Load conversation history
    4. Build context and run the chain
    5. Persist the conversation exchange

Why it exists:
    Keeps FastAPI routes thin (just HTTP concerns). All business decisions
    live here. This makes the logic testable without spinning up a server.

Interactions:
    - Called by: app.py (chat endpoint)
    - Calls:    chatbot/chains/chat_chain.py
    - Calls:    chatbot/memory/conversation.py
    - Calls:    chatbot/memory/long_term.py
    - Calls:    chatbot/retrievers/knowledge.py
    - Calls:    chatbot/retrievers/memory.py
"""

import asyncio
import uuid

from chatbot.agents.memory_extractor import extract_memory_from_message
from chatbot.chains.chat_chain import run_chat_chain
from chatbot.memory.conversation import ConversationMemory
from chatbot.memory.long_term import LongTermMemory
from chatbot.memory.history_db import HistoryDB
from chatbot.models.schemas import ChatRequest, ChatResponse, SourceDocument
from chatbot.retrievers.knowledge import KnowledgeRetriever
from chatbot.retrievers.memory import MemoryRetriever
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    Fully wired chat service that orchestrates the RAG pipeline.
    Initialized once at app startup with all dependencies injected.
    """

    def __init__(
        self,
        conversation_memory: ConversationMemory,
        long_term_memory: LongTermMemory,
        history_db: HistoryDB,
        knowledge_retriever: KnowledgeRetriever,
        memory_retriever: MemoryRetriever,
    ):
        self._conversation_memory = conversation_memory
        self._long_term_memory = long_term_memory
        self._history_db = history_db
        self._knowledge_retriever = knowledge_retriever
        self._memory_retriever = memory_retriever
        logger.info("ChatService initialized with all dependencies")

    async def handle_chat(self, request: ChatRequest) -> ChatResponse:
        """
        Processes an incoming chat request through the full RAG pipeline:

        1. Generate conversation_id if not provided
        2. Retrieve relevant knowledge documents
        3. Retrieve relevant user memories
        4. Load recent conversation history
        5. Run the LangChain chain with all context
        6. Persist the exchange to conversation history
        7. Return response with source citations

        Args:
            request: Validated ChatRequest from the API layer.

        Returns:
            ChatResponse with the AI's answer, conversation ID, and sources.
        """
        logger.info(
            "Processing chat | mobile_number=%s | conversation_id=%s",
            request.mobile_number,
            request.conversation_id or "NEW",
        )

        # Step 1: Ensure we have a conversation ID
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # Step 2: Retrieve relevant knowledge (RAG)
        knowledge_context = ""
        raw_sources: list[dict] = []
        try:
            knowledge_context, raw_sources = self._knowledge_retriever.retrieve(
                query=request.message,
                k=4,
            )
        except Exception as e:
            logger.warning("Knowledge retrieval failed (non-fatal): %s", str(e))

        # Step 3: Retrieve relevant user memories
        memory_context = ""
        try:
            memory_context = await self._memory_retriever.retrieve(
                mobile_number=request.mobile_number,
                query=request.message,
                k=5,
            )
        except Exception as e:
            logger.warning("Memory retrieval failed (non-fatal): %s", str(e))

        # Step 4: Load recent conversation history
        chat_history: list[dict] = []
        try:
            chat_history = self._conversation_memory.get_recent_messages(conversation_id)
        except Exception as e:
            logger.warning("Conversation history retrieval failed (non-fatal): %s", str(e))

        # Step 5: Run the chain
        try:
            response_text = await run_chat_chain(
                user_input=request.message,
                chat_history=chat_history,
                knowledge_context=knowledge_context,
                memory_context=memory_context,
            )
        except Exception as e:
            logger.error("Chat chain failed: %s", str(e), exc_info=True)
            raise

        # Step 6: Persist the exchange
        try:
            self._conversation_memory.add_messages(
                conversation_id=conversation_id,
                user_message=request.message,
                ai_response=response_text,
            )
        except Exception as e:
            logger.warning("Failed to persist conversation (non-fatal): %s", str(e))

        # Step 7: Update Metadata Collection
        try:
            self._history_db.upsert_conversation(
                conversation_id=conversation_id,
                mobile_number=request.mobile_number,
                title=request.message[:30]
            )
        except Exception as e:
            logger.warning("Failed to store chat metadata (non-fatal): %s", str(e))

        # Step 6.5: Run memory extraction in the background
        asyncio.create_task(self._background_memory_extraction(request.mobile_number, request.message))

        # Step 7: Build source citations
        sources = [
            SourceDocument(
                content=s["content"][:200],  # Truncate for response
                source=s.get("metadata", {}).get("source"),
                score=s.get("score"),
            )
            for s in raw_sources
        ]

        logger.info("Chat completed | conversation_id=%s | sources=%d", conversation_id, len(sources))

        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            sources=sources,
        )

    async def _background_memory_extraction(self, mobile_number: str, message: str):
        """
        Runs the memory extractor in the background. If a fact is found,
        it stores it directly to the user's long-term memory.
        """
        try:
            fact = await extract_memory_from_message(message)
            if fact:
                await self._long_term_memory.store_memory(mobile_number, fact)
        except Exception as e:
            logger.error("Background memory extraction error: %s", str(e), exc_info=True)

