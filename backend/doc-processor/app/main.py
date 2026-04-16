import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.consumers.document_consumer import start_consumer, stop_consumer
from app.routers import upload, health

settings = get_settings()
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting EKAP Doc Processor Service...")
    await start_consumer()
    yield
    logger.info("Shutting down EKAP Doc Processor Service...")
    await stop_consumer()


app = FastAPI(
    title="EKAP Document Processor",
    description="Handles document uploads, chunking, embedding and Weaviate indexing",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(upload.router, prefix="/api/documents", tags=["documents"])
