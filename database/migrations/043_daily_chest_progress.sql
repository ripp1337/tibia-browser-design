-- 043_daily_chest_progress.sql
-- Requires: characters
CREATE TABLE daily_chest_progress (
 daily_chest_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 next_available_at TIMESTAMPTZ NOT NULL,
 is_available BOOLEAN NOT NULL DEFAULT FALSE,
 last_claimed_at TIMESTAMPTZ NULL,
 total_claims BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_daily_chest_progress_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_daily_chest_progress_claims CHECK (total_claims >= 0),
 CONSTRAINT chk_daily_chest_progress_claim_state CHECK ((total_claims = 0 AND last_claimed_at IS NULL) OR (total_claims > 0 AND last_claimed_at IS NOT NULL))
);
CREATE INDEX ix_daily_chest_progress_next_available_at ON daily_chest_progress(next_available_at);
CREATE INDEX ix_daily_chest_progress_is_available ON daily_chest_progress(is_available);
