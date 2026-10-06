-- 054_gathering_sessions.sql
-- Requires: characters
CREATE TABLE gathering_sessions (
 gathering_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 ended_at TIMESTAMPTZ NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 gathering_level_at_start INTEGER NOT NULL,
 total_minutes_gathered INTEGER NOT NULL DEFAULT 0,
 experience_earned BIGINT NOT NULL DEFAULT 0,
 results_collected BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_gathering_sessions_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_gathering_sessions_status CHECK (status IN ('Active','Completed','Cancelled')),
 CONSTRAINT chk_gathering_sessions_level CHECK (gathering_level_at_start >= 1),
 CONSTRAINT chk_gathering_sessions_minutes CHECK (total_minutes_gathered BETWEEN 0 AND 1440),
 CONSTRAINT chk_gathering_sessions_xp CHECK (experience_earned >= 0),
 CONSTRAINT chk_gathering_sessions_end_state CHECK ((status='Active' AND ended_at IS NULL) OR (status<>'Active' AND ended_at IS NOT NULL AND ended_at >= started_at))
);
CREATE UNIQUE INDEX ux_gathering_sessions_active_character ON gathering_sessions(character_id) WHERE status='Active';
CREATE INDEX ix_gathering_sessions_character_id ON gathering_sessions(character_id);
CREATE INDEX ix_gathering_sessions_status ON gathering_sessions(status);
CREATE INDEX ix_gathering_sessions_started_at ON gathering_sessions(started_at);
