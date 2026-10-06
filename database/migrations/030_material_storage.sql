-- =====================================================
-- 030_material_storage.sql
-- Requires: characters, materials
-- =====================================================

CREATE TABLE material_storage (
    material_storage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    material_id UUID NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_material_storage_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_storage_material
        FOREIGN KEY (material_id)
        REFERENCES materials(material_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_material_storage_character_material
        UNIQUE (character_id, material_id),

    CONSTRAINT chk_material_storage_quantity CHECK (quantity >= 0)
);

CREATE INDEX ix_material_storage_character_id
    ON material_storage(character_id);

CREATE INDEX ix_material_storage_material_id
    ON material_storage(material_id);
