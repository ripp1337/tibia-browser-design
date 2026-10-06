-- =====================================================
-- 079_add_stable_content_codes.sql
-- Adds immutable, machine-readable codes to authored game definitions.
-- Requires: migrations 001-078
-- =====================================================

-- Codes use lowercase snake_case and are intended to remain immutable.
-- Existing rows are backfilled deterministically from their current names.

CREATE OR REPLACE FUNCTION pg_temp.slugify_content_code(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT LEFT(
        COALESCE(
            NULLIF(
                TRIM(BOTH '_' FROM REGEXP_REPLACE(
                    LOWER(TRIM(value)),
                    '[^a-z0-9]+',
                    '_',
                    'g'
                )),
                ''
            ),
            'entry'
        ),
        55
    );
$$;

-- -----------------------------------------------------
-- materials
-- -----------------------------------------------------

ALTER TABLE materials
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        material_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM materials
)
UPDATE materials AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.material_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.material_id = source.material_id;

ALTER TABLE materials
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE materials
    ADD CONSTRAINT ux_materials_code UNIQUE (code);

ALTER TABLE materials
    ADD CONSTRAINT chk_materials_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- spells
-- -----------------------------------------------------

ALTER TABLE spells
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        spell_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM spells
)
UPDATE spells AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.spell_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.spell_id = source.spell_id;

ALTER TABLE spells
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE spells
    ADD CONSTRAINT ux_spells_code UNIQUE (code);

ALTER TABLE spells
    ADD CONSTRAINT chk_spells_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- consumable_definitions
-- -----------------------------------------------------

ALTER TABLE consumable_definitions
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        consumable_definition_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM consumable_definitions
)
UPDATE consumable_definitions AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.consumable_definition_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.consumable_definition_id = source.consumable_definition_id;

ALTER TABLE consumable_definitions
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE consumable_definitions
    ADD CONSTRAINT ux_consumable_definitions_code UNIQUE (code);

ALTER TABLE consumable_definitions
    ADD CONSTRAINT chk_consumable_definitions_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- monster_families
-- -----------------------------------------------------

ALTER TABLE monster_families
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        monster_family_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM monster_families
)
UPDATE monster_families AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.monster_family_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.monster_family_id = source.monster_family_id;

ALTER TABLE monster_families
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE monster_families
    ADD CONSTRAINT ux_monster_families_code UNIQUE (code);

ALTER TABLE monster_families
    ADD CONSTRAINT chk_monster_families_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- unique_templates
-- -----------------------------------------------------

ALTER TABLE unique_templates
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        unique_template_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM unique_templates
)
UPDATE unique_templates AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.unique_template_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.unique_template_id = source.unique_template_id;

ALTER TABLE unique_templates
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE unique_templates
    ADD CONSTRAINT ux_unique_templates_code UNIQUE (code);

ALTER TABLE unique_templates
    ADD CONSTRAINT chk_unique_templates_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- set_templates
-- -----------------------------------------------------

ALTER TABLE set_templates
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        set_template_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM set_templates
)
UPDATE set_templates AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.set_template_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.set_template_id = source.set_template_id;

ALTER TABLE set_templates
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE set_templates
    ADD CONSTRAINT ux_set_templates_code UNIQUE (code);

ALTER TABLE set_templates
    ADD CONSTRAINT chk_set_templates_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- npc_definitions
-- -----------------------------------------------------

ALTER TABLE npc_definitions
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        npc_definition_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM npc_definitions
)
UPDATE npc_definitions AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.npc_definition_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.npc_definition_id = source.npc_definition_id;

ALTER TABLE npc_definitions
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE npc_definitions
    ADD CONSTRAINT ux_npc_definitions_code UNIQUE (code);

ALTER TABLE npc_definitions
    ADD CONSTRAINT chk_npc_definitions_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- outfit_definitions
-- -----------------------------------------------------

ALTER TABLE outfit_definitions
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        outfit_definition_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM outfit_definitions
)
UPDATE outfit_definitions AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.outfit_definition_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.outfit_definition_id = source.outfit_definition_id;

ALTER TABLE outfit_definitions
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE outfit_definitions
    ADD CONSTRAINT ux_outfit_definitions_code UNIQUE (code);

ALTER TABLE outfit_definitions
    ADD CONSTRAINT chk_outfit_definitions_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- monsters
-- -----------------------------------------------------

ALTER TABLE monsters
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        monster_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM monsters
)
UPDATE monsters AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.monster_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.monster_id = source.monster_id;

ALTER TABLE monsters
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE monsters
    ADD CONSTRAINT ux_monsters_code UNIQUE (code);

ALTER TABLE monsters
    ADD CONSTRAINT chk_monsters_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- item_bases
-- -----------------------------------------------------

ALTER TABLE item_bases
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        item_base_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM item_bases
)
UPDATE item_bases AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.item_base_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.item_base_id = source.item_base_id;

ALTER TABLE item_bases
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE item_bases
    ADD CONSTRAINT ux_item_bases_code UNIQUE (code);

ALTER TABLE item_bases
    ADD CONSTRAINT chk_item_bases_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- recipes
-- -----------------------------------------------------

ALTER TABLE recipes
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        recipe_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM recipes
)
UPDATE recipes AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.recipe_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.recipe_id = source.recipe_id;

ALTER TABLE recipes
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE recipes
    ADD CONSTRAINT ux_recipes_code UNIQUE (code);

ALTER TABLE recipes
    ADD CONSTRAINT chk_recipes_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- Display names remain user-facing and may continue to have their existing
-- uniqueness constraints. Application logic, CSV imports, and relationships
-- should use code as the permanent content identity.
