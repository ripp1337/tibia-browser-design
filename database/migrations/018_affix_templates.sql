-- =====================================================
-- 018_affix_templates.sql
-- =====================================================

CREATE TABLE affix_templates (
    affix_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    affix_type VARCHAR(32) NOT NULL,
    tier INTEGER NOT NULL,
    required_item_level INTEGER NOT NULL DEFAULT 1,

    min_value NUMERIC(12, 4) NOT NULL,
    max_value NUMERIC(12, 4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_affix_templates_type_tier
        UNIQUE (affix_type, tier),

    CONSTRAINT chk_affix_templates_type
        CHECK (affix_type IN (
            'Attack', 'Defense', 'SpellPower', 'Health', 'Mana',
            'Energy', 'GoldPercent', 'ExperiencePercent'
        )),

    CONSTRAINT chk_affix_templates_tier
        CHECK (tier >= 1),

    CONSTRAINT chk_affix_templates_required_level
        CHECK (required_item_level >= 1),

    CONSTRAINT chk_affix_templates_values
        CHECK (min_value >= 0 AND max_value >= min_value)
);

CREATE INDEX ix_affix_templates_affix_type
    ON affix_templates(affix_type);

CREATE INDEX ix_affix_templates_required_item_level
    ON affix_templates(required_item_level);
