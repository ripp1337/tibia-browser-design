-- 049_combat_logs.sql
-- Requires: combat_sessions, characters, monsters
CREATE TABLE combat_logs (
 combat_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 combat_session_id UUID NOT NULL UNIQUE,
 character_id UUID NOT NULL,
 monster_id UUID NOT NULL,
 combat_result VARCHAR(20) NOT NULL,
 turn_count INTEGER NOT NULL,
 started_at TIMESTAMPTZ NOT NULL,
 ended_at TIMESTAMPTZ NOT NULL,
 combat_data_json JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_logs_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE RESTRICT,
 CONSTRAINT fk_combat_logs_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_logs_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_logs_result CHECK (combat_result IN ('Victory','Defeat')),
 CONSTRAINT chk_combat_logs_turn_count CHECK (turn_count >= 1),
 CONSTRAINT chk_combat_logs_dates CHECK (ended_at >= started_at)
);
CREATE INDEX ix_combat_logs_character_id ON combat_logs(character_id);
CREATE INDEX ix_combat_logs_monster_id ON combat_logs(monster_id);
CREATE INDEX ix_combat_logs_created_at ON combat_logs(created_at);
