-- =====================================================
-- 023_character_spell_mastery.sql
-- Requires: characters
-- =====================================================

CREATE TABLE character_spell_mastery (
    character_spell_mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    mastery_level INTEGER NOT NULL DEFAULT 1,
    mastery_experience BIGINT NOT NULL DEFAULT 0,
    current_spell_power_percent NUMERIC(8, 4) NOT NULL DEFAULT 100.0000,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_spell_mastery_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_spell_mastery_character_id
        UNIQUE (character_id),

    CONSTRAINT chk_character_spell_mastery_level
        CHECK (mastery_level >= 1),

    CONSTRAINT chk_character_spell_mastery_experience
        CHECK (mastery_experience >= 0),

    CONSTRAINT chk_character_spell_mastery_power
        CHECK (current_spell_power_percent >= 100)
);
