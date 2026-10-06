-- =====================================================
-- 017_item_bases.sql
-- Requires: unique_templates, set_templates
-- =====================================================

CREATE TABLE item_bases (
    item_base_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    unique_template_id UUID NULL,
    set_template_id UUID NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    item_level INTEGER NOT NULL,
    required_level INTEGER NOT NULL DEFAULT 1,

    slot VARCHAR(20) NOT NULL,
    weapon_type VARCHAR(32) NULL,

    attack NUMERIC(12, 4) NOT NULL DEFAULT 0,
    defense NUMERIC(12, 4) NOT NULL DEFAULT 0,
    spell_power NUMERIC(12, 4) NOT NULL DEFAULT 0,
    health NUMERIC(12, 4) NOT NULL DEFAULT 0,
    mana NUMERIC(12, 4) NOT NULL DEFAULT 0,
    energy NUMERIC(12, 4) NOT NULL DEFAULT 0,
    gold_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
    experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,

    base_item_score BIGINT NOT NULL DEFAULT 0,

    is_boss_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_unique BOOLEAN NOT NULL DEFAULT FALSE,
    is_set BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_item_bases_unique_template
        FOREIGN KEY (unique_template_id)
        REFERENCES unique_templates(unique_template_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_item_bases_set_template
        FOREIGN KEY (set_template_id)
        REFERENCES set_templates(set_template_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_item_bases_name UNIQUE (name),

    CONSTRAINT chk_item_bases_levels
        CHECK (item_level >= 1 AND required_level >= 1),

    CONSTRAINT chk_item_bases_slot
        CHECK (slot IN ('Weapon', 'Helmet', 'Armor', 'Shield', 'Legs', 'Boots', 'Ring', 'Amulet')),

    CONSTRAINT chk_item_bases_weapon_type
        CHECK (
            (slot = 'Weapon' AND weapon_type IS NOT NULL)
            OR
            (slot <> 'Weapon' AND weapon_type IS NULL)
        ),

    CONSTRAINT chk_item_bases_stats
        CHECK (
            attack >= 0 AND defense >= 0 AND spell_power >= 0
            AND health >= 0 AND mana >= 0 AND energy >= 0
            AND gold_percent >= 0 AND experience_percent >= 0
            AND base_item_score >= 0
        ),

    CONSTRAINT chk_item_bases_template_type
        CHECK (
            (is_unique = TRUE AND unique_template_id IS NOT NULL AND is_set = FALSE AND set_template_id IS NULL)
            OR
            (is_set = TRUE AND set_template_id IS NOT NULL AND is_unique = FALSE AND unique_template_id IS NULL)
            OR
            (is_unique = FALSE AND unique_template_id IS NULL AND is_set = FALSE AND set_template_id IS NULL)
        )
);

CREATE INDEX ix_item_bases_item_level
    ON item_bases(item_level);

CREATE INDEX ix_item_bases_slot
    ON item_bases(slot);

CREATE INDEX ix_item_bases_is_boss_exclusive
    ON item_bases(is_boss_exclusive);

CREATE INDEX ix_item_bases_unique_template_id
    ON item_bases(unique_template_id);

CREATE INDEX ix_item_bases_set_template_id
    ON item_bases(set_template_id);
