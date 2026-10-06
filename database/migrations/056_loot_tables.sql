-- 056_loot_tables.sql
-- Requires: monsters, item_bases
CREATE TABLE loot_tables (
 loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 monster_id UUID NOT NULL,
 item_base_id UUID NOT NULL,
 drop_chance_percent NUMERIC(7,4) NOT NULL,
 min_item_level INTEGER NOT NULL,
 max_item_level INTEGER NOT NULL,
 loot_level_modifier INTEGER NOT NULL DEFAULT 0,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
 CONSTRAINT fk_loot_tables_item_base FOREIGN KEY (item_base_id) REFERENCES item_bases(item_base_id) ON DELETE RESTRICT,
 CONSTRAINT ux_loot_tables_monster_item UNIQUE (monster_id,item_base_id),
 CONSTRAINT chk_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
 CONSTRAINT chk_loot_tables_levels CHECK (min_item_level >= 1 AND max_item_level >= min_item_level)
);
CREATE INDEX ix_loot_tables_monster_id ON loot_tables(monster_id);
CREATE INDEX ix_loot_tables_item_base_id ON loot_tables(item_base_id);
