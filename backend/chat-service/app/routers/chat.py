import re
import uuid
import time
import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import text

from app.db.database import AsyncSessionLocal
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import generate_answer, stream_answer, get_embedding
from app.services.weaviate_service import retrieve_relevant_chunks

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Intent → action-suggestion mapping
# Each entry: (compiled regex, action suggestion dict)
# The first matching rule wins.
# ---------------------------------------------------------------------------
_ACTION_RULES: list[tuple[re.Pattern, dict]] = [
    (
        re.compile(
            r"\b(change|update|correct|amend|modify|request)\b.{0,40}"
            r"\b(name|last\s*name|surname|family\s*name|legal\s*name)\b"
            r"|\b(name\s*change|surname\s*change)\b",
            re.IGNORECASE,
        ),
        {"mini_app_id": "hr-name-change", "label": "Start Name Change Request"},
    ),
]


def _detect_action_suggestions(message: str) -> list[dict]:
    """Return a list of action suggestion dicts for the given user message."""
    for pattern, suggestion in _ACTION_RULES:
        if pattern.search(message):
            return [suggestion]
    return []


async def _persist_messages(session_id: str, user_msg: str, assistant_msg: str, metadata: dict):
    async with AsyncSessionLocal() as db:
        await db.execute(
            text(
                "INSERT INTO chat_messages (id, session_id, role, content) "
                "VALUES (:id, :session_id, :role, :content)"
            ),
            {"id": str(uuid.uuid4()), "session_id": session_id, "role": "user", "content": user_msg},
        )
        await db.execute(
            text(
                "INSERT INTO chat_messages (id, session_id, role, content, metadata) "
                "VALUES (:id, :session_id, :role, :content, :metadata)"
            ),
            {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "role": "assistant",
                "content": assistant_msg,
                "metadata": json.dumps(metadata),
            },
        )
        # Update session updated_at
        await db.execute(
            text("UPDATE chat_sessions SET updated_at = NOW() WHERE id = :id"),
            {"id": session_id},
        )
        await db.commit()


async def _get_conversation_history(session_id: str) -> list[dict]:
    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            text(
                "SELECT role, content FROM chat_messages "
                "WHERE session_id = :session_id "
                "ORDER BY created_at ASC LIMIT 20"
            ),
            {"session_id": session_id},
        )
        return [{"role": r["role"], "content": r["content"]} for r in rows.mappings().all()]


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    """Non-streaming chat endpoint — returns full answer."""
    start_ms = int(time.time() * 1000)

    # 1. Embed the user query for RAG retrieval
    embedding = await get_embedding(payload.message)

    # 2. Retrieve relevant document chunks
    chunks = await retrieve_relevant_chunks(embedding, top_k=payload.top_k_docs)

    # 3. Load conversation history
    history = await _get_conversation_history(str(payload.session_id))

    # 4. Generate LLM answer
    answer = await generate_answer(payload.message, history, chunks)

    # 5. Persist messages
    message_id = uuid.uuid4()
    await _persist_messages(
        session_id=str(payload.session_id),
        user_msg=payload.message,
        assistant_msg=answer,
        metadata={"sources": [c.model_dump() for c in chunks]},
    )

    latency_ms = int(time.time() * 1000) - start_ms

    return ChatResponse(
        session_id=payload.session_id,
        message_id=message_id,
        answer=answer,
        sources=chunks,
        latency_ms=latency_ms,
    )


@router.post("/stream")
async def chat_stream(payload: ChatRequest):
    """Server-Sent Events streaming chat endpoint."""
    embedding = await get_embedding(payload.message)
    chunks = await retrieve_relevant_chunks(embedding, top_k=payload.top_k_docs)
    history = await _get_conversation_history(str(payload.session_id))

    # Detect action suggestions before streaming so they're ready for the done event
    action_suggestions = _detect_action_suggestions(payload.message)

    full_answer_parts: list[str] = []

    async def event_generator():
        # Send sources first
        sources_payload = json.dumps({"type": "sources", "sources": [c.model_dump() for c in chunks]})
        yield f"data: {sources_payload}\n\n"

        async for token in stream_answer(payload.message, history, chunks):
            full_answer_parts.append(token)
            # Use "chunk"/"content" to match the frontend SSE parser
            chunk_payload = json.dumps({"type": "chunk", "content": token, "done": False})
            yield f"data: {chunk_payload}\n\n"

        # Persist after streaming completes
        full_answer = "".join(full_answer_parts)
        await _persist_messages(
            session_id=str(payload.session_id),
            user_msg=payload.message,
            assistant_msg=full_answer,
            metadata={"sources": [c.model_dump() for c in chunks]},
        )

        done_payload = json.dumps({
            "type": "done",
            "done": True,
            "action_suggestions": action_suggestions,
        })
        yield f"data: {done_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
