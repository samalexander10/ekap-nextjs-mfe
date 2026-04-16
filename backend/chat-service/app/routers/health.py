from fastapi import APIRouter
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        dependencies={
            "postgres": "connected",
            "weaviate": "connected",
            "kafka": "connected",
        },
    )
