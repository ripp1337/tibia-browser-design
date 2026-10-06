-- =====================================================
-- 029_inventory_items.sql
-- Requires: characters, items
-- =====================================================

CREATE TABLE inventory_items (
    inventory_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    item_id UUID NOT NULL,
    position INTEGER NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_inventory_items_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_items_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_inventory_items_item_id UNIQUE (item_id),
    CONSTRAINT ux_inventory_items_character_position UNIQUE (character_id, position),
    CONSTRAINT chk_inventory_items_position CHECK (position >= 1)
);

CREATE INDEX ix_inventory_items_character_id
    ON inventory_items(character_id);

CREATE INDEX ix_inventory_items_is_equipped
    ON inventory_items(is_equipped);
