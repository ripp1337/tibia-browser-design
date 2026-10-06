-- 053_crafting_history.sql
-- Requires: characters, recipes
CREATE TABLE crafting_history (
 crafting_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 recipe_id UUID NOT NULL,
 quantity_crafted INTEGER NOT NULL,
 crafting_xp_earned BIGINT NOT NULL DEFAULT 0,
 completed_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_crafting_history_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_crafting_history_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE RESTRICT,
 CONSTRAINT chk_crafting_history_quantity CHECK (quantity_crafted > 0),
 CONSTRAINT chk_crafting_history_xp CHECK (crafting_xp_earned >= 0)
);
CREATE INDEX ix_crafting_history_character_id ON crafting_history(character_id);
CREATE INDEX ix_crafting_history_recipe_id ON crafting_history(recipe_id);
CREATE INDEX ix_crafting_history_completed_at ON crafting_history(completed_at);
