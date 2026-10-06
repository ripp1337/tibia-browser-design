-- =====================================================
-- 032_equipment_loadouts.sql
-- Requires: characters, items
-- =====================================================

CREATE TABLE equipment_loadouts (
    equipment_loadout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    weapon_item_id UUID NULL,
    helmet_item_id UUID NULL,
    armor_item_id UUID NULL,
    shield_item_id UUID NULL,
    legs_item_id UUID NULL,
    boots_item_id UUID NULL,
    ring_item_id UUID NULL,
    amulet_item_id UUID NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_equipment_loadouts_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_loadouts_weapon FOREIGN KEY (weapon_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_helmet FOREIGN KEY (helmet_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_armor FOREIGN KEY (armor_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_shield FOREIGN KEY (shield_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_legs FOREIGN KEY (legs_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_boots FOREIGN KEY (boots_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_ring FOREIGN KEY (ring_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_amulet FOREIGN KEY (amulet_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT ux_equipment_loadouts_character_name UNIQUE (character_id, name)
);

CREATE INDEX ix_equipment_loadouts_character_id ON equipment_loadouts(character_id);
CREATE UNIQUE INDEX ux_equipment_loadouts_default ON equipment_loadouts(character_id) WHERE is_default = TRUE;
