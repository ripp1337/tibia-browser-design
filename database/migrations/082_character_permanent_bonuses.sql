BEGIN;

CREATE TABLE character_permanent_bonuses (
    character_permanent_bonuses_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,

    attack NUMERIC(12, 4) NOT NULL DEFAULT 0,
    defense NUMERIC(12, 4) NOT NULL DEFAULT 0,
    spell_power NUMERIC(12, 4) NOT NULL DEFAULT 0,

    health NUMERIC(12, 4) NOT NULL DEFAULT 0,
    mana NUMERIC(12, 4) NOT NULL DEFAULT 0,
    energy NUMERIC(12, 4) NOT NULL DEFAULT 0,

    gold_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
    experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_permanent_bonuses_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_permanent_bonuses_character
        UNIQUE (character_id),

    CONSTRAINT chk_character_permanent_bonuses_values
        CHECK (
            attack >= 0
            AND defense >= 0
            AND spell_power >= 0
            AND health >= 0
            AND mana >= 0
            AND energy >= 0
            AND gold_percent >= 0
            AND experience_percent >= 0
        )
);

INSERT INTO character_permanent_bonuses (
    character_id
)
SELECT character_id
FROM characters
ON CONFLICT (character_id) DO NOTHING;

COMMIT;

