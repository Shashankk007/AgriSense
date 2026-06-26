from __future__ import annotations

"""
AgriSense ML Service — Base Agent (Future-Ready Scaffolding)
=============================================================

Purpose:
    Defines the abstract contract for ALL future agents in the system.
    The current chatbot is the only agent, but this base class ensures
    that future agents (Disease, Pest, Weather, NDVI, Yield, Satellite)
    follow a consistent interface.

Why it exists:
    When the system migrates to LangGraph for multi-agent orchestration,
    each agent will be a node in the graph. This base class ensures all
    agents have the same input/output contract, making that migration
    straightforward.

Design for LangGraph compatibility:
    - Each agent has a `name` and `description` (used for routing).
    - The `run()` method takes a query + context and returns a structured result.
    - State is passed in via `context` dict, not stored on the agent.
    - This mirrors LangGraph's "tool-like" node pattern.

Interactions:
    - Extended by: future agent implementations
    - Will be consumed by: LangGraph routing logic (future)
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """
    Abstract base class for all AgriSense agents.

    Every agent must implement:
        - name:        A unique identifier for the agent.
        - description: What the agent does (used for routing decisions).
        - run():       Execute the agent's logic given a query and context.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique name for this agent (e.g., 'disease_agent', 'pest_agent')."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """
        Human-readable description of the agent's capabilities.
        Used by routing logic to decide which agent handles a query.
        """
        ...

    @abstractmethod
    async def run(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        Execute the agent's logic.

        Args:
            query:   The user's question or instruction.
            context: Optional context dict containing:
                     - mobile_number: str
                     - conversation_id: str
                     - chat_history: list[dict]
                     - knowledge_context: str
                     - memory_context: str
                     - Any agent-specific context

        Returns:
            A dict with at minimum:
                - "response": str  (the agent's answer)
                - "agent":    str  (the agent name that handled this)
                - "sources":  list (any sources used)
        """
        ...

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name='{self.name}'>"


# ===================================================================
# Example: How a future agent would look
# ===================================================================
#
# class DiseaseAgent(BaseAgent):
#     @property
#     def name(self) -> str:
#         return "disease_agent"
#
#     @property
#     def description(self) -> str:
#         return "Identifies crop diseases from symptoms and recommends treatments."
#
#     async def run(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
#         # Disease-specific logic here
#         return {
#             "response": "Based on the symptoms, this appears to be...",
#             "agent": self.name,
#             "sources": [],
#         }
