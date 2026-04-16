"""
LLM abstraction layer supporting OpenAI and Anthropic.
Supports both regular and streaming responses.
"""
from __future__ import annotations

import logging
from typing import AsyncIterator, List

from app.config import get_settings
from app.models.schemas import SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are EKAP Assistant, an intelligent HR knowledge assistant.
You help employees understand company policies, procedures, and HR-related matters.

When answering questions:
1. Base your answers on the provided HR policy context whenever available.
2. If the context does not contain enough information, say so clearly and suggest
   the employee contact the HR department directly.
3. Be professional, empathetic, and concise.
4. Never fabricate policy details or entitlements.
5. Cite the relevant document when quoting specific policy details.
"""


def _build_context_block(chunks: List[SourceChunk]) -> str:
    if not chunks:
        return "No relevant policy documents were retrieved for this query."
    parts = ["RELEVANT HR POLICY EXCERPTS:", "=" * 40]
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"[{i}] Source: {chunk.filename} (chunk {chunk.chunk_index})")
        parts.append(chunk.content_snippet)
        parts.append("-" * 40)
    return "\n".join(parts)


async def generate_answer(
    user_message: str,
    conversation_history: List[dict],
    context_chunks: List[SourceChunk],
) -> str:
    """Generate a non-streaming answer from the configured LLM."""
    context_block = _build_context_block(context_chunks)
    augmented_user_message = f"{context_block}\n\nEmployee Question: {user_message}"

    messages = list(conversation_history)
    messages.append({"role": "user", "content": augmented_user_message})

    if settings.llm_provider == "openai":
        return await _openai_complete(messages)
    else:
        return await _anthropic_complete(messages)


async def stream_answer(
    user_message: str,
    conversation_history: List[dict],
    context_chunks: List[SourceChunk],
) -> AsyncIterator[str]:
    """Generate a streaming answer from the configured LLM."""
    context_block = _build_context_block(context_chunks)
    augmented_user_message = f"{context_block}\n\nEmployee Question: {user_message}"

    messages = list(conversation_history)
    messages.append({"role": "user", "content": augmented_user_message})

    if settings.llm_provider == "openai":
        async for token in _openai_stream(messages):
            yield token
    else:
        async for token in _anthropic_stream(messages):
            yield token


# ---- OpenAI implementation ----

async def _openai_complete(messages: List[dict]) -> str:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        temperature=0.3,
        max_tokens=1500,
    )
    return response.choices[0].message.content or ""


async def _openai_stream(messages: List[dict]) -> AsyncIterator[str]:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    stream = await client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        temperature=0.3,
        max_tokens=1500,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ---- Anthropic implementation ----

async def _anthropic_complete(messages: List[dict]) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    response = await client.messages.create(
        model=settings.llm_model or "claude-3-5-sonnet-20241022",
        system=SYSTEM_PROMPT,
        messages=messages,
        max_tokens=1500,
    )
    return response.content[0].text if response.content else ""


async def _anthropic_stream(messages: List[dict]) -> AsyncIterator[str]:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    async with client.messages.stream(
        model=settings.llm_model or "claude-3-5-sonnet-20241022",
        system=SYSTEM_PROMPT,
        messages=messages,
        max_tokens=1500,
    ) as stream:
        async for text in stream.text_stream:
            yield text


# ---- Embedding helper ----

async def get_embedding(text: str) -> List[float]:
    """Get an embedding vector for the given text using OpenAI."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.embeddings.create(
            input=text,
            model="text-embedding-3-small",
        )
        return response.data[0].embedding
    except Exception as exc:
        logger.warning("Embedding generation failed: %s. Using zero vector.", exc)
        return [0.0] * 1536
