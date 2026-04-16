"""
Text extraction and chunking utilities.
Supports PDF, DOCX, and plain text files.
"""
from __future__ import annotations

import logging
import os
from typing import List

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def extract_text(file_path: str, content_type: str) -> str:
    """Extract plain text from a file based on its content type."""
    if content_type == "application/pdf" or file_path.endswith(".pdf"):
        return _extract_pdf(file_path)
    elif content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ) or file_path.endswith(".docx"):
        return _extract_docx(file_path)
    else:
        return _extract_text_file(file_path)


def _extract_pdf(file_path: str) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        return "\n\n".join(pages)
    except Exception as exc:
        logger.error("PDF extraction failed for %s: %s", file_path, exc)
        return ""


def _extract_docx(file_path: str) -> str:
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as exc:
        logger.error("DOCX extraction failed for %s: %s", file_path, exc)
        return ""


def _extract_text_file(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as exc:
        logger.error("Text extraction failed for %s: %s", file_path, exc)
        return ""


def chunk_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> List[str]:
    """
    Split text into overlapping chunks of approximately chunk_size characters.

    Returns:
        List of text chunk strings.
    """
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    if not text.strip():
        return []

    chunks: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        # Try to break on a sentence boundary
        if end < text_len:
            boundary = text.rfind(". ", start, end)
            if boundary > start + overlap:
                end = boundary + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap if end < text_len else text_len

    logger.debug("Chunked text into %d chunks (chunk_size=%d, overlap=%d)", len(chunks), chunk_size, overlap)
    return chunks
