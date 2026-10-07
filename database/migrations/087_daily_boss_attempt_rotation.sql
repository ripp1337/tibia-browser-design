-- =====================================================
-- 087_daily_boss_attempt_rotation.sql
-- Requires: daily_boss_rotation,
--           character_daily_boss_progress
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM character_daily_boss_progress
    ) THEN
        RAISE EXCEPTION
            'Migration 087 requires character_daily_boss_progress to be empty.';
    END IF;
END
$$;

ALTER TABLE character_daily_boss_progress
    DROP CONSTRAINT ux_character_daily_boss_progress;

ALTER TABLE character_daily_boss_progress
    ADD COLUMN daily_boss_rotation_id UUID NOT NULL;

ALTER TABLE character_daily_boss_progress
    RENAME COLUMN attempts_used_today
    TO attempts_used_in_rotation;

ALTER TABLE character_daily_boss_progress
    RENAME CONSTRAINT chk_character_daily_boss_attempts_today
    TO chk_character_daily_boss_attempts_rotation;

ALTER TABLE character_daily_boss_progress
    DROP COLUMN attempts_date;

ALTER TABLE character_daily_boss_progress
    ADD CONSTRAINT fk_character_daily_boss_progress_rotation
    FOREIGN KEY (daily_boss_rotation_id)
    REFERENCES daily_boss_rotation(daily_boss_rotation_id)
    ON DELETE RESTRICT;

ALTER TABLE character_daily_boss_progress
    ADD CONSTRAINT ux_character_daily_boss_progress
    UNIQUE (
        character_id,
        daily_boss_definition_id,
        daily_boss_rotation_id
    );

CREATE INDEX ix_character_daily_boss_progress_rotation_id
    ON character_daily_boss_progress(
        daily_boss_rotation_id
    );
