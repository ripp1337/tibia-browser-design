-- =====================================================
-- 034_set_bonuses.sql
-- Requires: set_templates
-- =====================================================

CREATE TABLE set_bonuses (
    set_bonus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_template_id UUID NOT NULL,
    required_pieces INTEGER NOT NULL,
    bonus_type VARCHAR(32) NOT NULL,
    bonus_value NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_set_bonuses_template
        FOREIGN KEY (set_template_id) REFERENCES set_templates(set_template_id) ON DELETE CASCADE,
    CONSTRAINT ux_set_bonuses_template_pieces_type
        UNIQUE (set_template_id, required_pieces, bonus_type),
    CONSTRAINT chk_set_bonuses_required_pieces CHECK (required_pieces >= 2),
    CONSTRAINT chk_set_bonuses_type
        CHECK (bonus_type IN ('Attack', 'Defense', 'SpellPower', 'GoldPercent', 'ExperiencePercent', 'Health', 'Mana')),
    CONSTRAINT chk_set_bonuses_value CHECK (bonus_value >= 0)
);

CREATE INDEX ix_set_bonuses_template_id ON set_bonuses(set_template_id);
