-- 064_outfit_definitions.sql
CREATE TABLE outfit_definitions (
 outfit_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 artwork TEXT NULL,
 category VARCHAR(64) NOT NULL,
 display_order INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT chk_outfit_definitions_display_order CHECK (display_order>=0)
);
CREATE INDEX ix_outfit_definitions_display_order ON outfit_definitions(display_order);
CREATE INDEX ix_outfit_definitions_category ON outfit_definitions(category);
