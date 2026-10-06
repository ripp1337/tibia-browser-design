-- =====================================================
-- 015_daily_boss_rotation.sql
-- Requires: daily_boss_definitions
-- =====================================================

CREATE TABLE daily_boss_rotation (
    daily_boss_rotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tier_1_boss_id UUID NOT NULL,
    tier_2_boss_id UUID NOT NULL,
    tier_3_boss_id UUID NOT NULL,

    reset_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_rotation_tier_1
        FOREIGN KEY (tier_1_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_daily_boss_rotation_tier_2
        FOREIGN KEY (tier_2_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_daily_boss_rotation_tier_3
        FOREIGN KEY (tier_3_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_daily_boss_rotation_distinct
        CHECK (
            tier_1_boss_id <> tier_2_boss_id
            AND tier_1_boss_id <> tier_3_boss_id
            AND tier_2_boss_id <> tier_3_boss_id
        )
);

CREATE INDEX ix_daily_boss_rotation_reset_timestamp
    ON daily_boss_rotation(reset_timestamp);
