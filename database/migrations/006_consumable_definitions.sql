-- =====================================================
-- 006_consumable_definitions.sql
-- =====================================================

CREATE TABLE consumable_definitions (
    consumable_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    category VARCHAR(32) NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'None',
    effect_type VARCHAR(32) NOT NULL,

    effect_value NUMERIC(12, 4) NOT NULL DEFAULT 0,
    duration_type VARCHAR(20) NOT NULL,
    duration_value INTEGER NULL,
    potion_cooldown_turns INTEGER NOT NULL DEFAULT 0,

    max_stack_size INTEGER NOT NULL DEFAULT 999,
    is_tradable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_consumable_definitions_name UNIQUE (name),

    CONSTRAINT chk_consumable_definitions_category
        CHECK (category IN (
            'HealthPotion', 'ManaPotion', 'EnergyPotion', 'GoldBoost',
            'ExperienceBoost', 'Blessing', 'ProtectionStone'
        )),

    CONSTRAINT chk_consumable_definitions_tier
        CHECK (tier IN ('Small', 'Medium', 'Large', 'Grand', 'Ultimate', 'None')),

    CONSTRAINT chk_consumable_definitions_effect_type
        CHECK (effect_type IN (
            'RestoreHealth', 'RestoreMana', 'RestoreEnergy', 'GoldBonus',
            'ExperienceBonus', 'Blessing', 'UpgradeProtection'
        )),

    CONSTRAINT chk_consumable_definitions_duration_type
        CHECK (duration_type IN ('Instant', 'Fights', 'Passive')),

    CONSTRAINT chk_consumable_definitions_duration_value
        CHECK (
            (duration_type = 'Instant' AND duration_value IS NULL)
            OR
            (duration_type IN ('Fights', 'Passive') AND duration_value IS NOT NULL AND duration_value > 0)
        ),

    CONSTRAINT chk_consumable_definitions_effect_value
        CHECK (effect_value >= 0),

    CONSTRAINT chk_consumable_definitions_potion_cooldown
        CHECK (potion_cooldown_turns >= 0),

    CONSTRAINT chk_consumable_definitions_stack_size
        CHECK (max_stack_size BETWEEN 1 AND 999)
);

CREATE INDEX ix_consumable_definitions_category
    ON consumable_definitions(category);

CREATE INDEX ix_consumable_definitions_effect_type
    ON consumable_definitions(effect_type);
