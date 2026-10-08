-- =====================================================
-- 089_victory_death_progression.sql
-- Requires: persistent combat API
-- =====================================================

BEGIN;

ALTER TABLE monsters
    ADD COLUMN experience_reward BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_monsters_experience_reward
        CHECK (experience_reward >= 0);

ALTER TABLE combat_sessions
    ADD COLUMN settled_at TIMESTAMPTZ,
    ADD COLUMN monster_experience_reward BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN monster_gold_min BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN monster_gold_max BIGINT NOT NULL DEFAULT 0;

UPDATE combat_sessions
SET settled_at = ended_at
WHERE status IN ('Victory', 'Defeat');

ALTER TABLE combat_sessions
    DROP CONSTRAINT chk_combat_sessions_status,
    DROP CONSTRAINT chk_combat_sessions_end_state;

ALTER TABLE combat_sessions
    ADD CONSTRAINT chk_combat_sessions_status
        CHECK (status IN ('Active', 'Victory', 'Defeat')),
    ADD CONSTRAINT chk_combat_sessions_reward_snapshot
        CHECK (
            monster_experience_reward >= 0
            AND monster_gold_min >= 0
            AND monster_gold_max >= monster_gold_min
        ),
    ADD CONSTRAINT chk_combat_sessions_end_state
        CHECK (
            (
                status = 'Active'
                AND ended_at IS NULL
                AND settled_at IS NULL
                AND defeat_reason IS NULL
            )
            OR (
                status = 'Victory'
                AND ended_at IS NOT NULL
                AND settled_at IS NOT NULL
                AND ended_at >= started_at
                AND settled_at >= started_at
                AND defeat_reason IS NULL
            )
            OR (
                status = 'Defeat'
                AND ended_at IS NOT NULL
                AND settled_at IS NOT NULL
                AND ended_at >= started_at
                AND settled_at >= started_at
                AND defeat_reason IS NOT NULL
            )
        );

CREATE TABLE character_blessings (
    character_blessing_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_blessings_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_blessings_character
        UNIQUE (character_id)
);

ALTER TABLE character_statistics
    ADD COLUMN current_no_death_streak BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_character_statistics_current_no_death_streak
        CHECK (current_no_death_streak >= 0);

CREATE INDEX ix_combat_logs_character_recent
    ON combat_logs (
        character_id,
        created_at DESC,
        combat_log_id DESC
    );

COMMIT;
