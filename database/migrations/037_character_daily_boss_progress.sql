-- =====================================================
-- 037_character_daily_boss_progress.sql
-- Requires: characters, daily_boss_definitions
-- =====================================================

CREATE TABLE character_daily_boss_progress (
    character_daily_boss_progress_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,
    daily_boss_definition_id UUID NOT NULL,

    attempts_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attempts_used_today INTEGER NOT NULL DEFAULT 0,

    total_attempts BIGINT NOT NULL DEFAULT 0,
    total_victories BIGINT NOT NULL DEFAULT 0,

    last_attempt_at TIMESTAMPTZ NULL,
    last_victory_at TIMESTAMPTZ NULL,

    highest_tier_defeated INTEGER NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_daily_boss_progress_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_daily_boss_progress_definition
        FOREIGN KEY (daily_boss_definition_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_daily_boss_progress
        UNIQUE (
            character_id,
            daily_boss_definition_id
        ),

    CONSTRAINT chk_character_daily_boss_attempts_today
        CHECK (attempts_used_today >= 0),

    CONSTRAINT chk_character_daily_boss_totals
        CHECK (
            total_attempts >= 0
            AND total_victories >= 0
            AND total_victories <= total_attempts
        ),

    CONSTRAINT chk_character_daily_boss_highest_tier
        CHECK (
            highest_tier_defeated IS NULL
            OR highest_tier_defeated BETWEEN 1 AND 3
        ),

    CONSTRAINT chk_character_daily_boss_last_victory
        CHECK (
            last_victory_at IS NULL
            OR (
                last_attempt_at IS NOT NULL
                AND last_victory_at <= last_attempt_at
            )
        )
);

CREATE INDEX ix_character_daily_boss_progress_character_id
    ON character_daily_boss_progress(character_id);

CREATE INDEX ix_character_daily_boss_progress_definition_id
    ON character_daily_boss_progress(daily_boss_definition_id);

CREATE INDEX ix_character_daily_boss_progress_attempts_date
    ON character_daily_boss_progress(attempts_date);