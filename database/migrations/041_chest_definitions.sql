-- 041_chest_definitions.sql
CREATE TABLE chest_definitions (
 chest_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(32) NOT NULL UNIQUE,
 cooldown_seconds INTEGER NOT NULL,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT chk_chest_definitions_name CHECK (name IN ('HourlyChest','DailyChest')),
 CONSTRAINT chk_chest_definitions_cooldown CHECK (cooldown_seconds > 0)
);
CREATE INDEX ix_chest_definitions_is_enabled ON chest_definitions(is_enabled);
