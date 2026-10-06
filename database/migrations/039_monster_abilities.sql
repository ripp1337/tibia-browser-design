-- =====================================================
-- 039_monster_abilities.sql
-- Requires: monsters, spells
-- =====================================================

CREATE TABLE monster_abilities (
    monster_ability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,
    spell_id UUID NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_abilities_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
    CONSTRAINT fk_monster_abilities_spell
        FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
    CONSTRAINT ux_monster_abilities_monster_spell UNIQUE (monster_id, spell_id)
);

CREATE INDEX ix_monster_abilities_monster_id ON monster_abilities(monster_id);
CREATE INDEX ix_monster_abilities_spell_id ON monster_abilities(spell_id);
