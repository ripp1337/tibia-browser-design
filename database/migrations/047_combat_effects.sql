-- 047_combat_effects.sql
-- Requires: combat_sessions, spells, consumable_definitions
CREATE TABLE combat_effects (
 combat_effect_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 combat_session_id UUID NOT NULL,
 effect_type VARCHAR(32) NOT NULL,
 target_type VARCHAR(20) NOT NULL,
 source_type VARCHAR(20) NOT NULL,
 spell_id UUID NULL,
 consumable_definition_id UUID NULL,
 value NUMERIC(12,4) NOT NULL,
 remaining_turns INTEGER NOT NULL,
 applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_effects_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_effects_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
 CONSTRAINT fk_combat_effects_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_effects_type CHECK (effect_type IN ('DamageOverTime','HealOverTime','AttackBuff','DefenseBuff','SpellPowerBuff','AttackDebuff','DefenseDebuff','SpellPowerDebuff','ManaDrain','HealthDrain','PotionDisable')),
 CONSTRAINT chk_combat_effects_target CHECK (target_type IN ('Character','Monster')),
 CONSTRAINT chk_combat_effects_source_type CHECK (source_type IN ('Spell','Consumable','System')),
 CONSTRAINT chk_combat_effects_source CHECK ((source_type='Spell' AND spell_id IS NOT NULL AND consumable_definition_id IS NULL) OR (source_type='Consumable' AND consumable_definition_id IS NOT NULL AND spell_id IS NULL) OR (source_type='System' AND spell_id IS NULL AND consumable_definition_id IS NULL)),
 CONSTRAINT chk_combat_effects_turns CHECK (remaining_turns >= 0),
 CONSTRAINT ux_combat_effects_session_type_target UNIQUE (combat_session_id,effect_type,target_type)
);
CREATE INDEX ix_combat_effects_session_id ON combat_effects(combat_session_id);
CREATE INDEX ix_combat_effects_effect_type ON combat_effects(effect_type);
CREATE INDEX ix_combat_effects_target_type ON combat_effects(target_type);
