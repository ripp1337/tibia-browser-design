-- =====================================================
-- 090_item_loot_generation.sql
-- M7 Item and Loot Generation schema foundation
-- Requires: migrations 001-089
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Guardrails: M7 stores authored and generated rolls as
-- whole integers. Abort instead of silently rounding.
-- -----------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM affix_templates
        WHERE min_value <> TRUNC(min_value)
           OR max_value <> TRUNC(max_value)
    ) THEN
        RAISE EXCEPTION
            'M7 migration requires integral affix_templates ranges.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM item_bases
        WHERE attack <> TRUNC(attack)
           OR defense <> TRUNC(defense)
           OR spell_power <> TRUNC(spell_power)
           OR health <> TRUNC(health)
           OR mana <> TRUNC(mana)
           OR energy <> TRUNC(energy)
           OR gold_percent <> TRUNC(gold_percent)
           OR experience_percent <> TRUNC(experience_percent)
    ) THEN
        RAISE EXCEPTION
            'M7 migration requires integral item_bases statistics.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unique_templates
        WHERE min_attack <> TRUNC(min_attack)
           OR max_attack <> TRUNC(max_attack)
           OR min_defense <> TRUNC(min_defense)
           OR max_defense <> TRUNC(max_defense)
           OR min_spell_power <> TRUNC(min_spell_power)
           OR max_spell_power <> TRUNC(max_spell_power)
           OR min_health <> TRUNC(min_health)
           OR max_health <> TRUNC(max_health)
           OR min_mana <> TRUNC(min_mana)
           OR max_mana <> TRUNC(max_mana)
           OR min_energy <> TRUNC(min_energy)
           OR max_energy <> TRUNC(max_energy)
    ) THEN
        RAISE EXCEPTION
            'M7 migration requires integral unique_templates ranges.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM item_affixes
        WHERE roll_value <> TRUNC(roll_value)
    ) THEN
        RAISE EXCEPTION
            'M7 migration requires integral item_affixes rolls.';
    END IF;

    IF EXISTS (
        SELECT item_id
        FROM item_affixes
        GROUP BY item_id
        HAVING COUNT(*) > 4
    ) THEN
        RAISE EXCEPTION
            'M7 supports at most four affixes per generated item.';
    END IF;
END;
$$;

-- -----------------------------------------------------
-- Generated Item Required Level authority
-- -----------------------------------------------------
ALTER TABLE items
    ADD COLUMN required_level INTEGER;

UPDATE items
SET required_level = item_level;

ALTER TABLE items
    ALTER COLUMN required_level SET NOT NULL,
    ADD CONSTRAINT chk_items_required_level
        CHECK (required_level >= 1),
    ADD CONSTRAINT chk_items_required_level_matches_item_level
        CHECK (required_level = item_level);

CREATE INDEX ix_items_required_level
    ON items(required_level);

-- -----------------------------------------------------
-- Regular Items use rarity; Unique/Set Items use NULL.
-- Item Base template constraints identify special items.
-- -----------------------------------------------------
ALTER TABLE items
    DROP CONSTRAINT chk_items_rarity,
    ALTER COLUMN rarity DROP NOT NULL,
    ADD CONSTRAINT chk_items_rarity
        CHECK (
            rarity IS NULL
            OR rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')
        );

-- -----------------------------------------------------
-- Whole-integer authored and generated values
-- -----------------------------------------------------
ALTER TABLE affix_templates
    DROP CONSTRAINT chk_affix_templates_values;

ALTER TABLE affix_templates
    ALTER COLUMN min_value TYPE BIGINT
        USING min_value::BIGINT,
    ALTER COLUMN max_value TYPE BIGINT
        USING max_value::BIGINT;

ALTER TABLE affix_templates
    ADD CONSTRAINT chk_affix_templates_values
        CHECK (min_value >= 0 AND max_value >= min_value);

ALTER TABLE item_bases
    DROP CONSTRAINT chk_item_bases_stats;

ALTER TABLE item_bases
    ALTER COLUMN attack TYPE BIGINT USING attack::BIGINT,
    ALTER COLUMN defense TYPE BIGINT USING defense::BIGINT,
    ALTER COLUMN spell_power TYPE BIGINT USING spell_power::BIGINT,
    ALTER COLUMN health TYPE BIGINT USING health::BIGINT,
    ALTER COLUMN mana TYPE BIGINT USING mana::BIGINT,
    ALTER COLUMN energy TYPE BIGINT USING energy::BIGINT,
    ALTER COLUMN gold_percent TYPE INTEGER USING gold_percent::INTEGER,
    ALTER COLUMN experience_percent TYPE INTEGER
        USING experience_percent::INTEGER;

