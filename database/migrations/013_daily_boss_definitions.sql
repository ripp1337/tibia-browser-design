-- =====================================================
-- 013_daily_boss_definitions.sql
-- Requires: bosses
-- =====================================================

CREATE TABLE daily_boss_definitions (
    daily_boss_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,

    tier INTEGER NOT NULL,
    recommended_level INTEGER NOT NULL,
    attempts_per_day INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_definitions_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(boss_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_daily_boss_definitions_boss_id UNIQUE (boss_id),
    CONSTRAINT chk_daily_boss_definitions_tier CHECK (tier BETWEEN 1 AND 3),
    CONSTRAINT chk_daily_boss_definitions_recommended_level
        CHECK (recommended_level >= 1),
    CONSTRAINT chk_daily_boss_definitions_attempts
        CHECK (attempts_per_day >= 1)
);

CREATE INDEX ix_daily_boss_definitions_tier
    ON daily_boss_definitions(tier);
