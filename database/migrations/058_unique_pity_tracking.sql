-- 058_unique_pity_tracking.sql
-- Requires: characters
CREATE TABLE unique_pity_tracking (
 unique_pity_tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 eligible_kill_count BIGINT NOT NULL DEFAULT 0,
 current_chance_percent NUMERIC(7,4) NOT NULL DEFAULT 0,
 last_unique_drop_at TIMESTAMPTZ NULL,
 last_set_drop_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_unique_pity_tracking_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_unique_pity_tracking_kills CHECK (eligible_kill_count >= 0),
 CONSTRAINT chk_unique_pity_tracking_chance CHECK (current_chance_percent >= 0 AND current_chance_percent <= 100)
);