ALTER TABLE item_bases
    ADD CONSTRAINT chk_item_bases_stats
        CHECK (
            attack >= 0
            AND defense >= 0
            AND spell_power >= 0
            AND health >= 0
            AND mana >= 0
            AND energy >= 0
            AND gold_percent >= 0
            AND experience_percent >= 0
            AND base_item_score >= 0
        );

-- -----------------------------------------------------
-- Independent Affix slots with stable positions
-- -----------------------------------------------------
ALTER TABLE item_affixes
    DROP CONSTRAINT ux_item_affixes_item_template,
    DROP CONSTRAINT chk_item_affixes_roll_value,
    ADD COLUMN affix_position SMALLINT;

WITH positioned_affixes AS (
    SELECT
        item_affix_id,
        ROW_NUMBER() OVER (
            PARTITION BY item_id
            ORDER BY created_at, item_affix_id
        ) AS generated_position
    FROM item_affixes
)
UPDATE item_affixes AS target
SET affix_position = source.generated_position::SMALLINT
FROM positioned_affixes AS source
WHERE target.item_affix_id = source.item_affix_id;

ALTER TABLE item_affixes
    ALTER COLUMN roll_value TYPE BIGINT
        USING roll_value::BIGINT,
    ALTER COLUMN affix_position SET NOT NULL,
    ADD CONSTRAINT ux_item_affixes_item_position
        UNIQUE (item_id, affix_position),
    ADD CONSTRAINT chk_item_affixes_position
        CHECK (affix_position BETWEEN 1 AND 4),
    ADD CONSTRAINT chk_item_affixes_roll_value
        CHECK (roll_value >= 0);

