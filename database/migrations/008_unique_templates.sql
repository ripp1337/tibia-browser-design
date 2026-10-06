-- =====================================================
-- 008_unique_templates.sql
-- =====================================================

CREATE TABLE unique_templates (
    unique_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    min_attack NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_attack NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_defense NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_defense NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_spell_power NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_spell_power NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_health NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_health NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_mana NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_mana NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_energy NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_energy NUMERIC(12, 4) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_unique_templates_name UNIQUE (name),

    CONSTRAINT chk_unique_templates_attack
        CHECK (min_attack >= 0 AND max_attack >= min_attack),

    CONSTRAINT chk_unique_templates_defense
        CHECK (min_defense >= 0 AND max_defense >= min_defense),

    CONSTRAINT chk_unique_templates_spell_power
        CHECK (min_spell_power >= 0 AND max_spell_power >= min_spell_power),

    CONSTRAINT chk_unique_templates_health
        CHECK (min_health >= 0 AND max_health >= min_health),

    CONSTRAINT chk_unique_templates_mana
        CHECK (min_mana >= 0 AND max_mana >= min_mana),

    CONSTRAINT chk_unique_templates_energy
        CHECK (min_energy >= 0 AND max_energy >= min_energy)
);
