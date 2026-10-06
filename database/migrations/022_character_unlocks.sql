-- =====================================================
-- 022_character_unlocks.sql
-- Requires: characters
-- =====================================================

CREATE TABLE character_unlocks (
    character_unlocks_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
    spell_slots_unlocked INTEGER NOT NULL DEFAULT 1,
    crafting_slots_unlocked INTEGER NOT NULL DEFAULT 1,
    inventory_slots INTEGER NOT NULL DEFAULT 50,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_unlocks_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_unlocks_character_id
        UNIQUE (character_id),

    CONSTRAINT chk_character_unlocks_spell_slots
        CHECK (spell_slots_unlocked BETWEEN 1 AND 3),

    CONSTRAINT chk_character_unlocks_crafting_slots
        CHECK (crafting_slots_unlocked BETWEEN 1 AND 3),

    CONSTRAINT chk_character_unlocks_inventory_slots
        CHECK (inventory_slots IN (50, 100))
);
