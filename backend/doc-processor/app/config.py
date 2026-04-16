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
    kafka_group_id: str = "ekap-doc-processor-group"

    # OpenAI (for embeddings)
    openai_api_key: str = ""

    # App
    doc_upload_dir: str = "/tmp/ekap-uploads"
    chunk_size: int = 800        # characters per chunk
    chunk_overlap: int = 150     # overlap between chunks
    log_level: str = "INFO"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
