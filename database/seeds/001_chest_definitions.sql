-- =====================================================
-- 001_chest_definitions.sql
-- Static chest definitions.
-- =====================================================

INSERT INTO chest_definitions (
    name,
    cooldown_seconds,
    is_enabled
)
VALUES
    ('HourlyChest', 3600, TRUE),
    ('DailyChest', 86400, TRUE)
ON CONFLICT (name)
DO UPDATE SET
    cooldown_seconds = EXCLUDED.cooldown_seconds,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();
