"""
Weaviate vector store client for RAG retrieval.
Uses weaviate-client v4 (gRPC-first).
"""
from __future__ import annotations

import logging
from typing import List

import weaviate
import weaviate.classes as wvc

from app.config import get_settings
from app.models.schemas import SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()

_client: weaviate.WeaviateClient | None = None


def get_weaviate_client() -> weaviate.WeaviateClient:
    global _client
    if _client is None or not _client.is_connected():
        _client = weaviate.connect_to_custom(
            http_host=settings.weaviate_host,
            http_port=settings.weaviate_port,
            http_secure=False,
            grpc_host=settings.weaviate_host,
            grpc_port=settings.weaviate_grpc_port,
            grpc_secure=False,
        )
        logger.info("Connected to Weaviate at %s", settings.weaviate_url)
    return _client


async def retrieve_relevant_chunks(
    query_embedding: List[float],
    top_k: int = 5,
) -> List[SourceChunk]:
    """
    Perform a vector similarity search against the HRDocument class.

    Args:
        query_embedding: The embedding vector for the user query.
        top_k: Number of chunks to retrieve.

    Returns:
        List of SourceChunk objects ordered by relevance.
    """
    try:
        client = get_weaviate_client()
        collection = client.collections.get("HRDocument")

        results = collection.query.near_vector(
            near_vector=query_embedding,
            limit=top_k,
            return_properties=["content", "documentId", "filename", "chunkIndex"],
        )

        chunks: List[SourceChunk] = []
        for obj in results.objects:
            props = obj.properties
            chunks.append(
                SourceChunk(
                    document_id=props.get("documentId", ""),
                    filename=props.get("filename", ""),
                    chunk_index=props.get("chunkIndex", 0),
                    content_snippet=props.get("content", "")[:500],
                )
            )
        return chunks

    except Exception as exc:
        logger.error("Weaviate retrieval error: %s", exc)
        return []


def close_weaviate():
    global _client
    if _client and _client.is_connected():
        _client.close()
        _client = None
