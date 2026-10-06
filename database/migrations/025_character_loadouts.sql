-- =====================================================
-- 025_character_loadouts.sql
-- Requires: characters, spells
-- =====================================================

CREATE TABLE character_loadouts (
    character_loadout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    name VARCHAR(50) NOT NULL,

    spell_1_id UUID NULL,
    spell_2_id UUID NULL,
    spell_3_id UUID NULL,

    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_loadouts_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_loadouts_spell_1
        FOREIGN KEY (spell_1_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_character_loadouts_spell_2
        FOREIGN KEY (spell_2_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_character_loadouts_spell_3
        FOREIGN KEY (spell_3_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_loadouts_character_name
        UNIQUE (character_id, name),

    CONSTRAINT chk_character_loadouts_distinct_spells
        CHECK (
            (spell_1_id IS NULL OR spell_2_id IS NULL OR spell_1_id <> spell_2_id)
            AND
            (spell_1_id IS NULL OR spell_3_id IS NULL OR spell_1_id <> spell_3_id)
            AND
            (spell_2_id IS NULL OR spell_3_id IS NULL OR spell_2_id <> spell_3_id)
        ),

    CONSTRAINT chk_character_loadouts_spell_order
        CHECK (
            (spell_2_id IS NULL OR spell_1_id IS NOT NULL)
            AND
            (spell_3_id IS NULL OR spell_2_id IS NOT NULL)
        )
);

CREATE INDEX ix_character_loadouts_character_id
    ON character_loadouts(character_id);

CREATE UNIQUE INDEX ux_character_loadouts_default
    ON character_loadouts(character_id)
    WHERE is_default = TRUE;
