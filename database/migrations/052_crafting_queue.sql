-- 052_crafting_queue.sql
-- Requires: characters, recipes
CREATE TABLE crafting_queue (
 crafting_queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 recipe_id UUID NOT NULL,
 quantity INTEGER NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Pending',
 started_at TIMESTAMPTZ NULL,
 completes_at TIMESTAMPTZ NOT NULL,
 crafting_slot INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_crafting_queue_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_crafting_queue_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE RESTRICT,
 CONSTRAINT chk_crafting_queue_quantity CHECK (quantity > 0),
 CONSTRAINT chk_crafting_queue_status CHECK (status IN ('Pending','Active','Completed','Cancelled')),
 CONSTRAINT chk_crafting_queue_slot CHECK (crafting_slot BETWEEN 1 AND 3),
 CONSTRAINT chk_crafting_queue_dates CHECK ((started_at IS NULL AND status IN ('Pending','Cancelled')) OR (started_at IS NOT NULL AND completes_at > started_at))
);
CREATE INDEX ix_crafting_queue_character_id ON crafting_queue(character_id);
CREATE INDEX ix_crafting_queue_status ON crafting_queue(status);
CREATE INDEX ix_crafting_queue_completes_at ON crafting_queue(completes_at);
CREATE UNIQUE INDEX ux_crafting_queue_active_slot ON crafting_queue(character_id,crafting_slot) WHERE status IN ('Pending','Active');
