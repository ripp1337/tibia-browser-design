-- =====================================================
-- 024_character_spells.sql
-- Requires: characters, spells
-- =====================================================

CREATE TABLE character_spells (
    character_spell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,
    spell_id UUID NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_spells_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_spells_spell
        FOREIGN KEY (spell_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_spells_character_spell
        UNIQUE (character_id, spell_id)
);

CREATE INDEX ix_character_spells_character_id
    ON character_spells(character_id);

CREATE INDEX ix_character_spells_spell_id
    ON character_spells(spell_id);
