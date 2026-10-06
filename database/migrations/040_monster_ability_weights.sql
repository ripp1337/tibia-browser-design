-- =====================================================
-- 040_monster_ability_weights.sql
-- Requires: monster_abilities
-- =====================================================

CREATE TABLE monster_ability_weights (
    monster_ability_weight_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    monster_ability_id UUID NOT NULL,

    weight NUMERIC(12, 4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_ability_weights_ability
        FOREIGN KEY (monster_ability_id)
        REFERENCES monster_abilities(monster_ability_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_monster_ability_weights_weight
        CHECK (weight > 0)
);

CREATE INDEX ix_monster_ability_weights_ability_id
    ON monster_ability_weights(monster_ability_id);