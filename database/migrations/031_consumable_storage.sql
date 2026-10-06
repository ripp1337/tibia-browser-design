-- =====================================================
-- 031_consumable_storage.sql
-- Requires: characters, consumable_definitions
-- =====================================================

CREATE TABLE consumable_storage (
    consumable_storage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    consumable_definition_id UUID NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_consumable_storage_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_consumable_storage_definition
        FOREIGN KEY (consumable_definition_id)
        REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
    CONSTRAINT ux_consumable_storage_character_definition
        UNIQUE (character_id, consumable_definition_id),
    CONSTRAINT chk_consumable_storage_quantity CHECK (quantity >= 0)
);

CREATE INDEX ix_consumable_storage_character_id ON consumable_storage(character_id);
CREATE INDEX ix_consumable_storage_definition_id ON consumable_storage(consumable_definition_id);
