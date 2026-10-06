-- 057_other_loot_tables.sql
-- Requires: monsters, materials, consumable_definitions
CREATE TABLE other_loot_tables (
 other_loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 monster_id UUID NOT NULL,
 material_id UUID NULL,
 consumable_definition_id UUID NULL,
 drop_chance_percent NUMERIC(7,4) NOT NULL,
 min_quantity INTEGER NOT NULL DEFAULT 1,
 max_quantity INTEGER NOT NULL DEFAULT 1,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_other_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
 CONSTRAINT fk_other_loot_tables_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_other_loot_tables_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_other_loot_tables_target CHECK ((material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
 CONSTRAINT chk_other_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
 CONSTRAINT chk_other_loot_tables_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity)
);
CREATE INDEX ix_other_loot_tables_monster_id ON other_loot_tables(monster_id);
CREATE INDEX ix_other_loot_tables_material_id ON other_loot_tables(material_id);
CREATE INDEX ix_other_loot_tables_consumable_id ON other_loot_tables(consumable_definition_id);
