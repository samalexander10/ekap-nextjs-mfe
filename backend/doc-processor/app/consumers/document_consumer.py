"""
Kafka consumer for the 'document.uploaded' topic.
Processes each document: extracts text, chunks, embeds, and indexes into Weaviate.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.config import get_settings
from app.services.chunker import extract_text, chunk_text
from app.services.embedder import embed_chunks
from app.services.indexer import index_document_chunks

logger = logging.getLogger(__name__)
settings = get_settings()

_consumer: AIOKafkaConsumer | None = None
_producer: AIOKafkaProducer | None = None
_consumer_task: asyncio.Task | None = None


async def start_consumer():
    global _consumer, _producer, _consumer_task
    try:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await _producer.start()

        _consumer = AIOKafkaConsumer(
            settings.kafka_topic_document_uploaded,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_group_id,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="earliest",
        )
        await _consumer.start()

        _consumer_task = asyncio.create_task(_consume_loop())
        logger.info("Document consumer started, listening on: %s", settings.kafka_topic_document_uploaded)
    except Exception as exc:
        logger.error("Failed to start document consumer: %s", exc)


async def stop_consumer():
    global _consumer, _producer, _consumer_task
    if _consumer_task:
        _consumer_task.cancel()
        try:
            await _consumer_task
        except asyncio.CancelledError:
            pass
    if _consumer:
        await _consumer.stop()
    if _producer:
        await _producer.stop()
    logger.info("Document consumer stopped.")


async def _consume_loop():
    async for msg in _consumer:
        try:
            await _process_message(msg.value)
        except Exception as exc:
            logger.error("Error processing message: %s", exc)


async def _process_message(event: dict):
    """
    Expected event schema:
    {
        "document_id": "uuid",
        "file_path": "/tmp/ekap-uploads/abc.pdf",
        "filename": "leave-policy.pdf",
        "content_type": "application/pdf",
        "uploaded_by": "user-uuid"
    }
    """
    document_id = event.get("document_id", "")
    file_path = event.get("file_path", "")
    filename = event.get("filename", "")
    content_type = event.get("content_type", "text/plain")
    uploaded_by = event.get("uploaded_by", "")

    logger.info("Processing document: %s (%s)", filename, document_id)

    if not os.path.exists(file_path):
        logger.error("File not found: %s", file_path)
        await _publish_error(document_id, "File not found on disk")
        return

    # 1. Extract text
    text = extract_text(file_path, content_type)
    if not text.strip():
        logger.warning("No text extracted from %s", filename)
        await _publish_error(document_id, "No text could be extracted from document")
        return

    # 2. Chunk text
    chunks = chunk_text(text)
    if not chunks:
        await _publish_error(document_id, "Text chunking produced no chunks")
        return

    logger.info("Created %d chunks for document %s", len(chunks), document_id)

    # 3. Embed chunks
    embeddings = await embed_chunks(chunks)

    # 4. Index into Weaviate
    indexed_count = await index_document_chunks(
        document_id=document_id,
        filename=filename,
        uploaded_by=uploaded_by,
        chunks=chunks,
        embeddings=embeddings,
    )

    # 5. Publish processed event
    await _publish_processed(document_id, indexed_count, len(chunks))
    logger.info("Document %s processed: %d/%d chunks indexed", document_id, indexed_count, len(chunks))


async def _publish_processed(document_id: str, indexed_count: int, total_chunks: int):
    if _producer:
        await _producer.send(
            settings.kafka_topic_document_processed,
            value={
                "document_id": document_id,
                "status": "ready",
                "indexed_count": indexed_count,
                "total_chunks": total_chunks,
            },
        )


async def _publish_error(document_id: str, error_message: str):
    if _producer:
        await _producer.send(
            settings.kafka_topic_document_processed,
            value={
                "document_id": document_id,
                "status": "error",
                "error_message": error_message,
            },
        )
