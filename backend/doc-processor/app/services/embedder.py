"""
Embedding service — generates vectors for text chunks via OpenAI.
"""
from __future__ import annotations

import asyncio
import logging
from typing import List

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
BATCH_SIZE = 100


async def embed_chunks(chunks: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of text chunks.
    Batches requests to stay within API limits.

    Returns:
        List of embedding vectors (one per chunk).
    """
    if not chunks:
        return []

    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set — returning zero vectors.")
        return [[0.0] * EMBEDDING_DIM for _ in chunks]

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    all_embeddings: List[List[float]] = []

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        logger.debug("Embedding batch %d-%d of %d", i, i + len(batch), len(chunks))
        response = await client.embeddings.create(
            input=batch,
            model=EMBEDDING_MODEL,
        )
        all_embeddings.extend([item.embedding for item in response.data])
        if i + BATCH_SIZE < len(chunks):
            await asyncio.sleep(0.1)  # Rate limit buffer

    return all_embeddings
