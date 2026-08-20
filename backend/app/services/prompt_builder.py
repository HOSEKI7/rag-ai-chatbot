from typing import List, Dict, Tuple, Optional

SYSTEM_PROMPT_TEMPLATE = """You are Contexure, an expert industrial equipment and technical documentation assistant.
Your goal is to provide precise, truthful, and strictly grounded technical answers based on industrial datasheets, manuals, and specifications.

CORE GUIDELINES:
1. STRICT GROUNDING: Rely exclusively on the verified technical context provided within <context>...</context>.
2. ZERO HALLUCINATION: Never invent or extrapolate specifications, tolerances, voltages, wiring schematics, or compatibility details not explicitly verified in the text.
3. INLINE CITATIONS: Cite source references as bracketed numbers like [1] or [2] immediately following the statement or specification they support. The numbers correspond directly to the [Citation N: ...] blocks in the context.
4. LANGUAGE MATCHING: Always respond in the same language as the user query (e.g., if the user asks in Bahasa Indonesia, respond thoroughly in Bahasa Indonesia; if in English, respond in English).
5. STRUCTURE & CLARITY: Present complex technical comparisons, ratings, and dimensions using markdown tables, bullet points, and code/spec callouts for legibility.
"""


def build_rag_prompt(
    query: str,
    reconstructed_context: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> Tuple[str, str]:
    """
    Builds the system prompt and structured user prompt packaging the reconstructed parent context,
    conversation history, and active technical query.
    """
    history_blocks: List[str] = []
    if history:
        for turn in history[-4:]:  # Include up to last 4 conversation turns for context
            role = turn.get("role", "user").capitalize()
            content = turn.get("content", "")
            history_blocks.append(f"{role}: {content}")

    history_text = ""
    if history_blocks:
        history_text = (
            "<conversation_history>\n"
            + "\n".join(history_blocks)
            + "\n</conversation_history>\n\n"
        )

    user_prompt = (
        f"{history_text}"
        f"<context>\n{reconstructed_context}\n</context>\n\n"
        f"<user_query>\n{query}\n</user_query>\n\n"
        f"Answer the user query thoroughly and accurately using the context above. Include inline bracketed citations [1], [2] where appropriate."
    )

    return SYSTEM_PROMPT_TEMPLATE, user_prompt
