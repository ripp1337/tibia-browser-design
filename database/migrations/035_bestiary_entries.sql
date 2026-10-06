-- =====================================================
-- 035_bestiary_entries.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE bestiary_entries (
    bestiary_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    monster_id UUID NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bestiary_entries_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_bestiary_entries_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT ux_bestiary_entries_character_monster UNIQUE (character_id, monster_id)
);

CREATE INDEX ix_bestiary_entries_character_id ON bestiary_entries(character_id);
CREATE INDEX ix_bestiary_entries_monster_id ON bestiary_entries(monster_id);