-- -----------------------------------------------------
-- Authoritative Item Base to Affix weighted pool
-- -----------------------------------------------------
CREATE TABLE item_base_affix_weights (
    item_base_affix_weight_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    item_base_id UUID NOT NULL,
    affix_template_id UUID NOT NULL,
    selection_weight BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_item_base_affix_weights_item_base
        FOREIGN KEY (item_base_id)
        REFERENCES item_bases(item_base_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_base_affix_weights_affix_template
        FOREIGN KEY (affix_template_id)
        REFERENCES affix_templates(affix_template_id)
        ON DELETE RESTRICT,
    CONSTRAINT ux_item_base_affix_weights_base_template
        UNIQUE (item_base_id, affix_template_id),
    CONSTRAINT chk_item_base_affix_weights_selection_weight
        CHECK (selection_weight > 0)
);

CREATE INDEX ix_item_base_affix_weights_item_base_id
    ON item_base_affix_weights(item_base_id);

CREATE INDEX ix_item_base_affix_weights_affix_template_id
    ON item_base_affix_weights(affix_template_id);

-- -----------------------------------------------------
-- Unique and Set authored fixed-stat ranges
-- -----------------------------------------------------
CREATE TABLE item_base_fixed_stat_ranges (
    item_base_fixed_stat_range_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    item_base_id UUID NOT NULL,
    stat_position SMALLINT NOT NULL,
    stat_type VARCHAR(32) NOT NULL,
    min_value BIGINT NOT NULL,
    max_value BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_item_base_fixed_stat_ranges_item_base
        FOREIGN KEY (item_base_id)
        REFERENCES item_bases(item_base_id)
        ON DELETE CASCADE,
    CONSTRAINT ux_item_base_fixed_stat_ranges_base_position
        UNIQUE (item_base_id, stat_position),
    CONSTRAINT ux_item_base_fixed_stat_ranges_base_type
        UNIQUE (item_base_id, stat_type),
    CONSTRAINT chk_item_base_fixed_stat_ranges_position
        CHECK (stat_position >= 1),
    CONSTRAINT chk_item_base_fixed_stat_ranges_type
        CHECK (
            stat_type IN (
                'Attack',
                'Defense',
                'SpellPower',
                'Health',
                'Mana',
                'Energy',
                'GoldPercent',
                'ExperiencePercent'
            )
        ),
    CONSTRAINT chk_item_base_fixed_stat_ranges_values
        CHECK (min_value >= 0 AND max_value >= min_value)
);

CREATE INDEX ix_item_base_fixed_stat_ranges_item_base_id
    ON item_base_fixed_stat_ranges(item_base_id);

-- Convert historical Unique Template ranges to per-Item-Base ranges.
WITH unique_ranges AS (
    SELECT
        item_base.item_base_id,
        range_data.stat_position,
        range_data.stat_type,
        range_data.min_value,
        range_data.max_value
    FROM item_bases AS item_base
    INNER JOIN unique_templates AS template
        ON template.unique_template_id = item_base.unique_template_id
    CROSS JOIN LATERAL (
        VALUES
            (1::SMALLINT, 'Attack'::VARCHAR(32),
                template.min_attack::BIGINT,
                template.max_attack::BIGINT),
            (2::SMALLINT, 'Defense'::VARCHAR(32),
                template.min_defense::BIGINT,
                template.max_defense::BIGINT),
            (3::SMALLINT, 'SpellPower'::VARCHAR(32),
                template.min_spell_power::BIGINT,
                template.max_spell_power::BIGINT),
            (4::SMALLINT, 'Health'::VARCHAR(32),
                template.min_health::BIGINT,
                template.max_health::BIGINT),
            (5::SMALLINT, 'Mana'::VARCHAR(32),
                template.min_mana::BIGINT,
                template.max_mana::BIGINT),
            (6::SMALLINT, 'Energy'::VARCHAR(32),
                template.min_energy::BIGINT,
                template.max_energy::BIGINT)
    ) AS range_data(
        stat_position,
        stat_type,
        min_value,
        max_value
    )
    WHERE item_base.is_unique = TRUE
      AND (
          range_data.min_value <> 0
          OR range_data.max_value <> 0
      )
),
positioned_unique_ranges AS (
    SELECT
        item_base_id,
        ROW_NUMBER() OVER (
            PARTITION BY item_base_id
            ORDER BY stat_position
        )::SMALLINT AS final_position,
        stat_type,
        min_value,
        max_value
    FROM unique_ranges
)
INSERT INTO item_base_fixed_stat_ranges (
    item_base_id,
    stat_position,
    stat_type,
    min_value,
    max_value
)
SELECT
    item_base_id,
    final_position,
    stat_type,
    min_value,
    max_value
FROM positioned_unique_ranges;

-- Historical template ranges are no longer authoritative.
ALTER TABLE unique_templates
    DROP CONSTRAINT chk_unique_templates_attack,
    DROP CONSTRAINT chk_unique_templates_defense,
    DROP CONSTRAINT chk_unique_templates_spell_power,
    DROP CONSTRAINT chk_unique_templates_health,
    DROP CONSTRAINT chk_unique_templates_mana,
    DROP CONSTRAINT chk_unique_templates_energy,
    DROP COLUMN min_attack,
    DROP COLUMN max_attack,
    DROP COLUMN min_defense,
    DROP COLUMN max_defense,
    DROP COLUMN min_spell_power,
    DROP COLUMN max_spell_power,
    DROP COLUMN min_health,
    DROP COLUMN max_health,
    DROP COLUMN min_mana,
    DROP COLUMN max_mana,
    DROP COLUMN min_energy,
    DROP COLUMN max_energy;

-- -----------------------------------------------------
-- Actual fixed-stat rolls on generated Unique/Set Items
-- -----------------------------------------------------
CREATE TABLE item_fixed_stats (
    item_fixed_stat_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    stat_position SMALLINT NOT NULL,
    stat_type VARCHAR(32) NOT NULL,
    roll_value BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_item_fixed_stats_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE CASCADE,
    CONSTRAINT ux_item_fixed_stats_item_position
        UNIQUE (item_id, stat_position),
    CONSTRAINT ux_item_fixed_stats_item_type
        UNIQUE (item_id, stat_type),
    CONSTRAINT chk_item_fixed_stats_position
        CHECK (stat_position >= 1),
    CONSTRAINT chk_item_fixed_stats_type
        CHECK (
            stat_type IN (
                'Attack',
                'Defense',
                'SpellPower',
                'Health',
                'Mana',
                'Energy',
                'GoldPercent',
                'ExperiencePercent'
            )
        ),
    CONSTRAINT chk_item_fixed_stats_roll_value
        CHECK (roll_value >= 0)
);

CREATE INDEX ix_item_fixed_stats_item_id
    ON item_fixed_stats(item_id);

CREATE INDEX ix_item_fixed_stats_stat_type
    ON item_fixed_stats(stat_type);

-- -----------------------------------------------------
-- Regular Item Base pools become weighted pools.
-- Preserve exact relative proportions from NUMERIC(7,4).
-- -----------------------------------------------------
ALTER TABLE loot_tables
    ADD COLUMN selection_weight BIGINT;

UPDATE loot_tables
SET selection_weight = (drop_chance_percent * 10000)::BIGINT;

ALTER TABLE loot_tables
    DROP CONSTRAINT chk_loot_tables_chance,
    DROP CONSTRAINT chk_loot_tables_levels,
    DROP COLUMN drop_chance_percent,
    DROP COLUMN min_item_level,
    DROP COLUMN max_item_level,
    DROP COLUMN loot_level_modifier,
    ALTER COLUMN selection_weight SET NOT NULL,
    ADD CONSTRAINT chk_loot_tables_selection_weight
        CHECK (selection_weight > 0);

-- -----------------------------------------------------
-- Other Loot becomes one weighted pool after the
-- independent Other Loot success roll.
-- -----------------------------------------------------
ALTER TABLE other_loot_tables
    ADD COLUMN selection_weight BIGINT;

UPDATE other_loot_tables
SET selection_weight = (drop_chance_percent * 10000)::BIGINT;

ALTER TABLE other_loot_tables
    DROP CONSTRAINT chk_other_loot_tables_chance,
    DROP COLUMN drop_chance_percent,
    ALTER COLUMN selection_weight SET NOT NULL,
    ADD CONSTRAINT chk_other_loot_tables_selection_weight
        CHECK (selection_weight > 0);

CREATE UNIQUE INDEX ux_other_loot_tables_monster_material
    ON other_loot_tables(monster_id, material_id)
    WHERE material_id IS NOT NULL;

CREATE UNIQUE INDEX ux_other_loot_tables_monster_consumable
    ON other_loot_tables(monster_id, consumable_definition_id)
    WHERE consumable_definition_id IS NOT NULL;

-- -----------------------------------------------------
-- Weighted Unique/Set source pools
-- -----------------------------------------------------
CREATE TABLE special_item_sources (
    special_item_source_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    monster_id UUID NULL,
    monster_family_id UUID NULL,
    item_base_id UUID NOT NULL,
    selection_weight BIGINT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_special_item_sources_monster
        FOREIGN KEY (monster_id)
        REFERENCES monsters(monster_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_special_item_sources_monster_family
        FOREIGN KEY (monster_family_id)
        REFERENCES monster_families(monster_family_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_special_item_sources_item_base
        FOREIGN KEY (item_base_id)
        REFERENCES item_bases(item_base_id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_special_item_sources_owner
        CHECK (
            (monster_id IS NOT NULL)::INTEGER
            + (monster_family_id IS NOT NULL)::INTEGER
            = 1
        ),
    CONSTRAINT chk_special_item_sources_selection_weight
        CHECK (selection_weight > 0)
);

CREATE UNIQUE INDEX ux_special_item_sources_monster_item
    ON special_item_sources(monster_id, item_base_id)
    WHERE monster_id IS NOT NULL;

CREATE UNIQUE INDEX ux_special_item_sources_family_item
    ON special_item_sources(monster_family_id, item_base_id)
    WHERE monster_family_id IS NOT NULL;

CREATE INDEX ix_special_item_sources_enabled_monster
    ON special_item_sources(monster_id)
    WHERE is_enabled = TRUE AND monster_id IS NOT NULL;

CREATE INDEX ix_special_item_sources_enabled_family
    ON special_item_sources(monster_family_id)
    WHERE is_enabled = TRUE AND monster_family_id IS NOT NULL;

CREATE INDEX ix_special_item_sources_item_base_id
    ON special_item_sources(item_base_id);

-- -----------------------------------------------------
-- Authoritative Item Score coefficients
-- -----------------------------------------------------
CREATE TABLE item_score_coefficients (
    item_score_coefficient_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    score_component VARCHAR(32) NOT NULL,
    coefficient BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_item_score_coefficients_component
        UNIQUE (score_component),
    CONSTRAINT chk_item_score_coefficients_component
        CHECK (
            score_component IN (
                'ItemLevel',
                'Attack',
                'Defense',
                'SpellPower',
                'Health',
                'Mana',
                'Energy',
                'GoldPercent',
                'ExperiencePercent'
            )
        ),
    CONSTRAINT chk_item_score_coefficients_value
        CHECK (coefficient >= 0)
);

-- -----------------------------------------------------
-- Canonical per-Character Unique/Set pity state
-- -----------------------------------------------------
ALTER TABLE unique_pity_tracking
    DROP CONSTRAINT chk_unique_pity_tracking_chance,
    DROP CONSTRAINT chk_unique_pity_tracking_kills;

UPDATE unique_pity_tracking
SET
    eligible_kill_count = LEAST(
        99,
        GREATEST(0, eligible_kill_count)
    ),
    current_chance_percent = LEAST(
        10.0,
        0.1 + LEAST(
            99,
            GREATEST(0, eligible_kill_count)
        ) * 0.1
    );

ALTER TABLE unique_pity_tracking
    ALTER COLUMN current_chance_percent TYPE NUMERIC(4,1)
        USING current_chance_percent::NUMERIC(4,1),
    ALTER COLUMN current_chance_percent SET DEFAULT 0.1,
    ALTER COLUMN eligible_kill_count SET DEFAULT 0,
    ADD CONSTRAINT chk_unique_pity_tracking_kills
        CHECK (eligible_kill_count BETWEEN 0 AND 99),
    ADD CONSTRAINT chk_unique_pity_tracking_chance
        CHECK (
            current_chance_percent BETWEEN 0.1 AND 10.0
        ),
    ADD CONSTRAINT chk_unique_pity_tracking_state
        CHECK (
            current_chance_percent = LEAST(
                10.0,
                0.1 + eligible_kill_count * 0.1
            )
        );

COMMIT;
