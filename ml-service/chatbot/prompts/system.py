"""
AgriSense ML Service — System Prompts
=======================================

Purpose:
    Contains ALL prompt templates used by the chatbot. The system prompt defines
    the AI's role, capabilities, limitations, and how to handle context from
    the RAG pipeline (knowledge, memory, conversation history).

Why it exists:
    Prompts are a critical tuning surface. Keeping them in dedicated files
    allows non-engineers to review and tweak behavior without touching
    business logic or chain code.

Interactions:
    - Consumed by chatbot/chains/chat_chain.py when building the LangChain chain.
    - Context variables ({knowledge_context}, {memory_context}, {chat_history})
      are injected at runtime by the chain.
"""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# ===========================================================================
# System Prompt — Defines the AI's identity and behavior
# ===========================================================================

SYSTEM_TEMPLATE = """\
You are AgriSense AI, an agriculture assistant.

## Strict Behavioral Rules
1. **EXTREMELY CONCISE**: Your answers MUST be very short. Provide 2-3 brief bullet points maximum. NEVER write huge walls of text.
2. **NO FLUFF**: Do not use introductory or concluding sentences. Do NOT say "Hello! I am AgriSense AI". Do NOT say "Since I don't have specific documents". Just answer the question directly.
3. **GENERAL QUERIES**: If the query is general and not in your specific documents, just answer it directly from your general knowledge. Do not apologize or explain where the knowledge comes from.
4. **FORMAT**: Always use short bullet points.

### Knowledge Base
{knowledge_context}

### User Profile
{memory_context}
"""

# ===========================================================================
# Chat Prompt Template — Used by the LangChain chain
# ===========================================================================

CHAT_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_TEMPLATE),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ]
)
