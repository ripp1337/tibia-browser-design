-- =====================================================
-- 014_daily_boss_pools.sql
-- Requires: daily_boss_definitions
-- =====================================================

CREATE TABLE daily_boss_pools (
    daily_boss_pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_boss_definition_id UUID NOT NULL,

    tier INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_pools_definition
        FOREIGN KEY (daily_boss_definition_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_daily_boss_pools_tier_definition
        UNIQUE (tier, daily_boss_definition_id),

    CONSTRAINT chk_daily_boss_pools_tier CHECK (tier BETWEEN 1 AND 3)
);

CREATE INDEX ix_daily_boss_pools_tier
    ON daily_boss_pools(tier);

CREATE INDEX ix_daily_boss_pools_definition_id
    ON daily_boss_pools(daily_boss_definition_id);

CREATE INDEX ix_daily_boss_pools_active_tier
    ON daily_boss_pools(tier)
    WHERE is_active = TRUE;
