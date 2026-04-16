"""
Document upload endpoint.
Saves the file and publishes a Kafka event for async processing.
"""
from __future__ import annotations

import json
import logging
import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from aiokafka import AIOKafkaProducer

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


@router.post("/upload", status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    uploaded_by: str = Form(...),
):
    """
    Upload an HR policy document for async processing.
    Returns a document_id that can be polled for status.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, DOCX, TXT",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB",
        )

    document_id = str(uuid.uuid4())
    os.makedirs(settings.doc_upload_dir, exist_ok=True)
    _, ext = os.path.splitext(file.filename or "upload.bin")
    file_path = os.path.join(settings.doc_upload_dir, f"{document_id}{ext}")

    with open(file_path, "wb") as f:
        f.write(content)

    logger.info("Saved document %s to %s", document_id, file_path)

    # Publish Kafka event
    try:
        producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await producer.start()
        await producer.send(
            settings.kafka_topic_document_uploaded,
            value={
                "document_id": document_id,
                "file_path": file_path,
                "filename": file.filename,
                "content_type": file.content_type,
                "uploaded_by": uploaded_by,
            },
        )
        await producer.stop()
        logger.info("Published document.uploaded event for %s", document_id)
    except Exception as exc:
        logger.error("Kafka publish failed: %s", exc)
        # Don't fail the request — document is saved, consumer can be retried

    return {
        "document_id": document_id,
        "filename": file.filename,
        "status": "pending",
        "message": "Document accepted for processing",
    }


@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """
    Simple status endpoint. In production this would query the documents table.
    """
    file_matches = [
        f for f in os.listdir(settings.doc_upload_dir)
        if f.startswith(document_id)
    ] if os.path.exists(settings.doc_upload_dir) else []

    if not file_matches:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"document_id": document_id, "status": "processing"}
