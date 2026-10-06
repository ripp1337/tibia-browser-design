-- =====================================================
-- 007_materials.sql
-- =====================================================

CREATE TABLE materials (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    material_level INTEGER NOT NULL DEFAULT 1,

    vendor_available BOOLEAN NOT NULL DEFAULT FALSE,
    vendor_price BIGINT NULL,

    is_gatherable BOOLEAN NOT NULL DEFAULT FALSE,
    is_lootable BOOLEAN NOT NULL DEFAULT FALSE,
    is_crafting_ingredient BOOLEAN NOT NULL DEFAULT TRUE,

    required_gathering_level INTEGER NOT NULL DEFAULT 1,
    minimum_monster_level INTEGER NULL,
    max_stack_size INTEGER NOT NULL DEFAULT 999,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_materials_name UNIQUE (name),

    CONSTRAINT chk_materials_material_level
        CHECK (material_level >= 1),

    CONSTRAINT chk_materials_vendor_price
        CHECK (
            (vendor_available = FALSE AND vendor_price IS NULL)
            OR
            (vendor_available = TRUE AND vendor_price IS NOT NULL AND vendor_price >= 0)
        ),

    CONSTRAINT chk_materials_required_gathering_level
        CHECK (required_gathering_level >= 1),

    CONSTRAINT chk_materials_minimum_monster_level
        CHECK (minimum_monster_level IS NULL OR minimum_monster_level >= 1),

    CONSTRAINT chk_materials_stack_size
        CHECK (max_stack_size BETWEEN 1 AND 999),

    CONSTRAINT chk_materials_source
        CHECK (is_gatherable = TRUE OR is_lootable = TRUE OR vendor_available = TRUE)
);

CREATE INDEX ix_materials_material_level
    ON materials(material_level);

CREATE INDEX ix_materials_required_gathering_level
    ON materials(required_gathering_level);

CREATE INDEX ix_materials_minimum_monster_level
    ON materials(minimum_monster_level);

CREATE INDEX ix_materials_is_gatherable
    ON materials(is_gatherable);

CREATE INDEX ix_materials_is_lootable
    ON materials(is_lootable);
