-- 044_hourly_chest_progress.sql
-- Requires: characters
CREATE TABLE hourly_chest_progress (
 hourly_chest_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 next_available_at TIMESTAMPTZ NOT NULL,
 is_available BOOLEAN NOT NULL DEFAULT FALSE,
 last_claimed_at TIMESTAMPTZ NULL,
 total_claims BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_hourly_chest_progress_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_hourly_chest_progress_claims CHECK (total_claims >= 0),
 CONSTRAINT chk_hourly_chest_progress_claim_state CHECK ((total_claims = 0 AND last_claimed_at IS NULL) OR (total_claims > 0 AND last_claimed_at IS NOT NULL))
);
CREATE INDEX ix_hourly_chest_progress_next_available_at ON hourly_chest_progress(next_available_at);
CREATE INDEX ix_hourly_chest_progress_is_available ON hourly_chest_progress(is_available);
