import uuid
import logging
from typing import List

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.db.database import AsyncSessionLocal
from app.models.schemas import SessionCreate, SessionResponse, MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(payload: SessionCreate):
    session_id = uuid.uuid4()
    async with AsyncSessionLocal() as db:
        await db.execute(
            text(
                "INSERT INTO chat_sessions (id, user_id, title) "
                "VALUES (:id, :user_id, :title)"
            ),
            {"id": str(session_id), "user_id": str(payload.user_id), "title": payload.title},
        )
        await db.commit()

        row = await db.execute(
            text("SELECT id, user_id, title, created_at, updated_at FROM chat_sessions WHERE id = :id"),
            {"id": str(session_id)},
        )
        record = row.mappings().first()
        if not record:
            raise HTTPException(status_code=500, detail="Failed to create session")

        return SessionResponse(
            id=record["id"],
            user_id=record["user_id"],
            title=record["title"],
            created_at=record["created_at"],
            updated_at=record["updated_at"],
        )


@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(session_id: uuid.UUID):
    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            text(
                "SELECT id, session_id, role, content, metadata, created_at "
                "FROM chat_messages WHERE session_id = :session_id "
                "ORDER BY created_at ASC"
            ),
            {"session_id": str(session_id)},
        )
        records = rows.mappings().all()
        return [
            MessageResponse(
                id=r["id"],
                session_id=r["session_id"],
                role=r["role"],
                content=r["content"],
                metadata=r["metadata"],
                created_at=r["created_at"],
            )
            for r in records
        ]


@router.get("/{user_id}/list", response_model=List[SessionResponse])
async def list_user_sessions(user_id: uuid.UUID):
    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            text(
                "SELECT id, user_id, title, created_at, updated_at "
                "FROM chat_sessions WHERE user_id = :user_id "
                "ORDER BY updated_at DESC LIMIT 50"
            ),
            {"user_id": str(user_id)},
        )
        records = rows.mappings().all()
        return [
            SessionResponse(
                id=r["id"],
                user_id=r["user_id"],
                title=r["title"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            for r in records
        ]
