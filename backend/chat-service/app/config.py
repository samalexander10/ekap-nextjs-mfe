from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "ekap_db"
    postgres_user: str = "ekap_user"
    postgres_password: str = "changeme"

    # Weaviate
    weaviate_host: str = "localhost"
    weaviate_port: int = 8080
    weaviate_grpc_port: int = 50051

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic_document_uploaded: str = "document.uploaded"
    kafka_topic_document_processed: str = "document.processed"
    kafka_topic_hr_events: str = "hr.events"
    kafka_group_id: str = "ekap-chat-group"

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_provider: str = "anthropic"  # openai | anthropic
    llm_model: str = "claude-sonnet-4-6"

    # App
    log_level: str = "INFO"
    jwt_secret: str = "super-secret"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def weaviate_url(self) -> str:
        return f"http://{self.weaviate_host}:{self.weaviate_port}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
