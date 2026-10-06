-- =====================================================
-- 028_character_buffs.sql
-- Requires: characters, consumable_definitions, spells
-- =====================================================

CREATE TABLE character_buffs (
    character_buff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    buff_type VARCHAR(32) NOT NULL,
    buff_source_type VARCHAR(20) NOT NULL,
    consumable_definition_id UUID NULL,
    spell_id UUID NULL,
    value NUMERIC(12, 4) NOT NULL,
    duration_type VARCHAR(20) NOT NULL,
    duration_remaining INTEGER NULL,
    is_positive BOOLEAN NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_buffs_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_buffs_consumable
        FOREIGN KEY (consumable_definition_id)
        REFERENCES consumable_definitions(consumable_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_character_buffs_spell
        FOREIGN KEY (spell_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_buffs_character_type
        UNIQUE (character_id, buff_type),

    CONSTRAINT chk_character_buffs_type
        CHECK (buff_type IN (
            'GoldBoost', 'ExperienceBoost', 'AttackBuff', 'DefenseBuff',
            'SpellPowerBuff', 'DamageOverTime', 'HealOverTime',
            'ManaDrain', 'HealthDrain', 'PotionDisable'
        )),

    CONSTRAINT chk_character_buffs_source_type
        CHECK (buff_source_type IN ('Consumable', 'Spell', 'System')),

    CONSTRAINT chk_character_buffs_source
        CHECK (
            (buff_source_type = 'Consumable' AND consumable_definition_id IS NOT NULL AND spell_id IS NULL)
            OR
            (buff_source_type = 'Spell' AND spell_id IS NOT NULL AND consumable_definition_id IS NULL)
            OR
            (buff_source_type = 'System' AND consumable_definition_id IS NULL AND spell_id IS NULL)
        ),

    CONSTRAINT chk_character_buffs_duration_type
        CHECK (duration_type IN ('Turns', 'Fights', 'Permanent')),

    CONSTRAINT chk_character_buffs_duration
        CHECK (
            (duration_type IN ('Turns', 'Fights') AND duration_remaining IS NOT NULL AND duration_remaining >= 0)
            OR
            (duration_type = 'Permanent' AND duration_remaining IS NULL AND expires_at IS NULL)
        ),

    CONSTRAINT chk_character_buffs_expiration
        CHECK (expires_at IS NULL OR expires_at > applied_at)
);

CREATE INDEX ix_character_buffs_character_id
    ON character_buffs(character_id);

CREATE INDEX ix_character_buffs_buff_type
    ON character_buffs(buff_type);

CREATE INDEX ix_character_buffs_expires_at
    ON character_buffs(expires_at);

CREATE INDEX ix_character_buffs_is_positive
    ON character_buffs(is_positive);
