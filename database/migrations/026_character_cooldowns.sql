-- =====================================================
-- 026_character_cooldowns.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE character_cooldowns (
    character_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    cooldown_type VARCHAR(32) NOT NULL,
    target_id UUID NULL,
    available_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_cooldowns_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_cooldowns_target
        FOREIGN KEY (target_id)
        REFERENCES monsters(monster_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_character_cooldowns_type
        CHECK (cooldown_type IN ('Monster', 'NpcHealer')),

    CONSTRAINT chk_character_cooldowns_target
        CHECK (
            (cooldown_type = 'Monster' AND target_id IS NOT NULL)
            OR
            (cooldown_type = 'NpcHealer' AND target_id IS NULL)
        )
);

CREATE UNIQUE INDEX ux_character_cooldowns_monster
    ON character_cooldowns(character_id, target_id)
    WHERE cooldown_type = 'Monster';

CREATE UNIQUE INDEX ux_character_cooldowns_npc_healer
    ON character_cooldowns(character_id)
    WHERE cooldown_type = 'NpcHealer';

CREATE INDEX ix_character_cooldowns_character_id
    ON character_cooldowns(character_id);

CREATE INDEX ix_character_cooldowns_cooldown_type
    ON character_cooldowns(cooldown_type);

CREATE INDEX ix_character_cooldowns_target_id
    ON character_cooldowns(target_id);

CREATE INDEX ix_character_cooldowns_available_at
    ON character_cooldowns(available_at);
