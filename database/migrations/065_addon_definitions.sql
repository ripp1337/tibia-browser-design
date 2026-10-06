-- 065_addon_definitions.sql
-- Requires: outfit_definitions
CREATE TABLE addon_definitions (
 addon_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 outfit_definition_id UUID NOT NULL,
 name VARCHAR(100) NOT NULL,
 description TEXT NOT NULL,
 artwork TEXT NULL,
 display_order INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_addon_definitions_outfit FOREIGN KEY (outfit_definition_id) REFERENCES outfit_definitions(outfit_definition_id) ON DELETE CASCADE,
 CONSTRAINT ux_addon_definitions_outfit_name UNIQUE (outfit_definition_id,name),
 CONSTRAINT chk_addon_definitions_display_order CHECK (display_order>=0)
);
CREATE INDEX ix_addon_definitions_outfit_id ON addon_definitions(outfit_definition_id);
CREATE INDEX ix_addon_definitions_display_order ON addon_definitions(display_order);
