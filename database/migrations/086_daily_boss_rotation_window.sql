-- =====================================================
-- 086_daily_boss_rotation_window.sql
-- Requires: daily_boss_rotation
-- =====================================================

ALTER TABLE daily_boss_rotation
    ADD CONSTRAINT chk_daily_boss_rotation_window
    CHECK (reset_timestamp > created_at);
