"""
Weaviate indexer — stores document chunks and their embeddings.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List

import weaviate
import weaviate.classes as wvc

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

WEAVIATE_CLASS = "HRDocument"

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
        logger.info("Weaviate client connected.")
    return _client


async def ensure_schema():
    """Create the HRDocument class in Weaviate if it doesn't exist."""
    try:
        client = get_weaviate_client()
        if not client.collections.exists(WEAVIATE_CLASS):
            client.collections.create(
                name=WEAVIATE_CLASS,
                description="HR policy document chunks for RAG retrieval",
                vectorizer_config=wvc.config.Configure.Vectorizer.none(),
                properties=[
                    wvc.config.Property(name="content", data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="documentId", data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="filename", data_type=wvc.config.DataType.TEXT),
                    wvc.config.Property(name="chunkIndex", data_type=wvc.config.DataType.INT),
                    wvc.config.Property(name="chunkTotal", data_type=wvc.config.DataType.INT),
                    wvc.config.Property(name="uploadedBy", data_type=wvc.config.DataType.TEXT),
                ],
            )
            logger.info("Created Weaviate class: %s", WEAVIATE_CLASS)
    except Exception as exc:
        logger.error("Failed to ensure Weaviate schema: %s", exc)


async def index_document_chunks(
    document_id: str,
    filename: str,
    uploaded_by: str,
    chunks: List[str],
    embeddings: List[List[float]],
) -> int:
    """
    Batch-insert chunks into Weaviate with their embedding vectors.

    Returns:
        Number of chunks successfully indexed.
    """
    if not chunks or not embeddings:
        return 0

    try:
        await ensure_schema()
        client = get_weaviate_client()
        collection = client.collections.get(WEAVIATE_CLASS)

        objects = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            objects.append(
                wvc.data.DataObject(
                    properties={
                        "content": chunk,
                        "documentId": document_id,
                        "filename": filename,
                        "chunkIndex": i,
                        "chunkTotal": len(chunks),
                        "uploadedBy": uploaded_by,
                    },
                    vector=embedding,
                    uuid=uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}-{i}"),
                )
            )

        result = collection.data.insert_many(objects)
        failed = len(result.errors) if result.errors else 0
        indexed = len(chunks) - failed

        if failed:
            logger.warning("%d chunks failed to index for document %s", failed, document_id)

        logger.info("Indexed %d/%d chunks for document %s", indexed, len(chunks), document_id)
        return indexed

    except Exception as exc:
        logger.error("Weaviate indexing failed for document %s: %s", document_id, exc)
        return 0
