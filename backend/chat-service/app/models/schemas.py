from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


# ---- Session schemas ----

class SessionCreate(BaseModel):
    user_id: uuid.UUID
    title: Optional[str] = None


class SessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---- Message schemas ----

class MessageBase(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class MessageCreate(MessageBase):
    session_id: uuid.UUID
    metadata: Optional[dict] = None


class MessageResponse(MessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    metadata: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Chat request / response ----

class ChatRequest(BaseModel):
    session_id: uuid.UUID
    user_id: uuid.UUID
    message: str = Field(..., min_length=1, max_length=8000)
    stream: bool = False
    top_k_docs: int = Field(default=5, ge=1, le=20)


class SourceChunk(BaseModel):
    document_id: str
    filename: str
    chunk_index: int
    content_snippet: str


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    message_id: uuid.UUID
    answer: str
    sources: List[SourceChunk] = []
    latency_ms: int


# ---- Health ----

class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    dependencies: dict = {}
