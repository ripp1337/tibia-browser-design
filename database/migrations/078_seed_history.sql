-- =====================================================
-- 078_seed_history.sql
-- Tracks deterministic database seeds.
-- =====================================================

CREATE TABLE seed_history (
    seed_history_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    seed_name VARCHAR(255) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,

    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_seed_history_seed_name
        UNIQUE (seed_name),

    CONSTRAINT chk_seed_history_checksum
        CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$')
);

CREATE INDEX ix_seed_history_applied_at
    ON seed_history(applied_at);
