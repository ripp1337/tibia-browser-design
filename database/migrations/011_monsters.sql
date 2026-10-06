-- =====================================================
-- 011_monsters.sql
-- Requires: monster_families
-- =====================================================

CREATE TABLE monsters (
    monster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_family_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    monster_type VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,

    health BIGINT NOT NULL,
    attack NUMERIC(12, 4) NOT NULL,
    defense NUMERIC(12, 4) NOT NULL,
    spell_power_percent NUMERIC(8, 4) NOT NULL DEFAULT 100.0000,

    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
    ability_chance_percent NUMERIC(7, 4) NOT NULL DEFAULT 0,

    gold_min BIGINT NOT NULL DEFAULT 0,
    gold_max BIGINT NOT NULL DEFAULT 0,

    loot_level_modifier INTEGER NOT NULL DEFAULT 0,
    power_score BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monsters_family
        FOREIGN KEY (monster_family_id)
        REFERENCES monster_families(monster_family_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_monsters_name UNIQUE (name),

    CONSTRAINT chk_monsters_type
        CHECK (monster_type IN ('Normal', 'MiniBoss', 'TaskBoss', 'DailyBoss')),

    CONSTRAINT chk_monsters_level CHECK (level >= 1),
    CONSTRAINT chk_monsters_health CHECK (health > 0),
    CONSTRAINT chk_monsters_attack CHECK (attack >= 0),
    CONSTRAINT chk_monsters_defense CHECK (defense >= 0),
    CONSTRAINT chk_monsters_spell_power CHECK (spell_power_percent >= 0),
    CONSTRAINT chk_monsters_cooldown CHECK (cooldown_seconds >= 0),
    CONSTRAINT chk_monsters_ability_chance
        CHECK (ability_chance_percent >= 0 AND ability_chance_percent <= 100),
    CONSTRAINT chk_monsters_gold
        CHECK (gold_min >= 0 AND gold_max >= gold_min),
    CONSTRAINT chk_monsters_power_score CHECK (power_score >= 0)
);

CREATE INDEX ix_monsters_family_id
    ON monsters(monster_family_id);

CREATE INDEX ix_monsters_level
    ON monsters(level);

CREATE INDEX ix_monsters_type
    ON monsters(monster_type);
