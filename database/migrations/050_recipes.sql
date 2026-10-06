-- 050_recipes.sql
-- Requires: consumable_definitions
CREATE TABLE recipes (
 recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 category VARCHAR(20) NOT NULL,
 consumable_definition_id UUID NOT NULL,
 required_crafting_level INTEGER NOT NULL DEFAULT 1,
 required_character_level INTEGER NOT NULL DEFAULT 1,
 gold_cost BIGINT NOT NULL DEFAULT 0,
 crafting_time_seconds INTEGER NOT NULL,
 crafting_xp_reward BIGINT NOT NULL DEFAULT 0,
 output_quantity INTEGER NOT NULL DEFAULT 1,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_recipes_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_recipes_category CHECK (category IN ('Potion','Blessing','Upgrade','Boost')),
 CONSTRAINT chk_recipes_levels CHECK (required_crafting_level >= 1 AND required_character_level >= 1),
 CONSTRAINT chk_recipes_gold_cost CHECK (gold_cost >= 0),
 CONSTRAINT chk_recipes_time CHECK (crafting_time_seconds > 0),
 CONSTRAINT chk_recipes_xp CHECK (crafting_xp_reward >= 0),
 CONSTRAINT chk_recipes_output CHECK (output_quantity >= 1)
);
CREATE INDEX ix_recipes_category ON recipes(category);
CREATE INDEX ix_recipes_required_crafting_level ON recipes(required_crafting_level);
