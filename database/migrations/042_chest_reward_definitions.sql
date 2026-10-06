-- 042_chest_reward_definitions.sql
-- Requires: chest_definitions
CREATE TABLE chest_reward_definitions (
 chest_reward_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 chest_definition_id UUID NOT NULL,
 reward_type VARCHAR(32) NOT NULL,
 min_quantity INTEGER NOT NULL DEFAULT 1,
 max_quantity INTEGER NOT NULL DEFAULT 1,
 chance_percent NUMERIC(7,4) NOT NULL,
 minimum_character_level INTEGER NOT NULL DEFAULT 1,
 maximum_character_level INTEGER NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_chest_reward_definitions_chest FOREIGN KEY (chest_definition_id) REFERENCES chest_definitions(chest_definition_id) ON DELETE CASCADE,
 CONSTRAINT chk_chest_reward_definitions_type CHECK (reward_type IN ('Gold','Item','Material','Consumable','Blessing','ProtectionStone','UniqueRoll','SetRoll')),
 CONSTRAINT chk_chest_reward_definitions_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity),
 CONSTRAINT chk_chest_reward_definitions_chance CHECK (chance_percent > 0 AND chance_percent <= 100),
 CONSTRAINT chk_chest_reward_definitions_levels CHECK (minimum_character_level >= 1 AND (maximum_character_level IS NULL OR maximum_character_level >= minimum_character_level))
);
CREATE INDEX ix_chest_reward_definitions_chest_id ON chest_reward_definitions(chest_definition_id);
CREATE INDEX ix_chest_reward_definitions_reward_type ON chest_reward_definitions(reward_type);
CREATE INDEX ix_chest_reward_definitions_level_range ON chest_reward_definitions(minimum_character_level,maximum_character_level);
