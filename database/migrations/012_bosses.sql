-- =====================================================
-- 012_bosses.sql
-- Requires: monsters
-- =====================================================

CREATE TABLE bosses (
    boss_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,

    boss_type VARCHAR(20) NOT NULL,
    loot_level_bonus INTEGER NOT NULL DEFAULT 0,
    unique_modifier NUMERIC(8, 4) NOT NULL DEFAULT 1.0000,
    additional_cooldown_seconds INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bosses_monster
        FOREIGN KEY (monster_id)
        REFERENCES monsters(monster_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_bosses_monster_id UNIQUE (monster_id),

    CONSTRAINT chk_bosses_type
        CHECK (boss_type IN ('MiniBoss', 'TaskBoss', 'DailyBoss')),

    CONSTRAINT chk_bosses_loot_level_bonus CHECK (loot_level_bonus >= 0),
    CONSTRAINT chk_bosses_unique_modifier CHECK (unique_modifier >= 0),
    CONSTRAINT chk_bosses_additional_cooldown
        CHECK (additional_cooldown_seconds >= 0)
);

CREATE INDEX ix_bosses_boss_type
    ON bosses(boss_type);
