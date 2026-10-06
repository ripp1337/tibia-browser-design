-- =====================================================
-- 038_monster_tasks.sql
-- Requires: monsters, bosses
-- =====================================================

CREATE TABLE monster_tasks (
    monster_task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,
    boss_id UUID NOT NULL,
    required_kills BIGINT NOT NULL,
    reunlock_gold_cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_tasks_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT fk_monster_tasks_boss
        FOREIGN KEY (boss_id) REFERENCES bosses(boss_id) ON DELETE RESTRICT,
    CONSTRAINT ux_monster_tasks_monster_id UNIQUE (monster_id),
    CONSTRAINT chk_monster_tasks_required_kills CHECK (required_kills > 0),
    CONSTRAINT chk_monster_tasks_reunlock_gold_cost CHECK (reunlock_gold_cost >= 0)
);

CREATE INDEX ix_monster_tasks_boss_id ON monster_tasks(boss_id);
