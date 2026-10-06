-- 046_combat_sessions.sql
-- Requires: characters, monsters
CREATE TABLE combat_sessions (
 combat_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 monster_id UUID NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 current_turn INTEGER NOT NULL DEFAULT 1,
 character_health BIGINT NOT NULL,
 character_mana BIGINT NOT NULL,
 monster_health BIGINT NOT NULL,
 started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 ended_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_sessions_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_sessions_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_sessions_status CHECK (status IN ('Active','Victory','Defeat','Abandoned')),
 CONSTRAINT chk_combat_sessions_turn CHECK (current_turn >= 1),
 CONSTRAINT chk_combat_sessions_resources CHECK (character_health >= 0 AND character_mana >= 0 AND monster_health >= 0),
 CONSTRAINT chk_combat_sessions_end_state CHECK ((status = 'Active' AND ended_at IS NULL) OR (status <> 'Active' AND ended_at IS NOT NULL AND ended_at >= started_at))
);
CREATE UNIQUE INDEX ux_combat_sessions_active_character ON combat_sessions(character_id) WHERE status = 'Active';
CREATE INDEX ix_combat_sessions_character_id ON combat_sessions(character_id);
CREATE INDEX ix_combat_sessions_monster_id ON combat_sessions(monster_id);
CREATE INDEX ix_combat_sessions_status ON combat_sessions(status);
