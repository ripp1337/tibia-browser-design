-- =====================================================
-- 084_unique_monster_task_boss.sql
-- Requires: monster_tasks
-- =====================================================

ALTER TABLE monster_tasks
    ADD CONSTRAINT ux_monster_tasks_boss_id
    UNIQUE (boss_id);