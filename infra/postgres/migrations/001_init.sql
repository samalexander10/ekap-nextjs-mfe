-- =============================================================================
-- Migration 001: Initial schema for EKAP
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---- Users ----
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'employee',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---- HR Name Change Requests ----
CREATE TABLE IF NOT EXISTS name_change_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_full_name   VARCHAR(255) NOT NULL,
    new_full_name   VARCHAR(255) NOT NULL,
    reason          TEXT,
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    reviewer_id     UUID         REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    reviewer_notes  TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---- Chat Sessions ----
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---- Chat Messages ----
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID         NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20)  NOT NULL,  -- user | assistant | system
    content     TEXT         NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---- Documents ----
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by     UUID         NOT NULL REFERENCES users(id),
    filename        VARCHAR(500) NOT NULL,
    content_type    VARCHAR(100),
    file_size_bytes BIGINT,
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending',  -- pending | processing | ready | error
    weaviate_class  VARCHAR(100),
    chunk_count     INTEGER      DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---- Indexes ----
CREATE INDEX IF NOT EXISTS idx_name_change_requests_user_id ON name_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_name_change_requests_status  ON name_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id        ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id     ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by        ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status             ON documents(status);

-- ---- Seed admin user (password = 'admin' via bcrypt) ----
INSERT INTO users (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@ekap.local',
    'EKAP Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;
