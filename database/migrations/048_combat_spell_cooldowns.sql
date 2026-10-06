-- 048_combat_spell_cooldowns.sql
-- Requires: combat_sessions, spells
CREATE TABLE combat_spell_cooldowns (
 combat_spell_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 combat_session_id UUID NOT NULL,
 spell_id UUID NOT NULL,
 remaining_turns INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_spell_cooldowns_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_spell_cooldowns_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
 CONSTRAINT ux_combat_spell_cooldowns_session_spell UNIQUE (combat_session_id,spell_id),
 CONSTRAINT chk_combat_spell_cooldowns_turns CHECK (remaining_turns >= 0)
);
CREATE INDEX ix_combat_spell_cooldowns_session_id ON combat_spell_cooldowns(combat_session_id);
CREATE INDEX ix_combat_spell_cooldowns_spell_id ON combat_spell_cooldowns(spell_id);
