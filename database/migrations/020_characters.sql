-- =====================================================
-- 020_characters.sql
-- Requires: accounts, seasons
-- =====================================================

CREATE TABLE characters (
    character_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL,
    season_id UUID NULL,

    name VARCHAR(32) NOT NULL,

    level INTEGER NOT NULL DEFAULT 1,
    experience BIGINT NOT NULL DEFAULT 0,
    gold BIGINT NOT NULL DEFAULT 0,

    current_health BIGINT NOT NULL DEFAULT 180,
    current_mana BIGINT NOT NULL DEFAULT 35,
    current_energy BIGINT NOT NULL DEFAULT 100,

    max_health BIGINT NOT NULL DEFAULT 180,
    max_mana BIGINT NOT NULL DEFAULT 35,
    max_energy BIGINT NOT NULL DEFAULT 100,

    crafting_level INTEGER NOT NULL DEFAULT 1,
    crafting_xp BIGINT NOT NULL DEFAULT 0,

    gathering_level INTEGER NOT NULL DEFAULT 1,
    gathering_xp BIGINT NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'IsActive',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_characters_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_characters_season
        FOREIGN KEY (season_id)
        REFERENCES seasons(season_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_characters_name UNIQUE (name),

    CONSTRAINT chk_characters_level CHECK (level >= 1),
    CONSTRAINT chk_characters_experience CHECK (experience >= 0),
    CONSTRAINT chk_characters_gold CHECK (gold >= 0),

    CONSTRAINT chk_characters_resources
        CHECK (
            current_health >= 0 AND current_health <= max_health
            AND current_mana >= 0 AND current_mana <= max_mana
            AND current_energy >= 0 AND current_energy <= max_energy
        ),

    CONSTRAINT chk_characters_max_resources
        CHECK (max_health > 0 AND max_mana >= 0 AND max_energy > 0),

    CONSTRAINT chk_characters_crafting
        CHECK (crafting_level BETWEEN 1 AND 10 AND crafting_xp >= 0),

    CONSTRAINT chk_characters_gathering
        CHECK (gathering_level BETWEEN 1 AND 10 AND gathering_xp >= 0),

    CONSTRAINT chk_characters_status
        CHECK (status IN ('IsActive', 'Archived'))
);

CREATE INDEX ix_characters_account_id
    ON characters(account_id);

CREATE INDEX ix_characters_season_id
    ON characters(season_id);

CREATE INDEX ix_characters_level
    ON characters(level);

CREATE INDEX ix_characters_experience
    ON characters(experience);

CREATE INDEX ix_characters_status
    ON characters(status);
