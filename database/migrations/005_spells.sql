-- =====================================================
-- 005_spells.sql
-- =====================================================

CREATE TABLE spells (
    spell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NULL,

    category VARCHAR(32) NOT NULL,
    target_type VARCHAR(20) NOT NULL,

    mana_cost INTEGER NOT NULL DEFAULT 0,
    cooldown_turns INTEGER NOT NULL DEFAULT 0,
    base_value NUMERIC(12, 4) NOT NULL DEFAULT 0,
    duration_turns INTEGER NOT NULL DEFAULT 0,

    required_level INTEGER NOT NULL DEFAULT 1,
    gold_cost BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_spells_name UNIQUE (name),

    CONSTRAINT chk_spells_category
        CHECK (category IN (
            'Damage', 'DamageOverTime', 'Healing', 'HealOverTime',
            'ManaDrain', 'HealthDrain', 'PotionDisable', 'StatBuff', 'StatDebuff'
        )),

    CONSTRAINT chk_spells_target_type
        CHECK (target_type IN ('Self', 'Enemy')),

    CONSTRAINT chk_spells_mana_cost CHECK (mana_cost >= 0),
    CONSTRAINT chk_spells_cooldown_turns CHECK (cooldown_turns >= 0),
    CONSTRAINT chk_spells_duration_turns CHECK (duration_turns >= 0),
    CONSTRAINT chk_spells_required_level CHECK (required_level >= 1),
    CONSTRAINT chk_spells_gold_cost CHECK (gold_cost >= 0)
);

CREATE INDEX ix_spells_category
    ON spells(category);

CREATE INDEX ix_spells_required_level
    ON spells(required_level);
