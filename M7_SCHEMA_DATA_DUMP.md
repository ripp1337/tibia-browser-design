# M7 Schema Data Dump

Generated: 2026-10-20 22:33:04 +02:00
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Authoritative pre-implementation schema evidence relevant to M7: Item and Loot Generation.

# ============================================================
# SOURCE: database/migrations/008_unique_templates.sql
# ============================================================

```sql
-- =====================================================
-- 008_unique_templates.sql
-- =====================================================

CREATE TABLE unique_templates (
    unique_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    min_attack NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_attack NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_defense NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_defense NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_spell_power NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_spell_power NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_health NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_health NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_mana NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_mana NUMERIC(12, 4) NOT NULL DEFAULT 0,

    min_energy NUMERIC(12, 4) NOT NULL DEFAULT 0,
    max_energy NUMERIC(12, 4) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_unique_templates_name UNIQUE (name),

    CONSTRAINT chk_unique_templates_attack
        CHECK (min_attack >= 0 AND max_attack >= min_attack),

    CONSTRAINT chk_unique_templates_defense
        CHECK (min_defense >= 0 AND max_defense >= min_defense),

    CONSTRAINT chk_unique_templates_spell_power
        CHECK (min_spell_power >= 0 AND max_spell_power >= min_spell_power),

    CONSTRAINT chk_unique_templates_health
        CHECK (min_health >= 0 AND max_health >= min_health),

    CONSTRAINT chk_unique_templates_mana
        CHECK (min_mana >= 0 AND max_mana >= min_mana),

    CONSTRAINT chk_unique_templates_energy
        CHECK (min_energy >= 0 AND max_energy >= min_energy)
);

```

# ============================================================
# SOURCE: database/migrations/009_set_templates.sql
# ============================================================

```sql
-- =====================================================
-- 009_set_templates.sql
-- =====================================================

CREATE TABLE set_templates (
    set_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    required_pieces INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_set_templates_name UNIQUE (name),

    CONSTRAINT chk_set_templates_required_pieces
        CHECK (required_pieces >= 2)
);

```

# ============================================================
# SOURCE: database/migrations/010_monster_families.sql
# ============================================================

```sql
-- =====================================================
-- 010_monster_families.sql
-- =====================================================

CREATE TABLE monster_families (
    monster_family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_monster_families_name UNIQUE (name)
);

```

# ============================================================
# SOURCE: database/migrations/011_monsters.sql
# ============================================================

```sql
-- =====================================================
-- 011_monsters.sql
-- Requires: monster_families
-- =====================================================

CREATE TABLE monsters (
    monster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_family_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    monster_type VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,

    health BIGINT NOT NULL,
    attack NUMERIC(12, 4) NOT NULL,
    defense NUMERIC(12, 4) NOT NULL,
    spell_power_percent NUMERIC(8, 4) NOT NULL DEFAULT 100.0000,

    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
    ability_chance_percent NUMERIC(7, 4) NOT NULL DEFAULT 0,

    gold_min BIGINT NOT NULL DEFAULT 0,
    gold_max BIGINT NOT NULL DEFAULT 0,

    loot_level_modifier INTEGER NOT NULL DEFAULT 0,
    power_score BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monsters_family
        FOREIGN KEY (monster_family_id)
        REFERENCES monster_families(monster_family_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_monsters_name UNIQUE (name),

    CONSTRAINT chk_monsters_type
        CHECK (monster_type IN ('Normal', 'MiniBoss', 'TaskBoss', 'DailyBoss')),

    CONSTRAINT chk_monsters_level CHECK (level >= 1),
    CONSTRAINT chk_monsters_health CHECK (health > 0),
    CONSTRAINT chk_monsters_attack CHECK (attack >= 0),
    CONSTRAINT chk_monsters_defense CHECK (defense >= 0),
    CONSTRAINT chk_monsters_spell_power CHECK (spell_power_percent >= 0),
    CONSTRAINT chk_monsters_cooldown CHECK (cooldown_seconds >= 0),
    CONSTRAINT chk_monsters_ability_chance
        CHECK (ability_chance_percent >= 0 AND ability_chance_percent <= 100),
    CONSTRAINT chk_monsters_gold
        CHECK (gold_min >= 0 AND gold_max >= gold_min),
    CONSTRAINT chk_monsters_power_score CHECK (power_score >= 0)
);

CREATE INDEX ix_monsters_family_id
    ON monsters(monster_family_id);

CREATE INDEX ix_monsters_level
    ON monsters(level);

CREATE INDEX ix_monsters_type
    ON monsters(monster_type);

```

# ============================================================
# SOURCE: database/migrations/012_bosses.sql
# ============================================================

```sql
-- =====================================================
-- 012_bosses.sql
-- Requires: monsters
-- =====================================================

CREATE TABLE bosses (
    boss_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,

    boss_type VARCHAR(20) NOT NULL,
    loot_level_bonus INTEGER NOT NULL DEFAULT 0,
    unique_modifier NUMERIC(8, 4) NOT NULL DEFAULT 1.0000,
    additional_cooldown_seconds INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bosses_monster
        FOREIGN KEY (monster_id)
        REFERENCES monsters(monster_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_bosses_monster_id UNIQUE (monster_id),

    CONSTRAINT chk_bosses_type
        CHECK (boss_type IN ('MiniBoss', 'TaskBoss', 'DailyBoss')),

    CONSTRAINT chk_bosses_loot_level_bonus CHECK (loot_level_bonus >= 0),
    CONSTRAINT chk_bosses_unique_modifier CHECK (unique_modifier >= 0),
    CONSTRAINT chk_bosses_additional_cooldown
        CHECK (additional_cooldown_seconds >= 0)
);

CREATE INDEX ix_bosses_boss_type
    ON bosses(boss_type);

```

# ============================================================
# SOURCE: database/migrations/017_item_bases.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/018_affix_templates.sql
# ============================================================

```sql
-- =====================================================
-- 018_affix_templates.sql
-- =====================================================

CREATE TABLE affix_templates (
    affix_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    affix_type VARCHAR(32) NOT NULL,
    tier INTEGER NOT NULL,
    required_item_level INTEGER NOT NULL DEFAULT 1,

    min_value NUMERIC(12, 4) NOT NULL,
    max_value NUMERIC(12, 4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_affix_templates_type_tier
        UNIQUE (affix_type, tier),

    CONSTRAINT chk_affix_templates_type
        CHECK (affix_type IN (
            'Attack', 'Defense', 'SpellPower', 'Health', 'Mana',
            'Energy', 'GoldPercent', 'ExperiencePercent'
        )),

    CONSTRAINT chk_affix_templates_tier
        CHECK (tier >= 1),

    CONSTRAINT chk_affix_templates_required_level
        CHECK (required_item_level >= 1),

    CONSTRAINT chk_affix_templates_values
        CHECK (min_value >= 0 AND max_value >= min_value)
);

CREATE INDEX ix_affix_templates_affix_type
    ON affix_templates(affix_type);

CREATE INDEX ix_affix_templates_required_item_level
    ON affix_templates(required_item_level);

```

# ============================================================
# SOURCE: database/migrations/019_items.sql
# ============================================================

```sql
-- =====================================================
-- 019_items.sql
-- Requires: item_bases
-- =====================================================

CREATE TABLE items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_base_id UUID NOT NULL,

    item_level INTEGER NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    item_score BIGINT NOT NULL DEFAULT 0,

    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_items_item_base
        FOREIGN KEY (item_base_id)
        REFERENCES item_bases(item_base_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_items_item_level
        CHECK (item_level >= 1),

    CONSTRAINT chk_items_rarity
        CHECK (rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')),

    CONSTRAINT chk_items_item_score
        CHECK (item_score >= 0)
);

CREATE INDEX ix_items_item_base_id
    ON items(item_base_id);

CREATE INDEX ix_items_item_level
    ON items(item_level);

CREATE INDEX ix_items_rarity
    ON items(rarity);

```

# ============================================================
# SOURCE: database/migrations/020_characters.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/029_inventory_items.sql
# ============================================================

```sql
-- =====================================================
-- 029_inventory_items.sql
-- Requires: characters, items
-- =====================================================

CREATE TABLE inventory_items (
    inventory_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    item_id UUID NOT NULL,
    position INTEGER NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_inventory_items_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_items_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_inventory_items_item_id UNIQUE (item_id),
    CONSTRAINT ux_inventory_items_character_position UNIQUE (character_id, position),
    CONSTRAINT chk_inventory_items_position CHECK (position >= 1)
);

CREATE INDEX ix_inventory_items_character_id
    ON inventory_items(character_id);

CREATE INDEX ix_inventory_items_is_equipped
    ON inventory_items(is_equipped);

```

# ============================================================
# SOURCE: database/migrations/030_material_storage.sql
# ============================================================

```sql
-- =====================================================
-- 030_material_storage.sql
-- Requires: characters, materials
-- =====================================================

CREATE TABLE material_storage (
    material_storage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    material_id UUID NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_material_storage_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_storage_material
        FOREIGN KEY (material_id)
        REFERENCES materials(material_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_material_storage_character_material
        UNIQUE (character_id, material_id),

    CONSTRAINT chk_material_storage_quantity CHECK (quantity >= 0)
);

CREATE INDEX ix_material_storage_character_id
    ON material_storage(character_id);

CREATE INDEX ix_material_storage_material_id
    ON material_storage(material_id);

```

# ============================================================
# SOURCE: database/migrations/031_consumable_storage.sql
# ============================================================

```sql
-- =====================================================
-- 031_consumable_storage.sql
-- Requires: characters, consumable_definitions
-- =====================================================

CREATE TABLE consumable_storage (
    consumable_storage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    consumable_definition_id UUID NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_consumable_storage_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_consumable_storage_definition
        FOREIGN KEY (consumable_definition_id)
        REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
    CONSTRAINT ux_consumable_storage_character_definition
        UNIQUE (character_id, consumable_definition_id),
    CONSTRAINT chk_consumable_storage_quantity CHECK (quantity >= 0)
);

CREATE INDEX ix_consumable_storage_character_id ON consumable_storage(character_id);
CREATE INDEX ix_consumable_storage_definition_id ON consumable_storage(consumable_definition_id);

```

# ============================================================
# SOURCE: database/migrations/032_equipment_loadouts.sql
# ============================================================

```sql
-- =====================================================
-- 032_equipment_loadouts.sql
-- Requires: characters, items
-- =====================================================

CREATE TABLE equipment_loadouts (
    equipment_loadout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    weapon_item_id UUID NULL,
    helmet_item_id UUID NULL,
    armor_item_id UUID NULL,
    shield_item_id UUID NULL,
    legs_item_id UUID NULL,
    boots_item_id UUID NULL,
    ring_item_id UUID NULL,
    amulet_item_id UUID NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_equipment_loadouts_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_loadouts_weapon FOREIGN KEY (weapon_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_helmet FOREIGN KEY (helmet_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_armor FOREIGN KEY (armor_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_shield FOREIGN KEY (shield_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_legs FOREIGN KEY (legs_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_boots FOREIGN KEY (boots_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_ring FOREIGN KEY (ring_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_loadouts_amulet FOREIGN KEY (amulet_item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    CONSTRAINT ux_equipment_loadouts_character_name UNIQUE (character_id, name)
);

CREATE INDEX ix_equipment_loadouts_character_id ON equipment_loadouts(character_id);
CREATE UNIQUE INDEX ux_equipment_loadouts_default ON equipment_loadouts(character_id) WHERE is_default = TRUE;

```

# ============================================================
# SOURCE: database/migrations/033_item_affixes.sql
# ============================================================

```sql
-- =====================================================
-- 033_item_affixes.sql
-- Requires: items, affix_templates
-- =====================================================

CREATE TABLE item_affixes (
    item_affix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    affix_template_id UUID NOT NULL,
    roll_value NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_item_affixes_item
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_affixes_template
        FOREIGN KEY (affix_template_id) REFERENCES affix_templates(affix_template_id) ON DELETE RESTRICT,
    CONSTRAINT ux_item_affixes_item_template UNIQUE (item_id, affix_template_id),
    CONSTRAINT chk_item_affixes_roll_value CHECK (roll_value >= 0)
);

CREATE INDEX ix_item_affixes_item_id ON item_affixes(item_id);
CREATE INDEX ix_item_affixes_template_id ON item_affixes(affix_template_id);

```

# ============================================================
# SOURCE: database/migrations/034_set_bonuses.sql
# ============================================================

```sql
-- =====================================================
-- 034_set_bonuses.sql
-- Requires: set_templates
-- =====================================================

CREATE TABLE set_bonuses (
    set_bonus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_template_id UUID NOT NULL,
    required_pieces INTEGER NOT NULL,
    bonus_type VARCHAR(32) NOT NULL,
    bonus_value NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_set_bonuses_template
        FOREIGN KEY (set_template_id) REFERENCES set_templates(set_template_id) ON DELETE CASCADE,
    CONSTRAINT ux_set_bonuses_template_pieces_type
        UNIQUE (set_template_id, required_pieces, bonus_type),
    CONSTRAINT chk_set_bonuses_required_pieces CHECK (required_pieces >= 2),
    CONSTRAINT chk_set_bonuses_type
        CHECK (bonus_type IN ('Attack', 'Defense', 'SpellPower', 'GoldPercent', 'ExperiencePercent', 'Health', 'Mana')),
    CONSTRAINT chk_set_bonuses_value CHECK (bonus_value >= 0)
);

CREATE INDEX ix_set_bonuses_template_id ON set_bonuses(set_template_id);

```

# ============================================================
# SOURCE: database/migrations/056_loot_tables.sql
# ============================================================

```sql
-- 056_loot_tables.sql
-- Requires: monsters, item_bases
CREATE TABLE loot_tables (
 loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 monster_id UUID NOT NULL,
 item_base_id UUID NOT NULL,
 drop_chance_percent NUMERIC(7,4) NOT NULL,
 min_item_level INTEGER NOT NULL,
 max_item_level INTEGER NOT NULL,
 loot_level_modifier INTEGER NOT NULL DEFAULT 0,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
 CONSTRAINT fk_loot_tables_item_base FOREIGN KEY (item_base_id) REFERENCES item_bases(item_base_id) ON DELETE RESTRICT,
 CONSTRAINT ux_loot_tables_monster_item UNIQUE (monster_id,item_base_id),
 CONSTRAINT chk_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
 CONSTRAINT chk_loot_tables_levels CHECK (min_item_level >= 1 AND max_item_level >= min_item_level)
);
CREATE INDEX ix_loot_tables_monster_id ON loot_tables(monster_id);
CREATE INDEX ix_loot_tables_item_base_id ON loot_tables(item_base_id);

```

# ============================================================
# SOURCE: database/migrations/057_other_loot_tables.sql
# ============================================================

```sql
-- 057_other_loot_tables.sql
-- Requires: monsters, materials, consumable_definitions
CREATE TABLE other_loot_tables (
 other_loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 monster_id UUID NOT NULL,
 material_id UUID NULL,
 consumable_definition_id UUID NULL,
 drop_chance_percent NUMERIC(7,4) NOT NULL,
 min_quantity INTEGER NOT NULL DEFAULT 1,
 max_quantity INTEGER NOT NULL DEFAULT 1,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_other_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
 CONSTRAINT fk_other_loot_tables_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_other_loot_tables_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_other_loot_tables_target CHECK ((material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
 CONSTRAINT chk_other_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
 CONSTRAINT chk_other_loot_tables_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity)
);
CREATE INDEX ix_other_loot_tables_monster_id ON other_loot_tables(monster_id);
CREATE INDEX ix_other_loot_tables_material_id ON other_loot_tables(material_id);
CREATE INDEX ix_other_loot_tables_consumable_id ON other_loot_tables(consumable_definition_id);

```

# ============================================================
# SOURCE: database/migrations/058_unique_pity_tracking.sql
# ============================================================

```sql
-- 058_unique_pity_tracking.sql
-- Requires: characters
CREATE TABLE unique_pity_tracking (
 unique_pity_tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 eligible_kill_count BIGINT NOT NULL DEFAULT 0,
 current_chance_percent NUMERIC(7,4) NOT NULL DEFAULT 0,
 last_unique_drop_at TIMESTAMPTZ NULL,
 last_set_drop_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_unique_pity_tracking_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_unique_pity_tracking_kills CHECK (eligible_kill_count >= 0),
 CONSTRAINT chk_unique_pity_tracking_chance CHECK (current_chance_percent >= 0 AND current_chance_percent <= 100)
);

```

# ============================================================
# SOURCE: database/migrations/060_set_progress.sql
# ============================================================

```sql
-- 060_set_progress.sql
-- Requires: accounts, set_templates
CREATE TABLE set_progress (
 set_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 set_template_id UUID NOT NULL,
 pieces_discovered INTEGER NOT NULL DEFAULT 0,
 total_pieces_required INTEGER NOT NULL,
 is_completed BOOLEAN NOT NULL DEFAULT FALSE,
 completed_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_set_progress_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_set_progress_template FOREIGN KEY (set_template_id) REFERENCES set_templates(set_template_id) ON DELETE RESTRICT,
 CONSTRAINT ux_set_progress_account_set UNIQUE (account_id,set_template_id),
 CONSTRAINT chk_set_progress_pieces CHECK (pieces_discovered >= 0 AND total_pieces_required >= 1 AND pieces_discovered <= total_pieces_required),
 CONSTRAINT chk_set_progress_completion CHECK ((is_completed=FALSE AND completed_at IS NULL) OR (is_completed=TRUE AND completed_at IS NOT NULL AND pieces_discovered=total_pieces_required))
);
CREATE INDEX ix_set_progress_account_id ON set_progress(account_id);
CREATE INDEX ix_set_progress_template_id ON set_progress(set_template_id);
CREATE INDEX ix_set_progress_is_completed ON set_progress(is_completed);

```

# ============================================================
# SOURCE: database/migrations/082_add_item_handedness.sql
# ============================================================

```sql
BEGIN;

ALTER TABLE item_bases
    ADD COLUMN handedness VARCHAR(10);

UPDATE item_bases
SET handedness = 'OneHanded'
WHERE slot = 'Weapon';

ALTER TABLE item_bases
    ADD CONSTRAINT chk_item_bases_handedness_value
        CHECK (
            handedness IS NULL
            OR handedness IN (
                'OneHanded',
                'TwoHanded'
            )
        ),

    ADD CONSTRAINT chk_item_bases_handedness_slot
        CHECK (
            (
                slot = 'Weapon'
                AND handedness IS NOT NULL
            )
            OR
            (
                slot <> 'Weapon'
                AND handedness IS NULL
            )
        );

COMMIT;

```

# ============================================================
# SOURCE: database/migrations/088_persistent_combat_api.sql
# ============================================================

```sql
-- =====================================================
-- 088_persistent_combat_api.sql
-- Requires: combat_sessions
-- =====================================================

BEGIN;

ALTER TABLE combat_sessions
    ADD COLUMN character_maximum_health BIGINT NOT NULL,
    ADD COLUMN character_attack BIGINT NOT NULL,
    ADD COLUMN character_defense BIGINT NOT NULL,
    ADD COLUMN monster_maximum_health BIGINT NOT NULL,
    ADD COLUMN monster_attack BIGINT NOT NULL,
    ADD COLUMN monster_defense BIGINT NOT NULL,
    ADD COLUMN defeat_reason VARCHAR(32);

ALTER TABLE combat_sessions
    DROP CONSTRAINT chk_combat_sessions_turn,
    DROP CONSTRAINT chk_combat_sessions_resources,
    DROP CONSTRAINT chk_combat_sessions_end_state;

ALTER TABLE combat_sessions
    ADD CONSTRAINT chk_combat_sessions_turn
    CHECK (
        current_turn BETWEEN 1 AND 100
    ),
    ADD CONSTRAINT chk_combat_sessions_statistics
    CHECK (
        character_maximum_health > 0
        AND character_attack >= 0
        AND character_defense >= 0
        AND monster_maximum_health > 0
        AND monster_attack >= 0
        AND monster_defense >= 0
    ),
    ADD CONSTRAINT chk_combat_sessions_resources
    CHECK (
        character_health BETWEEN 0 AND character_maximum_health
        AND character_mana >= 0
        AND monster_health BETWEEN 0 AND monster_maximum_health
    ),
    ADD CONSTRAINT chk_combat_sessions_defeat_reason
    CHECK (
        defeat_reason IS NULL
        OR defeat_reason IN (
            'PlayerHealthDepleted',
            'TurnLimitExceeded'
        )
    ),
    ADD CONSTRAINT chk_combat_sessions_end_state
    CHECK (
        (
            status = 'Active'
            AND ended_at IS NULL
            AND defeat_reason IS NULL
        )
        OR (
            status = 'Victory'
            AND ended_at IS NOT NULL
            AND ended_at >= started_at
            AND defeat_reason IS NULL
        )
        OR (
            status = 'Defeat'
            AND ended_at IS NOT NULL
            AND ended_at >= started_at
            AND defeat_reason IS NOT NULL
        )
        OR (
            status = 'Abandoned'
            AND ended_at IS NOT NULL
            AND ended_at >= started_at
            AND defeat_reason IS NULL
        )
    );

CREATE TABLE combat_session_events (
    combat_session_event_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    combat_session_id UUID NOT NULL,
    turn_number INTEGER NOT NULL,
    event_order INTEGER NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    event_data_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_combat_session_events_session
        FOREIGN KEY (combat_session_id)
        REFERENCES combat_sessions(combat_session_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_combat_session_events_turn
        CHECK (turn_number BETWEEN 1 AND 100),

    CONSTRAINT chk_combat_session_events_order
        CHECK (event_order >= 0),

    CONSTRAINT chk_combat_session_events_type
        CHECK (length(trim(event_type)) > 0),

    CONSTRAINT ux_combat_session_events_position
        UNIQUE (
            combat_session_id,
            turn_number,
            event_order
        )
);

CREATE INDEX ix_combat_session_events_ordered_log
    ON combat_session_events (
        combat_session_id,
        turn_number,
        event_order
    );

COMMIT;
```

# ============================================================
# SOURCE: database/migrations/089_victory_death_progression.sql
# ============================================================

```sql
-- =====================================================
-- 089_victory_death_progression.sql
-- Requires: persistent combat API
-- =====================================================

BEGIN;

ALTER TABLE monsters
    ADD COLUMN experience_reward BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_monsters_experience_reward
        CHECK (experience_reward >= 0);

ALTER TABLE combat_sessions
    ADD COLUMN settled_at TIMESTAMPTZ,
    ADD COLUMN monster_experience_reward BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN monster_gold_min BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN monster_gold_max BIGINT NOT NULL DEFAULT 0;

UPDATE combat_sessions
SET settled_at = ended_at
WHERE status IN ('Victory', 'Defeat');

ALTER TABLE combat_sessions
    DROP CONSTRAINT chk_combat_sessions_status,
    DROP CONSTRAINT chk_combat_sessions_end_state;

ALTER TABLE combat_sessions
    ADD CONSTRAINT chk_combat_sessions_status
        CHECK (status IN ('Active', 'Victory', 'Defeat')),
    ADD CONSTRAINT chk_combat_sessions_reward_snapshot
        CHECK (
            monster_experience_reward >= 0
            AND monster_gold_min >= 0
            AND monster_gold_max >= monster_gold_min
        ),
    ADD CONSTRAINT chk_combat_sessions_end_state
        CHECK (
            (
                status = 'Active'
                AND ended_at IS NULL
                AND settled_at IS NULL
                AND defeat_reason IS NULL
            )
            OR (
                status = 'Victory'
                AND ended_at IS NOT NULL
                AND settled_at IS NOT NULL
                AND ended_at >= started_at
                AND settled_at >= started_at
                AND defeat_reason IS NULL
            )
            OR (
                status = 'Defeat'
                AND ended_at IS NOT NULL
                AND settled_at IS NOT NULL
                AND ended_at >= started_at
                AND settled_at >= started_at
                AND defeat_reason IS NOT NULL
            )
        );

CREATE TABLE character_blessings (
    character_blessing_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_blessings_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_blessings_character
        UNIQUE (character_id)
);

ALTER TABLE character_statistics
    ADD COLUMN current_no_death_streak BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_character_statistics_current_no_death_streak
        CHECK (current_no_death_streak >= 0);

CREATE INDEX ix_combat_logs_character_recent
    ON combat_logs (
        character_id,
        created_at DESC,
        combat_log_id DESC
    );

COMMIT;

```

# ============================================================
# SOURCE: database/migrations/090_item_loot_generation.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/metadata/table-columns.csv
# ============================================================

```text
table_name,ordinal_position,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale
account_addons,1,account_addon_id,uuid,uuid,NO,gen_random_uuid(),,,
account_addons,2,account_id,uuid,uuid,NO,,,,
account_addons,3,addon_definition_id,uuid,uuid,NO,,,,
account_addons,4,unlocked_at,timestamp with time zone,timestamptz,NO,now(),,,
account_addons,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
account_friends,1,account_friend_id,uuid,uuid,NO,gen_random_uuid(),,,
account_friends,2,account_id,uuid,uuid,NO,,,,
account_friends,3,friend_account_id,uuid,uuid,NO,,,,
account_friends,4,created_at,timestamp with time zone,timestamptz,NO,now(),,,
account_outfits,1,account_outfit_id,uuid,uuid,NO,gen_random_uuid(),,,
account_outfits,2,account_id,uuid,uuid,NO,,,,
account_outfits,3,outfit_definition_id,uuid,uuid,NO,,,,
account_outfits,4,unlocked_at,timestamp with time zone,timestamptz,NO,now(),,,
account_outfits,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
account_sessions,1,account_session_id,uuid,uuid,NO,gen_random_uuid(),,,
account_sessions,2,account_id,uuid,uuid,NO,,,,
account_sessions,3,session_token_hash,text,text,NO,,,,
account_sessions,4,refresh_token_hash,text,text,YES,,,,
account_sessions,5,ip_address,inet,inet,YES,,,,
account_sessions,6,user_agent,text,text,YES,,,,
account_sessions,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
account_sessions,8,last_activity_at,timestamp with time zone,timestamptz,NO,now(),,,
account_sessions,9,expires_at,timestamp with time zone,timestamptz,NO,,,,
account_sessions,10,is_revoked,boolean,bool,NO,false,,,
account_sessions,11,revoked_at,timestamp with time zone,timestamptz,YES,,,,
accounts,1,account_id,uuid,uuid,NO,gen_random_uuid(),,,
accounts,2,username,character varying,varchar,NO,,32,,
accounts,3,email,character varying,varchar,YES,,255,,
accounts,4,password_hash,text,text,NO,,,,
accounts,5,status,character varying,varchar,NO,'Active'::character varying,20,,
accounts,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
accounts,7,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
accounts,8,last_login_at,timestamp with time zone,timestamptz,YES,,,,
achievement_progress,1,achievement_progress_id,uuid,uuid,NO,gen_random_uuid(),,,
achievement_progress,2,account_id,uuid,uuid,NO,,,,
achievement_progress,3,achievement_id,uuid,uuid,NO,,,,
achievement_progress,4,current_value,bigint,int8,NO,0,,64,0
achievement_progress,5,is_completed,boolean,bool,NO,false,,,
achievement_progress,6,completed_at,timestamp with time zone,timestamptz,YES,,,,
achievement_progress,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
achievement_progress,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
achievements,1,achievement_id,uuid,uuid,NO,gen_random_uuid(),,,
achievements,2,code,character varying,varchar,NO,,64,,
achievements,3,name,character varying,varchar,NO,,100,,
achievements,4,description,text,text,NO,,,,
achievements,5,category,character varying,varchar,NO,,32,,
achievements,6,points,integer,int4,NO,0,,32,0
achievements,7,objective_type,character varying,varchar,NO,,64,,
achievements,8,required_value,bigint,int8,NO,,,64,0
achievements,9,is_hidden,boolean,bool,NO,false,,,
achievements,10,reward_attack,integer,int4,NO,0,,32,0
achievements,11,reward_defense,integer,int4,NO,0,,32,0
achievements,12,reward_gold_percent,numeric,numeric,NO,0,,8,4
achievements,13,reward_experience_percent,numeric,numeric,NO,0,,8,4
achievements,14,created_at,timestamp with time zone,timestamptz,NO,now(),,,
achievements,15,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
addon_definitions,1,addon_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
addon_definitions,2,outfit_definition_id,uuid,uuid,NO,,,,
addon_definitions,3,name,character varying,varchar,NO,,100,,
addon_definitions,4,description,text,text,NO,,,,
addon_definitions,5,artwork,text,text,YES,,,,
addon_definitions,6,display_order,integer,int4,NO,0,,32,0
addon_definitions,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
addon_definitions,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
admin_actions,1,admin_action_id,uuid,uuid,NO,gen_random_uuid(),,,
admin_actions,2,admin_user,character varying,varchar,NO,,100,,
admin_actions,3,action_type,character varying,varchar,NO,,64,,
admin_actions,4,account_id,uuid,uuid,YES,,,,
admin_actions,5,target_entity_type,character varying,varchar,YES,,64,,
admin_actions,6,target_entity_id,uuid,uuid,YES,,,,
admin_actions,7,reason,text,text,YES,,,,
admin_actions,8,action_data,jsonb,jsonb,YES,,,,
admin_actions,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
affix_templates,1,affix_template_id,uuid,uuid,NO,gen_random_uuid(),,,
affix_templates,2,affix_type,character varying,varchar,NO,,32,,
affix_templates,3,tier,integer,int4,NO,,,32,0
affix_templates,4,required_item_level,integer,int4,NO,1,,32,0
affix_templates,5,min_value,numeric,numeric,NO,,,12,4
affix_templates,6,max_value,numeric,numeric,NO,,,12,4
affix_templates,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
affix_templates,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
announcements,1,announcement_id,uuid,uuid,NO,gen_random_uuid(),,,
announcements,2,title,character varying,varchar,NO,,200,,
announcements,3,content,text,text,NO,,,,
announcements,4,priority,character varying,varchar,NO,'Normal'::character varying,20,,
announcements,5,is_active,boolean,bool,NO,true,,,
announcements,6,published_at,timestamp with time zone,timestamptz,YES,,,,
announcements,7,expires_at,timestamp with time zone,timestamptz,YES,,,,
announcements,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
announcements,9,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
auction_history,1,auction_history_id,uuid,uuid,NO,gen_random_uuid(),,,
auction_history,2,auction_listing_id,uuid,uuid,NO,,,,
auction_history,3,seller_character_id,uuid,uuid,NO,,,,
auction_history,4,buyer_character_id,uuid,uuid,NO,,,,
auction_history,5,item_id,uuid,uuid,YES,,,,
auction_history,6,material_id,uuid,uuid,YES,,,,
auction_history,7,consumable_definition_id,uuid,uuid,YES,,,,
auction_history,8,quantity,bigint,int8,NO,,,64,0
auction_history,9,unit_price,bigint,int8,NO,,,64,0
auction_history,10,total_price,bigint,int8,NO,,,64,0
auction_history,11,sold_at,timestamp with time zone,timestamptz,NO,now(),,,
auction_history,12,created_at,timestamp with time zone,timestamptz,NO,now(),,,
auction_listings,1,auction_listing_id,uuid,uuid,NO,gen_random_uuid(),,,
auction_listings,2,character_id,uuid,uuid,NO,,,,
auction_listings,3,item_id,uuid,uuid,YES,,,,
auction_listings,4,material_id,uuid,uuid,YES,,,,
auction_listings,5,consumable_definition_id,uuid,uuid,YES,,,,
auction_listings,6,quantity,bigint,int8,NO,,,64,0
auction_listings,7,unit_price,bigint,int8,NO,,,64,0
auction_listings,8,listing_fee_paid,bigint,int8,NO,0,,64,0
auction_listings,9,status,character varying,varchar,NO,'Active'::character varying,20,,
auction_listings,10,expires_at,timestamp with time zone,timestamptz,NO,,,,
auction_listings,11,created_at,timestamp with time zone,timestamptz,NO,now(),,,
auction_listings,12,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
bestiary_entries,1,bestiary_entry_id,uuid,uuid,NO,gen_random_uuid(),,,
bestiary_entries,2,character_id,uuid,uuid,NO,,,,
bestiary_entries,3,monster_id,uuid,uuid,NO,,,,
bestiary_entries,4,unlocked_at,timestamp with time zone,timestamptz,NO,now(),,,
bestiary_entries,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
bestiary_statistics,1,bestiary_statistics_id,uuid,uuid,NO,gen_random_uuid(),,,
bestiary_statistics,2,character_id,uuid,uuid,NO,,,,
bestiary_statistics,3,monster_id,uuid,uuid,NO,,,,
bestiary_statistics,4,kill_count,bigint,int8,NO,1,,64,0
bestiary_statistics,5,first_kill_at,timestamp with time zone,timestamptz,NO,now(),,,
bestiary_statistics,6,last_kill_at,timestamp with time zone,timestamptz,NO,now(),,,
bestiary_statistics,7,task_progress,bigint,int8,NO,0,,64,0
bestiary_statistics,8,task_unlocked,boolean,bool,NO,false,,,
bestiary_statistics,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
bestiary_statistics,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
bosses,1,boss_id,uuid,uuid,NO,gen_random_uuid(),,,
bosses,2,monster_id,uuid,uuid,NO,,,,
bosses,3,boss_type,character varying,varchar,NO,,20,,
bosses,4,loot_level_bonus,integer,int4,NO,0,,32,0
bosses,5,unique_modifier,numeric,numeric,NO,1.0000,,8,4
bosses,6,additional_cooldown_seconds,integer,int4,NO,0,,32,0
bosses,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
bosses,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_buffs,1,character_buff_id,uuid,uuid,NO,gen_random_uuid(),,,
character_buffs,2,character_id,uuid,uuid,NO,,,,
character_buffs,3,buff_type,character varying,varchar,NO,,32,,
character_buffs,4,buff_source_type,character varying,varchar,NO,,20,,
character_buffs,5,consumable_definition_id,uuid,uuid,YES,,,,
character_buffs,6,spell_id,uuid,uuid,YES,,,,
character_buffs,7,value,numeric,numeric,NO,,,12,4
character_buffs,8,duration_type,character varying,varchar,NO,,20,,
character_buffs,9,duration_remaining,integer,int4,YES,,,32,0
character_buffs,10,is_positive,boolean,bool,NO,,,,
character_buffs,11,applied_at,timestamp with time zone,timestamptz,NO,now(),,,
character_buffs,12,expires_at,timestamp with time zone,timestamptz,YES,,,,
character_buffs,13,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_buffs,14,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_cooldowns,1,character_cooldown_id,uuid,uuid,NO,gen_random_uuid(),,,
character_cooldowns,2,character_id,uuid,uuid,NO,,,,
character_cooldowns,3,cooldown_type,character varying,varchar,NO,,32,,
character_cooldowns,4,target_id,uuid,uuid,YES,,,,
character_cooldowns,5,available_at,timestamp with time zone,timestamptz,NO,,,,
character_cooldowns,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_cooldowns,7,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_daily_boss_progress,1,character_daily_boss_progress_id,uuid,uuid,NO,gen_random_uuid(),,,
character_daily_boss_progress,2,character_id,uuid,uuid,NO,,,,
character_daily_boss_progress,3,daily_boss_definition_id,uuid,uuid,NO,,,,
character_daily_boss_progress,4,attempts_date,date,date,NO,CURRENT_DATE,,,
character_daily_boss_progress,5,attempts_used_today,integer,int4,NO,0,,32,0
character_daily_boss_progress,6,total_attempts,bigint,int8,NO,0,,64,0
character_daily_boss_progress,7,total_victories,bigint,int8,NO,0,,64,0
character_daily_boss_progress,8,last_attempt_at,timestamp with time zone,timestamptz,YES,,,,
character_daily_boss_progress,9,last_victory_at,timestamp with time zone,timestamptz,YES,,,,
character_daily_boss_progress,10,highest_tier_defeated,integer,int4,YES,,,32,0
character_daily_boss_progress,11,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_daily_boss_progress,12,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_loadouts,1,character_loadout_id,uuid,uuid,NO,gen_random_uuid(),,,
character_loadouts,2,character_id,uuid,uuid,NO,,,,
character_loadouts,3,name,character varying,varchar,NO,,50,,
character_loadouts,4,spell_1_id,uuid,uuid,YES,,,,
character_loadouts,5,spell_2_id,uuid,uuid,YES,,,,
character_loadouts,6,spell_3_id,uuid,uuid,YES,,,,
character_loadouts,7,is_default,boolean,bool,NO,false,,,
character_loadouts,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_loadouts,9,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_spell_mastery,1,character_spell_mastery_id,uuid,uuid,NO,gen_random_uuid(),,,
character_spell_mastery,2,character_id,uuid,uuid,NO,,,,
character_spell_mastery,3,mastery_level,integer,int4,NO,1,,32,0
character_spell_mastery,4,mastery_experience,bigint,int8,NO,0,,64,0
character_spell_mastery,5,current_spell_power,numeric,numeric,NO,100.0000,,8,4
character_spell_mastery,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_spell_mastery,7,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_spells,1,character_spell_id,uuid,uuid,NO,gen_random_uuid(),,,
character_spells,2,character_id,uuid,uuid,NO,,,,
character_spells,3,spell_id,uuid,uuid,NO,,,,
character_spells,4,unlocked_at,timestamp with time zone,timestamptz,NO,now(),,,
character_statistics,1,character_statistics_id,uuid,uuid,NO,gen_random_uuid(),,,
character_statistics,2,character_id,uuid,uuid,NO,,,,
character_statistics,3,total_playtime_seconds,bigint,int8,NO,0,,64,0
character_statistics,4,total_gold_earned,bigint,int8,NO,0,,64,0
character_statistics,5,total_gold_spent,bigint,int8,NO,0,,64,0
character_statistics,6,highest_gold_owned,bigint,int8,NO,0,,64,0
character_statistics,7,total_monsters_killed,bigint,int8,NO,0,,64,0
character_statistics,8,total_bosses_killed,bigint,int8,NO,0,,64,0
character_statistics,9,total_daily_bosses_killed,bigint,int8,NO,0,,64,0
character_statistics,10,total_deaths,bigint,int8,NO,0,,64,0
character_statistics,11,total_damage_dealt,bigint,int8,NO,0,,64,0
character_statistics,12,total_damage_taken,bigint,int8,NO,0,,64,0
character_statistics,13,total_healing_done,bigint,int8,NO,0,,64,0
character_statistics,14,total_mana_spent,bigint,int8,NO,0,,64,0
character_statistics,15,highest_physical_hit,bigint,int8,NO,0,,64,0
character_statistics,16,highest_spell_hit,bigint,int8,NO,0,,64,0
character_statistics,17,strongest_monster_killed_id,uuid,uuid,YES,,,,
character_statistics,18,strongest_boss_killed_id,uuid,uuid,YES,,,,
character_statistics,19,longest_no_death_streak,bigint,int8,NO,0,,64,0
character_statistics,20,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_statistics,21,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
character_unlocks,1,character_unlocks_id,uuid,uuid,NO,gen_random_uuid(),,,
character_unlocks,2,character_id,uuid,uuid,NO,,,,
character_unlocks,3,is_promoted,boolean,bool,NO,false,,,
character_unlocks,4,spell_slots_unlocked,integer,int4,NO,1,,32,0
character_unlocks,5,crafting_slots_unlocked,integer,int4,NO,1,,32,0
character_unlocks,6,inventory_slots,integer,int4,NO,50,,32,0
character_unlocks,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
character_unlocks,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
characters,1,character_id,uuid,uuid,NO,gen_random_uuid(),,,
characters,2,account_id,uuid,uuid,NO,,,,
characters,3,season_id,uuid,uuid,YES,,,,
characters,4,name,character varying,varchar,NO,,32,,
characters,5,level,integer,int4,NO,1,,32,0
characters,6,experience,bigint,int8,NO,0,,64,0
characters,7,gold,bigint,int8,NO,0,,64,0
characters,8,current_health,bigint,int8,NO,180,,64,0
characters,9,current_mana,bigint,int8,NO,35,,64,0
characters,10,current_energy,bigint,int8,NO,100,,64,0
characters,11,max_health,bigint,int8,NO,180,,64,0
characters,12,max_mana,bigint,int8,NO,35,,64,0
characters,13,max_energy,bigint,int8,NO,100,,64,0
characters,14,crafting_level,integer,int4,NO,1,,32,0
characters,15,crafting_xp,bigint,int8,NO,0,,64,0
characters,16,gathering_level,integer,int4,NO,1,,32,0
characters,17,gathering_xp,bigint,int8,NO,0,,64,0
characters,18,status,character varying,varchar,NO,'IsActive'::character varying,20,,
characters,19,created_at,timestamp with time zone,timestamptz,NO,now(),,,
characters,20,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
characters,21,last_active_at,timestamp with time zone,timestamptz,YES,,,,
chest_definitions,1,chest_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
chest_definitions,2,name,character varying,varchar,NO,,32,,
chest_definitions,3,cooldown_seconds,integer,int4,NO,,,32,0
chest_definitions,4,is_enabled,boolean,bool,NO,true,,,
chest_definitions,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
chest_definitions,6,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
chest_reward_definitions,1,chest_reward_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
chest_reward_definitions,2,chest_definition_id,uuid,uuid,NO,,,,
chest_reward_definitions,3,reward_type,character varying,varchar,NO,,32,,
chest_reward_definitions,4,min_quantity,integer,int4,NO,1,,32,0
chest_reward_definitions,5,max_quantity,integer,int4,NO,1,,32,0
chest_reward_definitions,6,chance_percent,numeric,numeric,NO,,,7,4
chest_reward_definitions,7,minimum_character_level,integer,int4,NO,1,,32,0
chest_reward_definitions,8,maximum_character_level,integer,int4,YES,,,32,0
chest_reward_definitions,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
chest_reward_definitions,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_effects,1,combat_effect_id,uuid,uuid,NO,gen_random_uuid(),,,
combat_effects,2,combat_session_id,uuid,uuid,NO,,,,
combat_effects,3,effect_type,character varying,varchar,NO,,32,,
combat_effects,4,target_type,character varying,varchar,NO,,20,,
combat_effects,5,source_type,character varying,varchar,NO,,20,,
combat_effects,6,spell_id,uuid,uuid,YES,,,,
combat_effects,7,consumable_definition_id,uuid,uuid,YES,,,,
combat_effects,8,value,numeric,numeric,NO,,,12,4
combat_effects,9,remaining_turns,integer,int4,NO,,,32,0
combat_effects,10,applied_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_effects,11,created_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_logs,1,combat_log_id,uuid,uuid,NO,gen_random_uuid(),,,
combat_logs,2,combat_session_id,uuid,uuid,NO,,,,
combat_logs,3,character_id,uuid,uuid,NO,,,,
combat_logs,4,monster_id,uuid,uuid,NO,,,,
combat_logs,5,combat_result,character varying,varchar,NO,,20,,
combat_logs,6,turn_count,integer,int4,NO,,,32,0
combat_logs,7,started_at,timestamp with time zone,timestamptz,NO,,,,
combat_logs,8,ended_at,timestamp with time zone,timestamptz,NO,,,,
combat_logs,9,combat_data_json,jsonb,jsonb,NO,,,,
combat_logs,10,created_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_sessions,1,combat_session_id,uuid,uuid,NO,gen_random_uuid(),,,
combat_sessions,2,character_id,uuid,uuid,NO,,,,
combat_sessions,3,monster_id,uuid,uuid,NO,,,,
combat_sessions,4,status,character varying,varchar,NO,'Active'::character varying,20,,
combat_sessions,5,current_turn,integer,int4,NO,1,,32,0
combat_sessions,6,character_health,bigint,int8,NO,,,64,0
combat_sessions,7,character_mana,bigint,int8,NO,,,64,0
combat_sessions,8,monster_health,bigint,int8,NO,,,64,0
combat_sessions,9,started_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_sessions,10,ended_at,timestamp with time zone,timestamptz,YES,,,,
combat_sessions,11,created_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_sessions,12,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
combat_spell_cooldowns,1,combat_spell_cooldown_id,uuid,uuid,NO,gen_random_uuid(),,,
combat_spell_cooldowns,2,combat_session_id,uuid,uuid,NO,,,,
combat_spell_cooldowns,3,spell_id,uuid,uuid,NO,,,,
combat_spell_cooldowns,4,remaining_turns,integer,int4,NO,,,32,0
combat_spell_cooldowns,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
consumable_definitions,1,consumable_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
consumable_definitions,2,name,character varying,varchar,NO,,100,,
consumable_definitions,3,description,text,text,NO,,,,
consumable_definitions,4,artwork,text,text,YES,,,,
consumable_definitions,5,category,character varying,varchar,NO,,32,,
consumable_definitions,6,tier,character varying,varchar,NO,'None'::character varying,20,,
consumable_definitions,7,effect_type,character varying,varchar,NO,,32,,
consumable_definitions,8,effect_value,numeric,numeric,NO,0,,12,4
consumable_definitions,9,duration_type,character varying,varchar,NO,,20,,
consumable_definitions,10,duration_value,integer,int4,YES,,,32,0
consumable_definitions,11,potion_cooldown_turns,integer,int4,NO,0,,32,0
consumable_definitions,12,max_stack_size,integer,int4,NO,999,,32,0
consumable_definitions,13,is_tradable,boolean,bool,NO,true,,,
consumable_definitions,14,created_at,timestamp with time zone,timestamptz,NO,now(),,,
consumable_definitions,15,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
consumable_definitions,16,code,character varying,varchar,NO,,64,,
consumable_storage,1,consumable_storage_id,uuid,uuid,NO,gen_random_uuid(),,,
consumable_storage,2,character_id,uuid,uuid,NO,,,,
consumable_storage,3,consumable_definition_id,uuid,uuid,NO,,,,
consumable_storage,4,quantity,bigint,int8,NO,0,,64,0
consumable_storage,5,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
crafting_history,1,crafting_history_id,uuid,uuid,NO,gen_random_uuid(),,,
crafting_history,2,character_id,uuid,uuid,NO,,,,
crafting_history,3,recipe_id,uuid,uuid,NO,,,,
crafting_history,4,quantity_crafted,integer,int4,NO,,,32,0
crafting_history,5,crafting_xp_earned,bigint,int8,NO,0,,64,0
crafting_history,6,completed_at,timestamp with time zone,timestamptz,NO,,,,
crafting_history,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
crafting_queue,1,crafting_queue_id,uuid,uuid,NO,gen_random_uuid(),,,
crafting_queue,2,character_id,uuid,uuid,NO,,,,
crafting_queue,3,recipe_id,uuid,uuid,NO,,,,
crafting_queue,4,quantity,integer,int4,NO,,,32,0
crafting_queue,5,status,character varying,varchar,NO,'Pending'::character varying,20,,
crafting_queue,6,started_at,timestamp with time zone,timestamptz,YES,,,,
crafting_queue,7,completes_at,timestamp with time zone,timestamptz,NO,,,,
crafting_queue,8,crafting_slot,integer,int4,NO,,,32,0
crafting_queue,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
daily_boss_definitions,1,daily_boss_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
daily_boss_definitions,2,boss_id,uuid,uuid,NO,,,,
daily_boss_definitions,3,tier,integer,int4,NO,,,32,0
daily_boss_definitions,4,recommended_level,integer,int4,NO,,,32,0
daily_boss_definitions,5,attempts_per_day,integer,int4,NO,1,,32,0
daily_boss_definitions,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
daily_boss_definitions,7,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
daily_boss_pools,1,daily_boss_pool_id,uuid,uuid,NO,gen_random_uuid(),,,
daily_boss_pools,2,daily_boss_definition_id,uuid,uuid,NO,,,,
daily_boss_pools,3,tier,integer,int4,NO,,,32,0
daily_boss_pools,4,is_active,boolean,bool,NO,true,,,
daily_boss_pools,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
daily_boss_rotation,1,daily_boss_rotation_id,uuid,uuid,NO,gen_random_uuid(),,,
daily_boss_rotation,2,tier_1_boss_id,uuid,uuid,NO,,,,
daily_boss_rotation,3,tier_2_boss_id,uuid,uuid,NO,,,,
daily_boss_rotation,4,tier_3_boss_id,uuid,uuid,NO,,,,
daily_boss_rotation,5,reset_timestamp,timestamp with time zone,timestamptz,NO,,,,
daily_boss_rotation,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
daily_chest_progress,1,daily_chest_progress_id,uuid,uuid,NO,gen_random_uuid(),,,
daily_chest_progress,2,character_id,uuid,uuid,NO,,,,
daily_chest_progress,3,next_available_at,timestamp with time zone,timestamptz,NO,,,,
daily_chest_progress,4,is_available,boolean,bool,NO,false,,,
daily_chest_progress,5,last_claimed_at,timestamp with time zone,timestamptz,YES,,,,
daily_chest_progress,6,total_claims,bigint,int8,NO,0,,64,0
daily_chest_progress,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
daily_chest_progress,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
equipment_loadouts,1,equipment_loadout_id,uuid,uuid,NO,gen_random_uuid(),,,
equipment_loadouts,2,character_id,uuid,uuid,NO,,,,
equipment_loadouts,3,name,character varying,varchar,NO,,50,,
equipment_loadouts,4,weapon_item_id,uuid,uuid,YES,,,,
equipment_loadouts,5,helmet_item_id,uuid,uuid,YES,,,,
equipment_loadouts,6,armor_item_id,uuid,uuid,YES,,,,
equipment_loadouts,7,shield_item_id,uuid,uuid,YES,,,,
equipment_loadouts,8,legs_item_id,uuid,uuid,YES,,,,
equipment_loadouts,9,boots_item_id,uuid,uuid,YES,,,,
equipment_loadouts,10,ring_item_id,uuid,uuid,YES,,,,
equipment_loadouts,11,amulet_item_id,uuid,uuid,YES,,,,
equipment_loadouts,12,is_default,boolean,bool,NO,false,,,
equipment_loadouts,13,created_at,timestamp with time zone,timestamptz,NO,now(),,,
equipment_loadouts,14,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
friend_requests,1,friend_request_id,uuid,uuid,NO,gen_random_uuid(),,,
friend_requests,2,sender_account_id,uuid,uuid,NO,,,,
friend_requests,3,recipient_account_id,uuid,uuid,NO,,,,
friend_requests,4,status,character varying,varchar,NO,'Pending'::character varying,20,,
friend_requests,5,sent_at,timestamp with time zone,timestamptz,NO,now(),,,
friend_requests,6,responded_at,timestamp with time zone,timestamptz,YES,,,,
friend_requests,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
gathering_results,1,gathering_result_id,uuid,uuid,NO,gen_random_uuid(),,,
gathering_results,2,gathering_session_id,uuid,uuid,NO,,,,
gathering_results,3,material_id,uuid,uuid,NO,,,,
gathering_results,4,quantity,bigint,int8,NO,,,64,0
gathering_results,5,successful_rolls,integer,int4,NO,,,32,0
gathering_results,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
gathering_sessions,1,gathering_session_id,uuid,uuid,NO,gen_random_uuid(),,,
gathering_sessions,2,character_id,uuid,uuid,NO,,,,
gathering_sessions,3,started_at,timestamp with time zone,timestamptz,NO,now(),,,
gathering_sessions,4,ended_at,timestamp with time zone,timestamptz,YES,,,,
gathering_sessions,5,status,character varying,varchar,NO,'Active'::character varying,20,,
gathering_sessions,6,gathering_level_at_start,integer,int4,NO,,,32,0
gathering_sessions,7,total_minutes_gathered,integer,int4,NO,0,,32,0
gathering_sessions,8,experience_earned,bigint,int8,NO,0,,64,0
gathering_sessions,9,results_collected,boolean,bool,NO,false,,,
gathering_sessions,10,created_at,timestamp with time zone,timestamptz,NO,now(),,,
gathering_sessions,11,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
hall_of_fame,1,hall_of_fame_id,uuid,uuid,NO,gen_random_uuid(),,,
hall_of_fame,2,season_id,uuid,uuid,NO,,,,
hall_of_fame,3,character_id,uuid,uuid,YES,,,,
hall_of_fame,4,character_name,character varying,varchar,NO,,32,,
hall_of_fame,5,rank_position,integer,int4,NO,,,32,0
hall_of_fame,6,final_level,integer,int4,NO,,,32,0
hall_of_fame,7,final_experience,bigint,int8,NO,,,64,0
hall_of_fame,8,achievement_score,bigint,int8,NO,0,,64,0
hall_of_fame,9,holy_grail_percent,numeric,numeric,NO,0,,7,4
hall_of_fame,10,total_playtime_seconds,bigint,int8,NO,0,,64,0
hall_of_fame,11,total_deaths,bigint,int8,NO,0,,64,0
hall_of_fame,12,recorded_at,timestamp with time zone,timestamptz,NO,now(),,,
hall_of_fame,13,created_at,timestamp with time zone,timestamptz,NO,now(),,,
holy_grail_entries,1,holy_grail_entry_id,uuid,uuid,NO,gen_random_uuid(),,,
holy_grail_entries,2,account_id,uuid,uuid,NO,,,,
holy_grail_entries,3,unique_template_id,uuid,uuid,YES,,,,
holy_grail_entries,4,set_template_id,uuid,uuid,YES,,,,
holy_grail_entries,5,found_by_character_id,uuid,uuid,YES,,,,
holy_grail_entries,6,found_season_id,uuid,uuid,YES,,,,
holy_grail_entries,7,first_found_at,timestamp with time zone,timestamptz,NO,now(),,,
holy_grail_entries,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
hourly_chest_progress,1,hourly_chest_progress_id,uuid,uuid,NO,gen_random_uuid(),,,
hourly_chest_progress,2,character_id,uuid,uuid,NO,,,,
hourly_chest_progress,3,next_available_at,timestamp with time zone,timestamptz,NO,,,,
hourly_chest_progress,4,is_available,boolean,bool,NO,false,,,
hourly_chest_progress,5,last_claimed_at,timestamp with time zone,timestamptz,YES,,,,
hourly_chest_progress,6,total_claims,bigint,int8,NO,0,,64,0
hourly_chest_progress,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
hourly_chest_progress,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
inventory_items,1,inventory_item_id,uuid,uuid,NO,gen_random_uuid(),,,
inventory_items,2,character_id,uuid,uuid,NO,,,,
inventory_items,3,item_id,uuid,uuid,NO,,,,
inventory_items,4,position,integer,int4,NO,,,32,0
inventory_items,5,is_equipped,boolean,bool,NO,false,,,
inventory_items,6,acquired_at,timestamp with time zone,timestamptz,NO,now(),,,
item_affixes,1,item_affix_id,uuid,uuid,NO,gen_random_uuid(),,,
item_affixes,2,item_id,uuid,uuid,NO,,,,
item_affixes,3,affix_template_id,uuid,uuid,NO,,,,
item_affixes,4,roll_value,numeric,numeric,NO,,,12,4
item_affixes,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
item_bases,1,item_base_id,uuid,uuid,NO,gen_random_uuid(),,,
item_bases,2,unique_template_id,uuid,uuid,YES,,,,
item_bases,3,set_template_id,uuid,uuid,YES,,,,
item_bases,4,name,character varying,varchar,NO,,100,,
item_bases,5,description,text,text,NO,,,,
item_bases,6,artwork,text,text,YES,,,,
item_bases,7,item_level,integer,int4,NO,,,32,0
item_bases,8,required_level,integer,int4,NO,1,,32,0
item_bases,9,slot,character varying,varchar,NO,,20,,
item_bases,10,weapon_type,character varying,varchar,YES,,32,,
item_bases,11,attack,numeric,numeric,NO,0,,12,4
item_bases,12,defense,numeric,numeric,NO,0,,12,4
item_bases,13,spell_power,numeric,numeric,NO,0,,12,4
item_bases,14,health,numeric,numeric,NO,0,,12,4
item_bases,15,mana,numeric,numeric,NO,0,,12,4
item_bases,16,energy,numeric,numeric,NO,0,,12,4
item_bases,17,gold_percent,numeric,numeric,NO,0,,8,4
item_bases,18,experience_percent,numeric,numeric,NO,0,,8,4
item_bases,19,base_item_score,bigint,int8,NO,0,,64,0
item_bases,20,is_boss_exclusive,boolean,bool,NO,false,,,
item_bases,21,is_unique,boolean,bool,NO,false,,,
item_bases,22,is_set,boolean,bool,NO,false,,,
item_bases,23,created_at,timestamp with time zone,timestamptz,NO,now(),,,
item_bases,24,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
item_bases,25,code,character varying,varchar,NO,,64,,
items,1,item_id,uuid,uuid,NO,gen_random_uuid(),,,
items,2,item_base_id,uuid,uuid,NO,,,,
items,3,item_level,integer,int4,NO,,,32,0
items,4,rarity,character varying,varchar,NO,,20,,
items,5,item_score,bigint,int8,NO,0,,64,0
items,6,is_locked,boolean,bool,NO,false,,,
items,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
login_streak_progress,1,login_streak_progress_id,uuid,uuid,NO,gen_random_uuid(),,,
login_streak_progress,2,character_id,uuid,uuid,NO,,,,
login_streak_progress,3,current_streak,integer,int4,NO,0,,32,0
login_streak_progress,4,highest_streak,integer,int4,NO,0,,32,0
login_streak_progress,5,last_login_date,date,date,YES,,,,
login_streak_progress,6,last_reward_day,integer,int4,NO,0,,32,0
login_streak_progress,7,completed_cycles,bigint,int8,NO,0,,64,0
login_streak_progress,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
login_streak_progress,9,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
loot_tables,1,loot_table_id,uuid,uuid,NO,gen_random_uuid(),,,
loot_tables,2,monster_id,uuid,uuid,NO,,,,
loot_tables,3,item_base_id,uuid,uuid,NO,,,,
loot_tables,4,drop_chance_percent,numeric,numeric,NO,,,7,4
loot_tables,5,min_item_level,integer,int4,NO,,,32,0
loot_tables,6,max_item_level,integer,int4,NO,,,32,0
loot_tables,7,loot_level_modifier,integer,int4,NO,0,,32,0
loot_tables,8,is_enabled,boolean,bool,NO,true,,,
loot_tables,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
loot_tables,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
mail_attachments,1,mail_attachment_id,uuid,uuid,NO,gen_random_uuid(),,,
mail_attachments,2,mail_message_id,uuid,uuid,NO,,,,
mail_attachments,3,attachment_type,character varying,varchar,NO,,20,,
mail_attachments,4,gold_amount,bigint,int8,YES,,,64,0
mail_attachments,5,item_id,uuid,uuid,YES,,,,
mail_attachments,6,material_id,uuid,uuid,YES,,,,
mail_attachments,7,material_quantity,bigint,int8,YES,,,64,0
mail_attachments,8,consumable_definition_id,uuid,uuid,YES,,,,
mail_attachments,9,consumable_quantity,bigint,int8,YES,,,64,0
mail_attachments,10,is_collected,boolean,bool,NO,false,,,
mail_attachments,11,collected_at,timestamp with time zone,timestamptz,YES,,,,
mail_attachments,12,created_at,timestamp with time zone,timestamptz,NO,now(),,,
mail_messages,1,mail_message_id,uuid,uuid,NO,gen_random_uuid(),,,
mail_messages,2,character_id,uuid,uuid,NO,,,,
mail_messages,3,subject,character varying,varchar,NO,,200,,
mail_messages,4,body,text,text,NO,,,,
mail_messages,5,message_type,character varying,varchar,NO,,32,,
mail_messages,6,is_read,boolean,bool,NO,false,,,
mail_messages,7,expires_at,timestamp with time zone,timestamptz,YES,,,,
mail_messages,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
mail_messages,9,read_at,timestamp with time zone,timestamptz,YES,,,,
mail_templates,1,mail_template_id,uuid,uuid,NO,gen_random_uuid(),,,
mail_templates,2,code,character varying,varchar,NO,,64,,
mail_templates,3,subject_template,text,text,NO,,,,
mail_templates,4,body_template,text,text,NO,,,,
mail_templates,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
mail_templates,6,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
material_storage,1,material_storage_id,uuid,uuid,NO,gen_random_uuid(),,,
material_storage,2,character_id,uuid,uuid,NO,,,,
material_storage,3,material_id,uuid,uuid,NO,,,,
material_storage,4,quantity,bigint,int8,NO,0,,64,0
material_storage,5,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
materials,1,material_id,uuid,uuid,NO,gen_random_uuid(),,,
materials,2,name,character varying,varchar,NO,,100,,
materials,3,description,text,text,NO,,,,
materials,4,artwork,text,text,YES,,,,
materials,5,material_level,integer,int4,NO,1,,32,0
materials,6,vendor_available,boolean,bool,NO,false,,,
materials,7,vendor_price,bigint,int8,YES,,,64,0
materials,8,is_gatherable,boolean,bool,NO,false,,,
materials,9,is_lootable,boolean,bool,NO,false,,,
materials,10,is_crafting_ingredient,boolean,bool,NO,true,,,
materials,11,required_gathering_level,integer,int4,NO,1,,32,0
materials,12,minimum_monster_level,integer,int4,YES,,,32,0
materials,13,max_stack_size,integer,int4,NO,999,,32,0
materials,14,created_at,timestamp with time zone,timestamptz,NO,now(),,,
materials,15,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
materials,16,code,character varying,varchar,NO,,64,,
monster_abilities,1,monster_ability_id,uuid,uuid,NO,gen_random_uuid(),,,
monster_abilities,2,monster_id,uuid,uuid,NO,,,,
monster_abilities,3,spell_id,uuid,uuid,NO,,,,
monster_abilities,4,is_enabled,boolean,bool,NO,true,,,
monster_abilities,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
monster_ability_weights,1,monster_ability_weight_id,uuid,uuid,NO,gen_random_uuid(),,,
monster_ability_weights,2,monster_ability_id,uuid,uuid,NO,,,,
monster_ability_weights,3,weight,numeric,numeric,NO,,,12,4
monster_ability_weights,4,created_at,timestamp with time zone,timestamptz,NO,now(),,,
monster_families,1,monster_family_id,uuid,uuid,NO,gen_random_uuid(),,,
monster_families,2,name,character varying,varchar,NO,,100,,
monster_families,3,description,text,text,NO,,,,
monster_families,4,created_at,timestamp with time zone,timestamptz,NO,now(),,,
monster_families,5,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
monster_families,6,code,character varying,varchar,NO,,64,,
monster_tasks,1,monster_task_id,uuid,uuid,NO,gen_random_uuid(),,,
monster_tasks,2,monster_id,uuid,uuid,NO,,,,
monster_tasks,3,boss_id,uuid,uuid,NO,,,,
monster_tasks,4,required_kills,bigint,int8,NO,,,64,0
monster_tasks,5,reunlock_gold_cost,bigint,int8,NO,0,,64,0
monster_tasks,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
monster_tasks,7,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
monsters,1,monster_id,uuid,uuid,NO,gen_random_uuid(),,,
monsters,2,monster_family_id,uuid,uuid,NO,,,,
monsters,3,name,character varying,varchar,NO,,100,,
monsters,4,description,text,text,NO,,,,
monsters,5,artwork,text,text,YES,,,,
monsters,6,monster_type,character varying,varchar,NO,,20,,
monsters,7,level,integer,int4,NO,,,32,0
monsters,8,health,bigint,int8,NO,,,64,0
monsters,9,attack,numeric,numeric,NO,,,12,4
monsters,10,defense,numeric,numeric,NO,,,12,4
monsters,11,spell_power_percent,numeric,numeric,NO,100.0000,,8,4
monsters,12,cooldown_seconds,integer,int4,NO,0,,32,0
monsters,13,ability_chance_percent,numeric,numeric,NO,0,,7,4
monsters,14,gold_min,bigint,int8,NO,0,,64,0
monsters,15,gold_max,bigint,int8,NO,0,,64,0
monsters,16,loot_level_modifier,integer,int4,NO,0,,32,0
monsters,17,power_score,bigint,int8,NO,0,,64,0
monsters,18,created_at,timestamp with time zone,timestamptz,NO,now(),,,
monsters,19,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
monsters,20,code,character varying,varchar,NO,,64,,
npc_definitions,1,npc_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
npc_definitions,2,name,character varying,varchar,NO,,100,,
npc_definitions,3,description,text,text,NO,,,,
npc_definitions,4,artwork,text,text,YES,,,,
npc_definitions,5,npc_type,character varying,varchar,NO,,32,,
npc_definitions,6,level_min,integer,int4,YES,,,32,0
npc_definitions,7,level_max,integer,int4,YES,,,32,0
npc_definitions,8,is_active,boolean,bool,NO,true,,,
npc_definitions,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
npc_definitions,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
npc_definitions,11,code,character varying,varchar,NO,,64,,
other_loot_tables,1,other_loot_table_id,uuid,uuid,NO,gen_random_uuid(),,,
other_loot_tables,2,monster_id,uuid,uuid,NO,,,,
other_loot_tables,3,material_id,uuid,uuid,YES,,,,
other_loot_tables,4,consumable_definition_id,uuid,uuid,YES,,,,
other_loot_tables,5,drop_chance_percent,numeric,numeric,NO,,,7,4
other_loot_tables,6,min_quantity,integer,int4,NO,1,,32,0
other_loot_tables,7,max_quantity,integer,int4,NO,1,,32,0
other_loot_tables,8,is_enabled,boolean,bool,NO,true,,,
other_loot_tables,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
other_loot_tables,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
outfit_definitions,1,outfit_definition_id,uuid,uuid,NO,gen_random_uuid(),,,
outfit_definitions,2,name,character varying,varchar,NO,,100,,
outfit_definitions,3,description,text,text,NO,,,,
outfit_definitions,4,artwork,text,text,YES,,,,
outfit_definitions,5,category,character varying,varchar,NO,,64,,
outfit_definitions,6,display_order,integer,int4,NO,0,,32,0
outfit_definitions,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
outfit_definitions,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
outfit_definitions,9,code,character varying,varchar,NO,,64,,
private_messages,1,private_message_id,uuid,uuid,NO,gen_random_uuid(),,,
private_messages,2,sender_account_id,uuid,uuid,NO,,,,
private_messages,3,recipient_account_id,uuid,uuid,NO,,,,
private_messages,4,subject,character varying,varchar,NO,,200,,
private_messages,5,message_body,text,text,NO,,,,
private_messages,6,is_read,boolean,bool,NO,false,,,
private_messages,7,sent_at,timestamp with time zone,timestamptz,NO,now(),,,
private_messages,8,read_at,timestamp with time zone,timestamptz,YES,,,,
private_messages,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
punishments,1,punishment_id,uuid,uuid,NO,gen_random_uuid(),,,
punishments,2,account_id,uuid,uuid,NO,,,,
punishments,3,punishment_type,character varying,varchar,NO,,32,,
punishments,4,reason,text,text,NO,,,,
punishments,5,issued_by,character varying,varchar,NO,,100,,
punishments,6,issued_at,timestamp with time zone,timestamptz,NO,now(),,,
punishments,7,expires_at,timestamp with time zone,timestamptz,YES,,,,
punishments,8,is_active,boolean,bool,NO,true,,,
punishments,9,removed_at,timestamp with time zone,timestamptz,YES,,,,
punishments,10,created_at,timestamp with time zone,timestamptz,NO,now(),,,
recipe_materials,1,recipe_material_id,uuid,uuid,NO,gen_random_uuid(),,,
recipe_materials,2,recipe_id,uuid,uuid,NO,,,,
recipe_materials,3,material_id,uuid,uuid,NO,,,,
recipe_materials,4,required_quantity,bigint,int8,NO,,,64,0
recipe_materials,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
recipes,1,recipe_id,uuid,uuid,NO,gen_random_uuid(),,,
recipes,2,name,character varying,varchar,NO,,100,,
recipes,3,description,text,text,NO,,,,
recipes,4,category,character varying,varchar,NO,,20,,
recipes,5,consumable_definition_id,uuid,uuid,NO,,,,
recipes,6,required_crafting_level,integer,int4,NO,1,,32,0
recipes,7,required_character_level,integer,int4,NO,1,,32,0
recipes,8,gold_cost,bigint,int8,NO,0,,64,0
recipes,9,crafting_time_seconds,integer,int4,NO,,,32,0
recipes,10,crafting_xp_reward,bigint,int8,NO,0,,64,0
recipes,11,output_quantity,integer,int4,NO,1,,32,0
recipes,12,is_enabled,boolean,bool,NO,true,,,
recipes,13,created_at,timestamp with time zone,timestamptz,NO,now(),,,
recipes,14,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
recipes,15,code,character varying,varchar,NO,,64,,
season_rankings,1,season_ranking_id,uuid,uuid,NO,gen_random_uuid(),,,
season_rankings,2,season_id,uuid,uuid,NO,,,,
season_rankings,3,character_id,uuid,uuid,NO,,,,
season_rankings,4,ranking_type,character varying,varchar,NO,,20,,
season_rankings,5,rank_position,integer,int4,NO,,,32,0
season_rankings,6,character_level,integer,int4,NO,,,32,0
season_rankings,7,character_experience,bigint,int8,NO,,,64,0
season_rankings,8,total_deaths,bigint,int8,NO,0,,64,0
season_rankings,9,captured_at,timestamp with time zone,timestamptz,NO,now(),,,
season_rankings,10,created_at,timestamp with time zone,timestamptz,NO,now(),,,
seasons,1,season_id,uuid,uuid,NO,gen_random_uuid(),,,
seasons,2,season_number,integer,int4,NO,,,32,0
seasons,3,name,character varying,varchar,NO,,100,,
seasons,4,start_date,timestamp with time zone,timestamptz,NO,,,,
seasons,5,end_date,timestamp with time zone,timestamptz,NO,,,,
seasons,6,status,character varying,varchar,NO,'Upcoming'::character varying,20,,
seasons,7,is_current,boolean,bool,NO,false,,,
seasons,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
seasons,9,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
seed_history,1,seed_history_id,uuid,uuid,NO,gen_random_uuid(),,,
seed_history,2,seed_name,character varying,varchar,NO,,255,,
seed_history,3,checksum_sha256,character varying,varchar,NO,,64,,
seed_history,4,applied_at,timestamp with time zone,timestamptz,NO,now(),,,
set_bonuses,1,set_bonus_id,uuid,uuid,NO,gen_random_uuid(),,,
set_bonuses,2,set_template_id,uuid,uuid,NO,,,,
set_bonuses,3,required_pieces,integer,int4,NO,,,32,0
set_bonuses,4,bonus_type,character varying,varchar,NO,,32,,
set_bonuses,5,bonus_value,numeric,numeric,NO,,,12,4
set_bonuses,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
set_progress,1,set_progress_id,uuid,uuid,NO,gen_random_uuid(),,,
set_progress,2,account_id,uuid,uuid,NO,,,,
set_progress,3,set_template_id,uuid,uuid,NO,,,,
set_progress,4,pieces_discovered,integer,int4,NO,0,,32,0
set_progress,5,total_pieces_required,integer,int4,NO,,,32,0
set_progress,6,is_completed,boolean,bool,NO,false,,,
set_progress,7,completed_at,timestamp with time zone,timestamptz,YES,,,,
set_progress,8,created_at,timestamp with time zone,timestamptz,NO,now(),,,
set_progress,9,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
set_templates,1,set_template_id,uuid,uuid,NO,gen_random_uuid(),,,
set_templates,2,name,character varying,varchar,NO,,100,,
set_templates,3,description,text,text,NO,,,,
set_templates,4,required_pieces,integer,int4,NO,,,32,0
set_templates,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
set_templates,6,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
set_templates,7,code,character varying,varchar,NO,,64,,
spells,1,spell_id,uuid,uuid,NO,gen_random_uuid(),,,
spells,2,name,character varying,varchar,NO,,100,,
spells,3,description,text,text,NO,,,,
spells,4,icon,text,text,YES,,,,
spells,5,category,character varying,varchar,NO,,32,,
spells,6,target_type,character varying,varchar,NO,,20,,
spells,7,mana_cost,integer,int4,NO,0,,32,0
spells,8,cooldown_turns,integer,int4,NO,0,,32,0
spells,9,base_value,numeric,numeric,NO,0,,12,4
spells,10,duration_turns,integer,int4,NO,0,,32,0
spells,11,required_level,integer,int4,NO,1,,32,0
spells,12,gold_cost,bigint,int8,NO,0,,64,0
spells,13,created_at,timestamp with time zone,timestamptz,NO,now(),,,
spells,14,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
spells,15,code,character varying,varchar,NO,,64,,
unique_pity_tracking,1,unique_pity_tracking_id,uuid,uuid,NO,gen_random_uuid(),,,
unique_pity_tracking,2,character_id,uuid,uuid,NO,,,,
unique_pity_tracking,3,eligible_kill_count,bigint,int8,NO,0,,64,0
unique_pity_tracking,4,current_chance_percent,numeric,numeric,NO,0,,7,4
unique_pity_tracking,5,last_unique_drop_at,timestamp with time zone,timestamptz,YES,,,,
unique_pity_tracking,6,last_set_drop_at,timestamp with time zone,timestamptz,YES,,,,
unique_pity_tracking,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
unique_pity_tracking,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
unique_templates,1,unique_template_id,uuid,uuid,NO,gen_random_uuid(),,,
unique_templates,2,name,character varying,varchar,NO,,100,,
unique_templates,3,description,text,text,NO,,,,
unique_templates,4,min_attack,numeric,numeric,NO,0,,12,4
unique_templates,5,max_attack,numeric,numeric,NO,0,,12,4
unique_templates,6,min_defense,numeric,numeric,NO,0,,12,4
unique_templates,7,max_defense,numeric,numeric,NO,0,,12,4
unique_templates,8,min_spell_power,numeric,numeric,NO,0,,12,4
unique_templates,9,max_spell_power,numeric,numeric,NO,0,,12,4
unique_templates,10,min_health,numeric,numeric,NO,0,,12,4
unique_templates,11,max_health,numeric,numeric,NO,0,,12,4
unique_templates,12,min_mana,numeric,numeric,NO,0,,12,4
unique_templates,13,max_mana,numeric,numeric,NO,0,,12,4
unique_templates,14,min_energy,numeric,numeric,NO,0,,12,4
unique_templates,15,max_energy,numeric,numeric,NO,0,,12,4
unique_templates,16,created_at,timestamp with time zone,timestamptz,NO,now(),,,
unique_templates,17,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
unique_templates,18,code,character varying,varchar,NO,,64,,

```

# ============================================================
# SOURCE: database/metadata/table-constraints.csv
# ============================================================

```text
table_name,constraint_name,constraint_type,check_clause
account_addons,account_addons_account_addon_id_not_null,CHECK,account_addon_id IS NOT NULL
account_addons,account_addons_account_id_not_null,CHECK,account_id IS NOT NULL
account_addons,account_addons_addon_definition_id_not_null,CHECK,addon_definition_id IS NOT NULL
account_addons,account_addons_created_at_not_null,CHECK,created_at IS NOT NULL
account_addons,account_addons_unlocked_at_not_null,CHECK,unlocked_at IS NOT NULL
account_addons,fk_account_addons_account,FOREIGN KEY,
account_addons,fk_account_addons_addon,FOREIGN KEY,
account_addons,account_addons_pkey,PRIMARY KEY,
account_addons,ux_account_addons_account_addon,UNIQUE,
account_friends,account_friends_account_friend_id_not_null,CHECK,account_friend_id IS NOT NULL
account_friends,account_friends_account_id_not_null,CHECK,account_id IS NOT NULL
account_friends,account_friends_created_at_not_null,CHECK,created_at IS NOT NULL
account_friends,account_friends_friend_account_id_not_null,CHECK,friend_account_id IS NOT NULL
account_friends,chk_account_friends_not_self,CHECK,(account_id <> friend_account_id)
account_friends,fk_account_friends_account,FOREIGN KEY,
account_friends,fk_account_friends_friend,FOREIGN KEY,
account_friends,account_friends_pkey,PRIMARY KEY,
account_friends,ux_account_friends_pair,UNIQUE,
account_outfits,account_outfits_account_id_not_null,CHECK,account_id IS NOT NULL
account_outfits,account_outfits_account_outfit_id_not_null,CHECK,account_outfit_id IS NOT NULL
account_outfits,account_outfits_created_at_not_null,CHECK,created_at IS NOT NULL
account_outfits,account_outfits_outfit_definition_id_not_null,CHECK,outfit_definition_id IS NOT NULL
account_outfits,account_outfits_unlocked_at_not_null,CHECK,unlocked_at IS NOT NULL
account_outfits,fk_account_outfits_account,FOREIGN KEY,
account_outfits,fk_account_outfits_outfit,FOREIGN KEY,
account_outfits,account_outfits_pkey,PRIMARY KEY,
account_outfits,ux_account_outfits_account_outfit,UNIQUE,
account_sessions,account_sessions_account_id_not_null,CHECK,account_id IS NOT NULL
account_sessions,account_sessions_account_session_id_not_null,CHECK,account_session_id IS NOT NULL
account_sessions,account_sessions_created_at_not_null,CHECK,created_at IS NOT NULL
account_sessions,account_sessions_expires_at_not_null,CHECK,expires_at IS NOT NULL
account_sessions,account_sessions_is_revoked_not_null,CHECK,is_revoked IS NOT NULL
account_sessions,account_sessions_last_activity_at_not_null,CHECK,last_activity_at IS NOT NULL
account_sessions,account_sessions_session_token_hash_not_null,CHECK,session_token_hash IS NOT NULL
account_sessions,chk_account_sessions_activity,CHECK,(last_activity_at >= created_at)
account_sessions,chk_account_sessions_expiration,CHECK,(expires_at > created_at)
account_sessions,chk_account_sessions_revocation,CHECK,(((is_revoked = false) AND (revoked_at IS NULL)) OR ((is_revoked = true) AND (revoked_at IS NOT NULL) AND (revoked_at >= created_at)))
account_sessions,fk_account_sessions_account,FOREIGN KEY,
account_sessions,account_sessions_pkey,PRIMARY KEY,
account_sessions,ux_account_sessions_refresh_token_hash,UNIQUE,
account_sessions,ux_account_sessions_session_token_hash,UNIQUE,
accounts,accounts_account_id_not_null,CHECK,account_id IS NOT NULL
accounts,accounts_created_at_not_null,CHECK,created_at IS NOT NULL
accounts,accounts_password_hash_not_null,CHECK,password_hash IS NOT NULL
accounts,accounts_status_not_null,CHECK,status IS NOT NULL
accounts,accounts_updated_at_not_null,CHECK,updated_at IS NOT NULL
accounts,accounts_username_not_null,CHECK,username IS NOT NULL
accounts,chk_accounts_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Suspended'::character varying, 'Banned'::character varying, 'Deleted'::character varying])::text[]))"
accounts,accounts_pkey,PRIMARY KEY,
accounts,ux_accounts_email,UNIQUE,
accounts,ux_accounts_username,UNIQUE,
achievement_progress,achievement_progress_account_id_not_null,CHECK,account_id IS NOT NULL
achievement_progress,achievement_progress_achievement_id_not_null,CHECK,achievement_id IS NOT NULL
achievement_progress,achievement_progress_achievement_progress_id_not_null,CHECK,achievement_progress_id IS NOT NULL
achievement_progress,achievement_progress_created_at_not_null,CHECK,created_at IS NOT NULL
achievement_progress,achievement_progress_current_value_not_null,CHECK,current_value IS NOT NULL
achievement_progress,achievement_progress_is_completed_not_null,CHECK,is_completed IS NOT NULL
achievement_progress,achievement_progress_updated_at_not_null,CHECK,updated_at IS NOT NULL
achievement_progress,chk_achievement_progress_completion,CHECK,(((is_completed = false) AND (completed_at IS NULL)) OR ((is_completed = true) AND (completed_at IS NOT NULL)))
achievement_progress,chk_achievement_progress_current_value,CHECK,(current_value >= 0)
achievement_progress,fk_achievement_progress_account,FOREIGN KEY,
achievement_progress,fk_achievement_progress_achievement,FOREIGN KEY,
achievement_progress,achievement_progress_pkey,PRIMARY KEY,
achievement_progress,ux_achievement_progress_account_achievement,UNIQUE,
achievements,achievements_achievement_id_not_null,CHECK,achievement_id IS NOT NULL
achievements,achievements_category_not_null,CHECK,category IS NOT NULL
achievements,achievements_code_not_null,CHECK,code IS NOT NULL
achievements,achievements_created_at_not_null,CHECK,created_at IS NOT NULL
achievements,achievements_description_not_null,CHECK,description IS NOT NULL
achievements,achievements_is_hidden_not_null,CHECK,is_hidden IS NOT NULL
achievements,achievements_name_not_null,CHECK,name IS NOT NULL
achievements,achievements_objective_type_not_null,CHECK,objective_type IS NOT NULL
achievements,achievements_points_not_null,CHECK,points IS NOT NULL
achievements,achievements_required_value_not_null,CHECK,required_value IS NOT NULL
achievements,achievements_reward_attack_not_null,CHECK,reward_attack IS NOT NULL
achievements,achievements_reward_defense_not_null,CHECK,reward_defense IS NOT NULL
achievements,achievements_reward_experience_percent_not_null,CHECK,reward_experience_percent IS NOT NULL
achievements,achievements_reward_gold_percent_not_null,CHECK,reward_gold_percent IS NOT NULL
achievements,achievements_updated_at_not_null,CHECK,updated_at IS NOT NULL
achievements,chk_achievements_category,CHECK,"((category)::text = ANY ((ARRAY['Combat'::character varying, 'Boss'::character varying, 'DailyBoss'::character varying, 'Level'::character varying, 'Gold'::character varying, 'Crafting'::character varying, 'Gathering'::character varying, 'Death'::character varying, 'Hardcore'::character varying, 'Unique'::character varying, 'Set'::character varying, 'HolyGrail'::character varying])::text[]))"
achievements,chk_achievements_points,CHECK,(points >= 0)
achievements,chk_achievements_required_value,CHECK,(required_value > 0)
achievements,chk_achievements_reward_attack,CHECK,(reward_attack >= 0)
achievements,chk_achievements_reward_defense,CHECK,(reward_defense >= 0)
achievements,chk_achievements_reward_experience_percent,CHECK,(reward_experience_percent >= (0)::numeric)
achievements,chk_achievements_reward_gold_percent,CHECK,(reward_gold_percent >= (0)::numeric)
achievements,achievements_pkey,PRIMARY KEY,
achievements,ux_achievements_code,UNIQUE,
achievements,ux_achievements_name,UNIQUE,
addon_definitions,addon_definitions_addon_definition_id_not_null,CHECK,addon_definition_id IS NOT NULL
addon_definitions,addon_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
addon_definitions,addon_definitions_description_not_null,CHECK,description IS NOT NULL
addon_definitions,addon_definitions_display_order_not_null,CHECK,display_order IS NOT NULL
addon_definitions,addon_definitions_name_not_null,CHECK,name IS NOT NULL
addon_definitions,addon_definitions_outfit_definition_id_not_null,CHECK,outfit_definition_id IS NOT NULL
addon_definitions,addon_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
addon_definitions,chk_addon_definitions_display_order,CHECK,(display_order >= 0)
addon_definitions,fk_addon_definitions_outfit,FOREIGN KEY,
addon_definitions,addon_definitions_pkey,PRIMARY KEY,
addon_definitions,ux_addon_definitions_outfit_name,UNIQUE,
admin_actions,admin_actions_action_type_not_null,CHECK,action_type IS NOT NULL
admin_actions,admin_actions_admin_action_id_not_null,CHECK,admin_action_id IS NOT NULL
admin_actions,admin_actions_admin_user_not_null,CHECK,admin_user IS NOT NULL
admin_actions,admin_actions_created_at_not_null,CHECK,created_at IS NOT NULL
admin_actions,chk_admin_actions_target,CHECK,(((target_entity_type IS NULL) AND (target_entity_id IS NULL)) OR ((target_entity_type IS NOT NULL) AND (target_entity_id IS NOT NULL)))
admin_actions,fk_admin_actions_account,FOREIGN KEY,
admin_actions,admin_actions_pkey,PRIMARY KEY,
affix_templates,affix_templates_affix_template_id_not_null,CHECK,affix_template_id IS NOT NULL
affix_templates,affix_templates_affix_type_not_null,CHECK,affix_type IS NOT NULL
affix_templates,affix_templates_created_at_not_null,CHECK,created_at IS NOT NULL
affix_templates,affix_templates_max_value_not_null,CHECK,max_value IS NOT NULL
affix_templates,affix_templates_min_value_not_null,CHECK,min_value IS NOT NULL
affix_templates,affix_templates_required_item_level_not_null,CHECK,required_item_level IS NOT NULL
affix_templates,affix_templates_tier_not_null,CHECK,tier IS NOT NULL
affix_templates,affix_templates_updated_at_not_null,CHECK,updated_at IS NOT NULL
affix_templates,chk_affix_templates_required_level,CHECK,(required_item_level >= 1)
affix_templates,chk_affix_templates_tier,CHECK,(tier >= 1)
affix_templates,chk_affix_templates_type,CHECK,"((affix_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'Health'::character varying, 'Mana'::character varying, 'Energy'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying])::text[]))"
affix_templates,chk_affix_templates_values,CHECK,((min_value >= (0)::numeric) AND (max_value >= min_value))
affix_templates,affix_templates_pkey,PRIMARY KEY,
affix_templates,ux_affix_templates_type_tier,UNIQUE,
announcements,announcements_announcement_id_not_null,CHECK,announcement_id IS NOT NULL
announcements,announcements_content_not_null,CHECK,content IS NOT NULL
announcements,announcements_created_at_not_null,CHECK,created_at IS NOT NULL
announcements,announcements_is_active_not_null,CHECK,is_active IS NOT NULL
announcements,announcements_priority_not_null,CHECK,priority IS NOT NULL
announcements,announcements_title_not_null,CHECK,title IS NOT NULL
announcements,announcements_updated_at_not_null,CHECK,updated_at IS NOT NULL
announcements,chk_announcements_expiration,CHECK,((expires_at IS NULL) OR (published_at IS NULL) OR (expires_at > published_at))
announcements,chk_announcements_priority,CHECK,"((priority)::text = ANY ((ARRAY['Low'::character varying, 'Normal'::character varying, 'High'::character varying, 'Critical'::character varying])::text[]))"
announcements,announcements_pkey,PRIMARY KEY,
auction_history,auction_history_auction_history_id_not_null,CHECK,auction_history_id IS NOT NULL
auction_history,auction_history_auction_listing_id_not_null,CHECK,auction_listing_id IS NOT NULL
auction_history,auction_history_buyer_character_id_not_null,CHECK,buyer_character_id IS NOT NULL
auction_history,auction_history_created_at_not_null,CHECK,created_at IS NOT NULL
auction_history,auction_history_quantity_not_null,CHECK,quantity IS NOT NULL
auction_history,auction_history_seller_character_id_not_null,CHECK,seller_character_id IS NOT NULL
auction_history,auction_history_sold_at_not_null,CHECK,sold_at IS NOT NULL
auction_history,auction_history_total_price_not_null,CHECK,total_price IS NOT NULL
auction_history,auction_history_unit_price_not_null,CHECK,unit_price IS NOT NULL
auction_history,chk_auction_history_asset,CHECK,(((((item_id IS NOT NULL))::integer + ((material_id IS NOT NULL))::integer) + ((consumable_definition_id IS NOT NULL))::integer) = 1)
auction_history,chk_auction_history_characters,CHECK,(seller_character_id <> buyer_character_id)
auction_history,chk_auction_history_prices,CHECK,((unit_price > 0) AND (total_price > 0) AND (total_price = (quantity * unit_price)))
auction_history,chk_auction_history_quantity,CHECK,(quantity > 0)
auction_history,fk_auction_history_buyer,FOREIGN KEY,
auction_history,fk_auction_history_consumable,FOREIGN KEY,
auction_history,fk_auction_history_item,FOREIGN KEY,
auction_history,fk_auction_history_listing,FOREIGN KEY,
auction_history,fk_auction_history_material,FOREIGN KEY,
auction_history,fk_auction_history_seller,FOREIGN KEY,
auction_history,auction_history_pkey,PRIMARY KEY,
auction_listings,auction_listings_auction_listing_id_not_null,CHECK,auction_listing_id IS NOT NULL
auction_listings,auction_listings_character_id_not_null,CHECK,character_id IS NOT NULL
auction_listings,auction_listings_created_at_not_null,CHECK,created_at IS NOT NULL
auction_listings,auction_listings_expires_at_not_null,CHECK,expires_at IS NOT NULL
auction_listings,auction_listings_listing_fee_paid_not_null,CHECK,listing_fee_paid IS NOT NULL
auction_listings,auction_listings_quantity_not_null,CHECK,quantity IS NOT NULL
auction_listings,auction_listings_status_not_null,CHECK,status IS NOT NULL
auction_listings,auction_listings_unit_price_not_null,CHECK,unit_price IS NOT NULL
auction_listings,auction_listings_updated_at_not_null,CHECK,updated_at IS NOT NULL
auction_listings,chk_auction_listings_asset,CHECK,(((((item_id IS NOT NULL))::integer + ((material_id IS NOT NULL))::integer) + ((consumable_definition_id IS NOT NULL))::integer) = 1)
auction_listings,chk_auction_listings_expiration,CHECK,((expires_at > created_at) AND (expires_at <= (created_at + '24:00:00'::interval)))
auction_listings,chk_auction_listings_fee,CHECK,(listing_fee_paid >= 0)
auction_listings,chk_auction_listings_quantity,CHECK,(quantity > 0)
auction_listings,chk_auction_listings_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Sold'::character varying, 'Expired'::character varying, 'Cancelled'::character varying])::text[]))"
auction_listings,chk_auction_listings_unit_price,CHECK,(unit_price > 0)
auction_listings,fk_auction_listings_character,FOREIGN KEY,
auction_listings,fk_auction_listings_consumable,FOREIGN KEY,
auction_listings,fk_auction_listings_item,FOREIGN KEY,
auction_listings,fk_auction_listings_material,FOREIGN KEY,
auction_listings,auction_listings_pkey,PRIMARY KEY,
bestiary_entries,bestiary_entries_bestiary_entry_id_not_null,CHECK,bestiary_entry_id IS NOT NULL
bestiary_entries,bestiary_entries_character_id_not_null,CHECK,character_id IS NOT NULL
bestiary_entries,bestiary_entries_created_at_not_null,CHECK,created_at IS NOT NULL
bestiary_entries,bestiary_entries_monster_id_not_null,CHECK,monster_id IS NOT NULL
bestiary_entries,bestiary_entries_unlocked_at_not_null,CHECK,unlocked_at IS NOT NULL
bestiary_entries,fk_bestiary_entries_character,FOREIGN KEY,
bestiary_entries,fk_bestiary_entries_monster,FOREIGN KEY,
bestiary_entries,bestiary_entries_pkey,PRIMARY KEY,
bestiary_entries,ux_bestiary_entries_character_monster,UNIQUE,
bestiary_statistics,bestiary_statistics_bestiary_statistics_id_not_null,CHECK,bestiary_statistics_id IS NOT NULL
bestiary_statistics,bestiary_statistics_character_id_not_null,CHECK,character_id IS NOT NULL
bestiary_statistics,bestiary_statistics_created_at_not_null,CHECK,created_at IS NOT NULL
bestiary_statistics,bestiary_statistics_first_kill_at_not_null,CHECK,first_kill_at IS NOT NULL
bestiary_statistics,bestiary_statistics_kill_count_not_null,CHECK,kill_count IS NOT NULL
bestiary_statistics,bestiary_statistics_last_kill_at_not_null,CHECK,last_kill_at IS NOT NULL
bestiary_statistics,bestiary_statistics_monster_id_not_null,CHECK,monster_id IS NOT NULL
bestiary_statistics,bestiary_statistics_task_progress_not_null,CHECK,task_progress IS NOT NULL
bestiary_statistics,bestiary_statistics_task_unlocked_not_null,CHECK,task_unlocked IS NOT NULL
bestiary_statistics,bestiary_statistics_updated_at_not_null,CHECK,updated_at IS NOT NULL
bestiary_statistics,chk_bestiary_statistics_dates,CHECK,(last_kill_at >= first_kill_at)
bestiary_statistics,chk_bestiary_statistics_kill_count,CHECK,(kill_count >= 1)
bestiary_statistics,chk_bestiary_statistics_task_progress,CHECK,(task_progress >= 0)
bestiary_statistics,fk_bestiary_statistics_character,FOREIGN KEY,
bestiary_statistics,fk_bestiary_statistics_monster,FOREIGN KEY,
bestiary_statistics,bestiary_statistics_pkey,PRIMARY KEY,
bestiary_statistics,ux_bestiary_statistics_character_monster,UNIQUE,
bosses,bosses_additional_cooldown_seconds_not_null,CHECK,additional_cooldown_seconds IS NOT NULL
bosses,bosses_boss_id_not_null,CHECK,boss_id IS NOT NULL
bosses,bosses_boss_type_not_null,CHECK,boss_type IS NOT NULL
bosses,bosses_created_at_not_null,CHECK,created_at IS NOT NULL
bosses,bosses_loot_level_bonus_not_null,CHECK,loot_level_bonus IS NOT NULL
bosses,bosses_monster_id_not_null,CHECK,monster_id IS NOT NULL
bosses,bosses_unique_modifier_not_null,CHECK,unique_modifier IS NOT NULL
bosses,bosses_updated_at_not_null,CHECK,updated_at IS NOT NULL
bosses,chk_bosses_additional_cooldown,CHECK,(additional_cooldown_seconds >= 0)
bosses,chk_bosses_loot_level_bonus,CHECK,(loot_level_bonus >= 0)
bosses,chk_bosses_type,CHECK,"((boss_type)::text = ANY ((ARRAY['MiniBoss'::character varying, 'TaskBoss'::character varying, 'DailyBoss'::character varying])::text[]))"
bosses,chk_bosses_unique_modifier,CHECK,(unique_modifier >= (0)::numeric)
bosses,fk_bosses_monster,FOREIGN KEY,
bosses,bosses_pkey,PRIMARY KEY,
bosses,ux_bosses_monster_id,UNIQUE,
character_buffs,character_buffs_applied_at_not_null,CHECK,applied_at IS NOT NULL
character_buffs,character_buffs_buff_source_type_not_null,CHECK,buff_source_type IS NOT NULL
character_buffs,character_buffs_buff_type_not_null,CHECK,buff_type IS NOT NULL
character_buffs,character_buffs_character_buff_id_not_null,CHECK,character_buff_id IS NOT NULL
character_buffs,character_buffs_character_id_not_null,CHECK,character_id IS NOT NULL
character_buffs,character_buffs_created_at_not_null,CHECK,created_at IS NOT NULL
character_buffs,character_buffs_duration_type_not_null,CHECK,duration_type IS NOT NULL
character_buffs,character_buffs_is_positive_not_null,CHECK,is_positive IS NOT NULL
character_buffs,character_buffs_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_buffs,character_buffs_value_not_null,CHECK,value IS NOT NULL
character_buffs,chk_character_buffs_duration,CHECK,"((((duration_type)::text = ANY ((ARRAY['Turns'::character varying, 'Fights'::character varying])::text[])) AND (duration_remaining IS NOT NULL) AND (duration_remaining >= 0)) OR (((duration_type)::text = 'Permanent'::text) AND (duration_remaining IS NULL) AND (expires_at IS NULL)))"
character_buffs,chk_character_buffs_duration_type,CHECK,"((duration_type)::text = ANY ((ARRAY['Turns'::character varying, 'Fights'::character varying, 'Permanent'::character varying])::text[]))"
character_buffs,chk_character_buffs_expiration,CHECK,((expires_at IS NULL) OR (expires_at > applied_at))
character_buffs,chk_character_buffs_source,CHECK,((((buff_source_type)::text = 'Consumable'::text) AND (consumable_definition_id IS NOT NULL) AND (spell_id IS NULL)) OR (((buff_source_type)::text = 'Spell'::text) AND (spell_id IS NOT NULL) AND (consumable_definition_id IS NULL)) OR (((buff_source_type)::text = 'System'::text) AND (consumable_definition_id IS NULL) AND (spell_id IS NULL)))
character_buffs,chk_character_buffs_source_type,CHECK,"((buff_source_type)::text = ANY ((ARRAY['Consumable'::character varying, 'Spell'::character varying, 'System'::character varying])::text[]))"
character_buffs,chk_character_buffs_type,CHECK,"((buff_type)::text = ANY ((ARRAY['GoldBoost'::character varying, 'ExperienceBoost'::character varying, 'AttackBuff'::character varying, 'DefenseBuff'::character varying, 'SpellPowerBuff'::character varying, 'DamageOverTime'::character varying, 'HealOverTime'::character varying, 'ManaDrain'::character varying, 'HealthDrain'::character varying, 'PotionDisable'::character varying])::text[]))"
character_buffs,fk_character_buffs_character,FOREIGN KEY,
character_buffs,fk_character_buffs_consumable,FOREIGN KEY,
character_buffs,fk_character_buffs_spell,FOREIGN KEY,
character_buffs,character_buffs_pkey,PRIMARY KEY,
character_buffs,ux_character_buffs_character_type,UNIQUE,
character_cooldowns,character_cooldowns_available_at_not_null,CHECK,available_at IS NOT NULL
character_cooldowns,character_cooldowns_character_cooldown_id_not_null,CHECK,character_cooldown_id IS NOT NULL
character_cooldowns,character_cooldowns_character_id_not_null,CHECK,character_id IS NOT NULL
character_cooldowns,character_cooldowns_cooldown_type_not_null,CHECK,cooldown_type IS NOT NULL
character_cooldowns,character_cooldowns_created_at_not_null,CHECK,created_at IS NOT NULL
character_cooldowns,character_cooldowns_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_cooldowns,chk_character_cooldowns_target,CHECK,((((cooldown_type)::text = 'Monster'::text) AND (target_id IS NOT NULL)) OR (((cooldown_type)::text = 'NpcHealer'::text) AND (target_id IS NULL)))
character_cooldowns,chk_character_cooldowns_type,CHECK,"((cooldown_type)::text = ANY ((ARRAY['Monster'::character varying, 'NpcHealer'::character varying])::text[]))"
character_cooldowns,fk_character_cooldowns_character,FOREIGN KEY,
character_cooldowns,fk_character_cooldowns_target,FOREIGN KEY,
character_cooldowns,character_cooldowns_pkey,PRIMARY KEY,
character_daily_boss_progress,character_daily_boss_progre_character_daily_boss_progr_not_null,CHECK,character_daily_boss_progress_id IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_attempts_date_not_null,CHECK,attempts_date IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_attempts_used_today_not_null,CHECK,attempts_used_today IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_character_id_not_null,CHECK,character_id IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_created_at_not_null,CHECK,created_at IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_daily_boss_definition_id_not_null,CHECK,daily_boss_definition_id IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_total_attempts_not_null,CHECK,total_attempts IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_total_victories_not_null,CHECK,total_victories IS NOT NULL
character_daily_boss_progress,character_daily_boss_progress_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_daily_boss_progress,chk_character_daily_boss_attempts_today,CHECK,(attempts_used_today >= 0)
character_daily_boss_progress,chk_character_daily_boss_highest_tier,CHECK,((highest_tier_defeated IS NULL) OR ((highest_tier_defeated >= 1) AND (highest_tier_defeated <= 3)))
character_daily_boss_progress,chk_character_daily_boss_last_victory,CHECK,((last_victory_at IS NULL) OR ((last_attempt_at IS NOT NULL) AND (last_victory_at <= last_attempt_at)))
character_daily_boss_progress,chk_character_daily_boss_totals,CHECK,((total_attempts >= 0) AND (total_victories >= 0) AND (total_victories <= total_attempts))
character_daily_boss_progress,fk_character_daily_boss_progress_character,FOREIGN KEY,
character_daily_boss_progress,fk_character_daily_boss_progress_definition,FOREIGN KEY,
character_daily_boss_progress,character_daily_boss_progress_pkey,PRIMARY KEY,
character_daily_boss_progress,ux_character_daily_boss_progress,UNIQUE,
character_loadouts,character_loadouts_character_id_not_null,CHECK,character_id IS NOT NULL
character_loadouts,character_loadouts_character_loadout_id_not_null,CHECK,character_loadout_id IS NOT NULL
character_loadouts,character_loadouts_created_at_not_null,CHECK,created_at IS NOT NULL
character_loadouts,character_loadouts_is_default_not_null,CHECK,is_default IS NOT NULL
character_loadouts,character_loadouts_name_not_null,CHECK,name IS NOT NULL
character_loadouts,character_loadouts_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_loadouts,chk_character_loadouts_distinct_spells,CHECK,(((spell_1_id IS NULL) OR (spell_2_id IS NULL) OR (spell_1_id <> spell_2_id)) AND ((spell_1_id IS NULL) OR (spell_3_id IS NULL) OR (spell_1_id <> spell_3_id)) AND ((spell_2_id IS NULL) OR (spell_3_id IS NULL) OR (spell_2_id <> spell_3_id)))
character_loadouts,chk_character_loadouts_spell_order,CHECK,(((spell_2_id IS NULL) OR (spell_1_id IS NOT NULL)) AND ((spell_3_id IS NULL) OR (spell_2_id IS NOT NULL)))
character_loadouts,fk_character_loadouts_character,FOREIGN KEY,
character_loadouts,fk_character_loadouts_spell_1,FOREIGN KEY,
character_loadouts,fk_character_loadouts_spell_2,FOREIGN KEY,
character_loadouts,fk_character_loadouts_spell_3,FOREIGN KEY,
character_loadouts,character_loadouts_pkey,PRIMARY KEY,
character_loadouts,ux_character_loadouts_character_name,UNIQUE,
character_spell_mastery,character_spell_mastery_character_id_not_null,CHECK,character_id IS NOT NULL
character_spell_mastery,character_spell_mastery_character_spell_mastery_id_not_null,CHECK,character_spell_mastery_id IS NOT NULL
character_spell_mastery,character_spell_mastery_created_at_not_null,CHECK,created_at IS NOT NULL
character_spell_mastery,character_spell_mastery_current_spell_power_not_null,CHECK,current_spell_power IS NOT NULL
character_spell_mastery,character_spell_mastery_mastery_experience_not_null,CHECK,mastery_experience IS NOT NULL
character_spell_mastery,character_spell_mastery_mastery_level_not_null,CHECK,mastery_level IS NOT NULL
character_spell_mastery,character_spell_mastery_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_spell_mastery,chk_character_spell_mastery_experience,CHECK,(mastery_experience >= 0)
character_spell_mastery,chk_character_spell_mastery_level,CHECK,(mastery_level >= 1)
character_spell_mastery,chk_character_spell_mastery_power,CHECK,(current_spell_power >= (100)::numeric)
character_spell_mastery,fk_character_spell_mastery_character,FOREIGN KEY,
character_spell_mastery,character_spell_mastery_pkey,PRIMARY KEY,
character_spell_mastery,ux_character_spell_mastery_character_id,UNIQUE,
character_spells,character_spells_character_id_not_null,CHECK,character_id IS NOT NULL
character_spells,character_spells_character_spell_id_not_null,CHECK,character_spell_id IS NOT NULL
character_spells,character_spells_spell_id_not_null,CHECK,spell_id IS NOT NULL
character_spells,character_spells_unlocked_at_not_null,CHECK,unlocked_at IS NOT NULL
character_spells,fk_character_spells_character,FOREIGN KEY,
character_spells,fk_character_spells_spell,FOREIGN KEY,
character_spells,character_spells_pkey,PRIMARY KEY,
character_spells,ux_character_spells_character_spell,UNIQUE,
character_statistics,character_statistics_character_id_not_null,CHECK,character_id IS NOT NULL
character_statistics,character_statistics_character_statistics_id_not_null,CHECK,character_statistics_id IS NOT NULL
character_statistics,character_statistics_created_at_not_null,CHECK,created_at IS NOT NULL
character_statistics,character_statistics_highest_gold_owned_not_null,CHECK,highest_gold_owned IS NOT NULL
character_statistics,character_statistics_highest_physical_hit_not_null,CHECK,highest_physical_hit IS NOT NULL
character_statistics,character_statistics_highest_spell_hit_not_null,CHECK,highest_spell_hit IS NOT NULL
character_statistics,character_statistics_longest_no_death_streak_not_null,CHECK,longest_no_death_streak IS NOT NULL
character_statistics,character_statistics_total_bosses_killed_not_null,CHECK,total_bosses_killed IS NOT NULL
character_statistics,character_statistics_total_daily_bosses_killed_not_null,CHECK,total_daily_bosses_killed IS NOT NULL
character_statistics,character_statistics_total_damage_dealt_not_null,CHECK,total_damage_dealt IS NOT NULL
character_statistics,character_statistics_total_damage_taken_not_null,CHECK,total_damage_taken IS NOT NULL
character_statistics,character_statistics_total_deaths_not_null,CHECK,total_deaths IS NOT NULL
character_statistics,character_statistics_total_gold_earned_not_null,CHECK,total_gold_earned IS NOT NULL
character_statistics,character_statistics_total_gold_spent_not_null,CHECK,total_gold_spent IS NOT NULL
character_statistics,character_statistics_total_healing_done_not_null,CHECK,total_healing_done IS NOT NULL
character_statistics,character_statistics_total_mana_spent_not_null,CHECK,total_mana_spent IS NOT NULL
character_statistics,character_statistics_total_monsters_killed_not_null,CHECK,total_monsters_killed IS NOT NULL
character_statistics,character_statistics_total_playtime_seconds_not_null,CHECK,total_playtime_seconds IS NOT NULL
character_statistics,character_statistics_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_statistics,chk_character_statistics_kill_totals,CHECK,((total_bosses_killed <= total_monsters_killed) AND (total_daily_bosses_killed <= total_bosses_killed))
character_statistics,chk_character_statistics_nonnegative,CHECK,((total_playtime_seconds >= 0) AND (total_gold_earned >= 0) AND (total_gold_spent >= 0) AND (highest_gold_owned >= 0) AND (total_monsters_killed >= 0) AND (total_bosses_killed >= 0) AND (total_daily_bosses_killed >= 0) AND (total_deaths >= 0) AND (total_damage_dealt >= 0) AND (total_damage_taken >= 0) AND (total_healing_done >= 0) AND (total_mana_spent >= 0) AND (highest_physical_hit >= 0) AND (highest_spell_hit >= 0) AND (longest_no_death_streak >= 0))
character_statistics,fk_character_statistics_character,FOREIGN KEY,
character_statistics,fk_character_statistics_strongest_boss,FOREIGN KEY,
character_statistics,fk_character_statistics_strongest_monster,FOREIGN KEY,
character_statistics,character_statistics_pkey,PRIMARY KEY,
character_statistics,ux_character_statistics_character_id,UNIQUE,
character_unlocks,character_unlocks_character_id_not_null,CHECK,character_id IS NOT NULL
character_unlocks,character_unlocks_character_unlocks_id_not_null,CHECK,character_unlocks_id IS NOT NULL
character_unlocks,character_unlocks_crafting_slots_unlocked_not_null,CHECK,crafting_slots_unlocked IS NOT NULL
character_unlocks,character_unlocks_created_at_not_null,CHECK,created_at IS NOT NULL
character_unlocks,character_unlocks_inventory_slots_not_null,CHECK,inventory_slots IS NOT NULL
character_unlocks,character_unlocks_is_promoted_not_null,CHECK,is_promoted IS NOT NULL
character_unlocks,character_unlocks_spell_slots_unlocked_not_null,CHECK,spell_slots_unlocked IS NOT NULL
character_unlocks,character_unlocks_updated_at_not_null,CHECK,updated_at IS NOT NULL
character_unlocks,chk_character_unlocks_crafting_slots,CHECK,((crafting_slots_unlocked >= 1) AND (crafting_slots_unlocked <= 3))
character_unlocks,chk_character_unlocks_inventory_slots,CHECK,"(inventory_slots = ANY (ARRAY[50, 100]))"
character_unlocks,chk_character_unlocks_spell_slots,CHECK,((spell_slots_unlocked >= 1) AND (spell_slots_unlocked <= 3))
character_unlocks,fk_character_unlocks_character,FOREIGN KEY,
character_unlocks,character_unlocks_pkey,PRIMARY KEY,
character_unlocks,ux_character_unlocks_character_id,UNIQUE,
characters,characters_account_id_not_null,CHECK,account_id IS NOT NULL
characters,characters_character_id_not_null,CHECK,character_id IS NOT NULL
characters,characters_crafting_level_not_null,CHECK,crafting_level IS NOT NULL
characters,characters_crafting_xp_not_null,CHECK,crafting_xp IS NOT NULL
characters,characters_created_at_not_null,CHECK,created_at IS NOT NULL
characters,characters_current_energy_not_null,CHECK,current_energy IS NOT NULL
characters,characters_current_health_not_null,CHECK,current_health IS NOT NULL
characters,characters_current_mana_not_null,CHECK,current_mana IS NOT NULL
characters,characters_experience_not_null,CHECK,experience IS NOT NULL
characters,characters_gathering_level_not_null,CHECK,gathering_level IS NOT NULL
characters,characters_gathering_xp_not_null,CHECK,gathering_xp IS NOT NULL
characters,characters_gold_not_null,CHECK,gold IS NOT NULL
characters,characters_level_not_null,CHECK,level IS NOT NULL
characters,characters_max_energy_not_null,CHECK,max_energy IS NOT NULL
characters,characters_max_health_not_null,CHECK,max_health IS NOT NULL
characters,characters_max_mana_not_null,CHECK,max_mana IS NOT NULL
characters,characters_name_not_null,CHECK,name IS NOT NULL
characters,characters_status_not_null,CHECK,status IS NOT NULL
characters,characters_updated_at_not_null,CHECK,updated_at IS NOT NULL
characters,chk_characters_crafting,CHECK,(((crafting_level >= 1) AND (crafting_level <= 10)) AND (crafting_xp >= 0))
characters,chk_characters_experience,CHECK,(experience >= 0)
characters,chk_characters_gathering,CHECK,(((gathering_level >= 1) AND (gathering_level <= 10)) AND (gathering_xp >= 0))
characters,chk_characters_gold,CHECK,(gold >= 0)
characters,chk_characters_level,CHECK,(level >= 1)
characters,chk_characters_max_resources,CHECK,((max_health > 0) AND (max_mana >= 0) AND (max_energy > 0))
characters,chk_characters_resources,CHECK,((current_health >= 0) AND (current_health <= max_health) AND (current_mana >= 0) AND (current_mana <= max_mana) AND (current_energy >= 0) AND (current_energy <= max_energy))
characters,chk_characters_status,CHECK,"((status)::text = ANY ((ARRAY['IsActive'::character varying, 'Archived'::character varying])::text[]))"
characters,fk_characters_account,FOREIGN KEY,
characters,fk_characters_season,FOREIGN KEY,
characters,characters_pkey,PRIMARY KEY,
characters,ux_characters_name,UNIQUE,
chest_definitions,chest_definitions_chest_definition_id_not_null,CHECK,chest_definition_id IS NOT NULL
chest_definitions,chest_definitions_cooldown_seconds_not_null,CHECK,cooldown_seconds IS NOT NULL
chest_definitions,chest_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
chest_definitions,chest_definitions_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
chest_definitions,chest_definitions_name_not_null,CHECK,name IS NOT NULL
chest_definitions,chest_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
chest_definitions,chk_chest_definitions_cooldown,CHECK,(cooldown_seconds > 0)
chest_definitions,chk_chest_definitions_name,CHECK,"((name)::text = ANY ((ARRAY['HourlyChest'::character varying, 'DailyChest'::character varying])::text[]))"
chest_definitions,chest_definitions_pkey,PRIMARY KEY,
chest_definitions,chest_definitions_name_key,UNIQUE,
chest_reward_definitions,chest_reward_definitions_chance_percent_not_null,CHECK,chance_percent IS NOT NULL
chest_reward_definitions,chest_reward_definitions_chest_definition_id_not_null,CHECK,chest_definition_id IS NOT NULL
chest_reward_definitions,chest_reward_definitions_chest_reward_definition_id_not_null,CHECK,chest_reward_definition_id IS NOT NULL
chest_reward_definitions,chest_reward_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
chest_reward_definitions,chest_reward_definitions_max_quantity_not_null,CHECK,max_quantity IS NOT NULL
chest_reward_definitions,chest_reward_definitions_min_quantity_not_null,CHECK,min_quantity IS NOT NULL
chest_reward_definitions,chest_reward_definitions_minimum_character_level_not_null,CHECK,minimum_character_level IS NOT NULL
chest_reward_definitions,chest_reward_definitions_reward_type_not_null,CHECK,reward_type IS NOT NULL
chest_reward_definitions,chest_reward_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
chest_reward_definitions,chk_chest_reward_definitions_chance,CHECK,((chance_percent > (0)::numeric) AND (chance_percent <= (100)::numeric))
chest_reward_definitions,chk_chest_reward_definitions_levels,CHECK,((minimum_character_level >= 1) AND ((maximum_character_level IS NULL) OR (maximum_character_level >= minimum_character_level)))
chest_reward_definitions,chk_chest_reward_definitions_quantity,CHECK,((min_quantity >= 1) AND (max_quantity >= min_quantity))
chest_reward_definitions,chk_chest_reward_definitions_type,CHECK,"((reward_type)::text = ANY ((ARRAY['Gold'::character varying, 'Item'::character varying, 'Material'::character varying, 'Consumable'::character varying, 'Blessing'::character varying, 'ProtectionStone'::character varying, 'UniqueRoll'::character varying, 'SetRoll'::character varying])::text[]))"
chest_reward_definitions,fk_chest_reward_definitions_chest,FOREIGN KEY,
chest_reward_definitions,chest_reward_definitions_pkey,PRIMARY KEY,
combat_effects,chk_combat_effects_source,CHECK,((((source_type)::text = 'Spell'::text) AND (spell_id IS NOT NULL) AND (consumable_definition_id IS NULL)) OR (((source_type)::text = 'Consumable'::text) AND (consumable_definition_id IS NOT NULL) AND (spell_id IS NULL)) OR (((source_type)::text = 'System'::text) AND (spell_id IS NULL) AND (consumable_definition_id IS NULL)))
combat_effects,chk_combat_effects_source_type,CHECK,"((source_type)::text = ANY ((ARRAY['Spell'::character varying, 'Consumable'::character varying, 'System'::character varying])::text[]))"
combat_effects,chk_combat_effects_target,CHECK,"((target_type)::text = ANY ((ARRAY['Character'::character varying, 'Monster'::character varying])::text[]))"
combat_effects,chk_combat_effects_turns,CHECK,(remaining_turns >= 0)
combat_effects,chk_combat_effects_type,CHECK,"((effect_type)::text = ANY ((ARRAY['DamageOverTime'::character varying, 'HealOverTime'::character varying, 'AttackBuff'::character varying, 'DefenseBuff'::character varying, 'SpellPowerBuff'::character varying, 'AttackDebuff'::character varying, 'DefenseDebuff'::character varying, 'SpellPowerDebuff'::character varying, 'ManaDrain'::character varying, 'HealthDrain'::character varying, 'PotionDisable'::character varying])::text[]))"
combat_effects,combat_effects_applied_at_not_null,CHECK,applied_at IS NOT NULL
combat_effects,combat_effects_combat_effect_id_not_null,CHECK,combat_effect_id IS NOT NULL
combat_effects,combat_effects_combat_session_id_not_null,CHECK,combat_session_id IS NOT NULL
combat_effects,combat_effects_created_at_not_null,CHECK,created_at IS NOT NULL
combat_effects,combat_effects_effect_type_not_null,CHECK,effect_type IS NOT NULL
combat_effects,combat_effects_remaining_turns_not_null,CHECK,remaining_turns IS NOT NULL
combat_effects,combat_effects_source_type_not_null,CHECK,source_type IS NOT NULL
combat_effects,combat_effects_target_type_not_null,CHECK,target_type IS NOT NULL
combat_effects,combat_effects_value_not_null,CHECK,value IS NOT NULL
combat_effects,fk_combat_effects_consumable,FOREIGN KEY,
combat_effects,fk_combat_effects_session,FOREIGN KEY,
combat_effects,fk_combat_effects_spell,FOREIGN KEY,
combat_effects,combat_effects_pkey,PRIMARY KEY,
combat_effects,ux_combat_effects_session_type_target,UNIQUE,
combat_logs,chk_combat_logs_dates,CHECK,(ended_at >= started_at)
combat_logs,chk_combat_logs_result,CHECK,"((combat_result)::text = ANY ((ARRAY['Victory'::character varying, 'Defeat'::character varying])::text[]))"
combat_logs,chk_combat_logs_turn_count,CHECK,(turn_count >= 1)
combat_logs,combat_logs_character_id_not_null,CHECK,character_id IS NOT NULL
combat_logs,combat_logs_combat_data_json_not_null,CHECK,combat_data_json IS NOT NULL
combat_logs,combat_logs_combat_log_id_not_null,CHECK,combat_log_id IS NOT NULL
combat_logs,combat_logs_combat_result_not_null,CHECK,combat_result IS NOT NULL
combat_logs,combat_logs_combat_session_id_not_null,CHECK,combat_session_id IS NOT NULL
combat_logs,combat_logs_created_at_not_null,CHECK,created_at IS NOT NULL
combat_logs,combat_logs_ended_at_not_null,CHECK,ended_at IS NOT NULL
combat_logs,combat_logs_monster_id_not_null,CHECK,monster_id IS NOT NULL
combat_logs,combat_logs_started_at_not_null,CHECK,started_at IS NOT NULL
combat_logs,combat_logs_turn_count_not_null,CHECK,turn_count IS NOT NULL
combat_logs,fk_combat_logs_character,FOREIGN KEY,
combat_logs,fk_combat_logs_monster,FOREIGN KEY,
combat_logs,fk_combat_logs_session,FOREIGN KEY,
combat_logs,combat_logs_pkey,PRIMARY KEY,
combat_logs,combat_logs_combat_session_id_key,UNIQUE,
combat_sessions,chk_combat_sessions_end_state,CHECK,((((status)::text = 'Active'::text) AND (ended_at IS NULL)) OR (((status)::text <> 'Active'::text) AND (ended_at IS NOT NULL) AND (ended_at >= started_at)))
combat_sessions,chk_combat_sessions_resources,CHECK,((character_health >= 0) AND (character_mana >= 0) AND (monster_health >= 0))
combat_sessions,chk_combat_sessions_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Victory'::character varying, 'Defeat'::character varying, 'Abandoned'::character varying])::text[]))"
combat_sessions,chk_combat_sessions_turn,CHECK,(current_turn >= 1)
combat_sessions,combat_sessions_character_health_not_null,CHECK,character_health IS NOT NULL
combat_sessions,combat_sessions_character_id_not_null,CHECK,character_id IS NOT NULL
combat_sessions,combat_sessions_character_mana_not_null,CHECK,character_mana IS NOT NULL
combat_sessions,combat_sessions_combat_session_id_not_null,CHECK,combat_session_id IS NOT NULL
combat_sessions,combat_sessions_created_at_not_null,CHECK,created_at IS NOT NULL
combat_sessions,combat_sessions_current_turn_not_null,CHECK,current_turn IS NOT NULL
combat_sessions,combat_sessions_monster_health_not_null,CHECK,monster_health IS NOT NULL
combat_sessions,combat_sessions_monster_id_not_null,CHECK,monster_id IS NOT NULL
combat_sessions,combat_sessions_started_at_not_null,CHECK,started_at IS NOT NULL
combat_sessions,combat_sessions_status_not_null,CHECK,status IS NOT NULL
combat_sessions,combat_sessions_updated_at_not_null,CHECK,updated_at IS NOT NULL
combat_sessions,fk_combat_sessions_character,FOREIGN KEY,
combat_sessions,fk_combat_sessions_monster,FOREIGN KEY,
combat_sessions,combat_sessions_pkey,PRIMARY KEY,
combat_spell_cooldowns,chk_combat_spell_cooldowns_turns,CHECK,(remaining_turns >= 0)
combat_spell_cooldowns,combat_spell_cooldowns_combat_session_id_not_null,CHECK,combat_session_id IS NOT NULL
combat_spell_cooldowns,combat_spell_cooldowns_combat_spell_cooldown_id_not_null,CHECK,combat_spell_cooldown_id IS NOT NULL
combat_spell_cooldowns,combat_spell_cooldowns_created_at_not_null,CHECK,created_at IS NOT NULL
combat_spell_cooldowns,combat_spell_cooldowns_remaining_turns_not_null,CHECK,remaining_turns IS NOT NULL
combat_spell_cooldowns,combat_spell_cooldowns_spell_id_not_null,CHECK,spell_id IS NOT NULL
combat_spell_cooldowns,fk_combat_spell_cooldowns_session,FOREIGN KEY,
combat_spell_cooldowns,fk_combat_spell_cooldowns_spell,FOREIGN KEY,
combat_spell_cooldowns,combat_spell_cooldowns_pkey,PRIMARY KEY,
combat_spell_cooldowns,ux_combat_spell_cooldowns_session_spell,UNIQUE,
consumable_definitions,chk_consumable_definitions_category,CHECK,"((category)::text = ANY ((ARRAY['HealthPotion'::character varying, 'ManaPotion'::character varying, 'EnergyPotion'::character varying, 'GoldBoost'::character varying, 'ExperienceBoost'::character varying, 'Blessing'::character varying, 'ProtectionStone'::character varying])::text[]))"
consumable_definitions,chk_consumable_definitions_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
consumable_definitions,chk_consumable_definitions_duration_type,CHECK,"((duration_type)::text = ANY ((ARRAY['Instant'::character varying, 'Fights'::character varying, 'Passive'::character varying])::text[]))"
consumable_definitions,chk_consumable_definitions_duration_value,CHECK,"((((duration_type)::text = 'Instant'::text) AND (duration_value IS NULL)) OR (((duration_type)::text = ANY ((ARRAY['Fights'::character varying, 'Passive'::character varying])::text[])) AND (duration_value IS NOT NULL) AND (duration_value > 0)))"
consumable_definitions,chk_consumable_definitions_effect_type,CHECK,"((effect_type)::text = ANY ((ARRAY['RestoreHealth'::character varying, 'RestoreMana'::character varying, 'RestoreEnergy'::character varying, 'GoldBonus'::character varying, 'ExperienceBonus'::character varying, 'Blessing'::character varying, 'UpgradeProtection'::character varying])::text[]))"
consumable_definitions,chk_consumable_definitions_effect_value,CHECK,(effect_value >= (0)::numeric)
consumable_definitions,chk_consumable_definitions_potion_cooldown,CHECK,(potion_cooldown_turns >= 0)
consumable_definitions,chk_consumable_definitions_stack_size,CHECK,((max_stack_size >= 1) AND (max_stack_size <= 999))
consumable_definitions,chk_consumable_definitions_tier,CHECK,"((tier)::text = ANY ((ARRAY['Small'::character varying, 'Medium'::character varying, 'Large'::character varying, 'Grand'::character varying, 'Ultimate'::character varying, 'None'::character varying])::text[]))"
consumable_definitions,consumable_definitions_category_not_null,CHECK,category IS NOT NULL
consumable_definitions,consumable_definitions_code_not_null,CHECK,code IS NOT NULL
consumable_definitions,consumable_definitions_consumable_definition_id_not_null,CHECK,consumable_definition_id IS NOT NULL
consumable_definitions,consumable_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
consumable_definitions,consumable_definitions_description_not_null,CHECK,description IS NOT NULL
consumable_definitions,consumable_definitions_duration_type_not_null,CHECK,duration_type IS NOT NULL
consumable_definitions,consumable_definitions_effect_type_not_null,CHECK,effect_type IS NOT NULL
consumable_definitions,consumable_definitions_effect_value_not_null,CHECK,effect_value IS NOT NULL
consumable_definitions,consumable_definitions_is_tradable_not_null,CHECK,is_tradable IS NOT NULL
consumable_definitions,consumable_definitions_max_stack_size_not_null,CHECK,max_stack_size IS NOT NULL
consumable_definitions,consumable_definitions_name_not_null,CHECK,name IS NOT NULL
consumable_definitions,consumable_definitions_potion_cooldown_turns_not_null,CHECK,potion_cooldown_turns IS NOT NULL
consumable_definitions,consumable_definitions_tier_not_null,CHECK,tier IS NOT NULL
consumable_definitions,consumable_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
consumable_definitions,consumable_definitions_pkey,PRIMARY KEY,
consumable_definitions,ux_consumable_definitions_code,UNIQUE,
consumable_definitions,ux_consumable_definitions_name,UNIQUE,
consumable_storage,chk_consumable_storage_quantity,CHECK,(quantity >= 0)
consumable_storage,consumable_storage_character_id_not_null,CHECK,character_id IS NOT NULL
consumable_storage,consumable_storage_consumable_definition_id_not_null,CHECK,consumable_definition_id IS NOT NULL
consumable_storage,consumable_storage_consumable_storage_id_not_null,CHECK,consumable_storage_id IS NOT NULL
consumable_storage,consumable_storage_quantity_not_null,CHECK,quantity IS NOT NULL
consumable_storage,consumable_storage_updated_at_not_null,CHECK,updated_at IS NOT NULL
consumable_storage,fk_consumable_storage_character,FOREIGN KEY,
consumable_storage,fk_consumable_storage_definition,FOREIGN KEY,
consumable_storage,consumable_storage_pkey,PRIMARY KEY,
consumable_storage,ux_consumable_storage_character_definition,UNIQUE,
crafting_history,chk_crafting_history_quantity,CHECK,(quantity_crafted > 0)
crafting_history,chk_crafting_history_xp,CHECK,(crafting_xp_earned >= 0)
crafting_history,crafting_history_character_id_not_null,CHECK,character_id IS NOT NULL
crafting_history,crafting_history_completed_at_not_null,CHECK,completed_at IS NOT NULL
crafting_history,crafting_history_crafting_history_id_not_null,CHECK,crafting_history_id IS NOT NULL
crafting_history,crafting_history_crafting_xp_earned_not_null,CHECK,crafting_xp_earned IS NOT NULL
crafting_history,crafting_history_created_at_not_null,CHECK,created_at IS NOT NULL
crafting_history,crafting_history_quantity_crafted_not_null,CHECK,quantity_crafted IS NOT NULL
crafting_history,crafting_history_recipe_id_not_null,CHECK,recipe_id IS NOT NULL
crafting_history,fk_crafting_history_character,FOREIGN KEY,
crafting_history,fk_crafting_history_recipe,FOREIGN KEY,
crafting_history,crafting_history_pkey,PRIMARY KEY,
crafting_queue,chk_crafting_queue_dates,CHECK,"(((started_at IS NULL) AND ((status)::text = ANY ((ARRAY['Pending'::character varying, 'Cancelled'::character varying])::text[]))) OR ((started_at IS NOT NULL) AND (completes_at > started_at)))"
crafting_queue,chk_crafting_queue_quantity,CHECK,(quantity > 0)
crafting_queue,chk_crafting_queue_slot,CHECK,((crafting_slot >= 1) AND (crafting_slot <= 3))
crafting_queue,chk_crafting_queue_status,CHECK,"((status)::text = ANY ((ARRAY['Pending'::character varying, 'Active'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))"
crafting_queue,crafting_queue_character_id_not_null,CHECK,character_id IS NOT NULL
crafting_queue,crafting_queue_completes_at_not_null,CHECK,completes_at IS NOT NULL
crafting_queue,crafting_queue_crafting_queue_id_not_null,CHECK,crafting_queue_id IS NOT NULL
crafting_queue,crafting_queue_crafting_slot_not_null,CHECK,crafting_slot IS NOT NULL
crafting_queue,crafting_queue_created_at_not_null,CHECK,created_at IS NOT NULL
crafting_queue,crafting_queue_quantity_not_null,CHECK,quantity IS NOT NULL
crafting_queue,crafting_queue_recipe_id_not_null,CHECK,recipe_id IS NOT NULL
crafting_queue,crafting_queue_status_not_null,CHECK,status IS NOT NULL
crafting_queue,fk_crafting_queue_character,FOREIGN KEY,
crafting_queue,fk_crafting_queue_recipe,FOREIGN KEY,
crafting_queue,crafting_queue_pkey,PRIMARY KEY,
daily_boss_definitions,chk_daily_boss_definitions_attempts,CHECK,(attempts_per_day >= 1)
daily_boss_definitions,chk_daily_boss_definitions_recommended_level,CHECK,(recommended_level >= 1)
daily_boss_definitions,chk_daily_boss_definitions_tier,CHECK,((tier >= 1) AND (tier <= 3))
daily_boss_definitions,daily_boss_definitions_attempts_per_day_not_null,CHECK,attempts_per_day IS NOT NULL
daily_boss_definitions,daily_boss_definitions_boss_id_not_null,CHECK,boss_id IS NOT NULL
daily_boss_definitions,daily_boss_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
daily_boss_definitions,daily_boss_definitions_daily_boss_definition_id_not_null,CHECK,daily_boss_definition_id IS NOT NULL
daily_boss_definitions,daily_boss_definitions_recommended_level_not_null,CHECK,recommended_level IS NOT NULL
daily_boss_definitions,daily_boss_definitions_tier_not_null,CHECK,tier IS NOT NULL
daily_boss_definitions,daily_boss_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
daily_boss_definitions,fk_daily_boss_definitions_boss,FOREIGN KEY,
daily_boss_definitions,daily_boss_definitions_pkey,PRIMARY KEY,
daily_boss_definitions,ux_daily_boss_definitions_boss_id,UNIQUE,
daily_boss_pools,chk_daily_boss_pools_tier,CHECK,((tier >= 1) AND (tier <= 3))
daily_boss_pools,daily_boss_pools_created_at_not_null,CHECK,created_at IS NOT NULL
daily_boss_pools,daily_boss_pools_daily_boss_definition_id_not_null,CHECK,daily_boss_definition_id IS NOT NULL
daily_boss_pools,daily_boss_pools_daily_boss_pool_id_not_null,CHECK,daily_boss_pool_id IS NOT NULL
daily_boss_pools,daily_boss_pools_is_active_not_null,CHECK,is_active IS NOT NULL
daily_boss_pools,daily_boss_pools_tier_not_null,CHECK,tier IS NOT NULL
daily_boss_pools,fk_daily_boss_pools_definition,FOREIGN KEY,
daily_boss_pools,daily_boss_pools_pkey,PRIMARY KEY,
daily_boss_pools,ux_daily_boss_pools_tier_definition,UNIQUE,
daily_boss_rotation,chk_daily_boss_rotation_distinct,CHECK,((tier_1_boss_id <> tier_2_boss_id) AND (tier_1_boss_id <> tier_3_boss_id) AND (tier_2_boss_id <> tier_3_boss_id))
daily_boss_rotation,daily_boss_rotation_created_at_not_null,CHECK,created_at IS NOT NULL
daily_boss_rotation,daily_boss_rotation_daily_boss_rotation_id_not_null,CHECK,daily_boss_rotation_id IS NOT NULL
daily_boss_rotation,daily_boss_rotation_reset_timestamp_not_null,CHECK,reset_timestamp IS NOT NULL
daily_boss_rotation,daily_boss_rotation_tier_1_boss_id_not_null,CHECK,tier_1_boss_id IS NOT NULL
daily_boss_rotation,daily_boss_rotation_tier_2_boss_id_not_null,CHECK,tier_2_boss_id IS NOT NULL
daily_boss_rotation,daily_boss_rotation_tier_3_boss_id_not_null,CHECK,tier_3_boss_id IS NOT NULL
daily_boss_rotation,fk_daily_boss_rotation_tier_1,FOREIGN KEY,
daily_boss_rotation,fk_daily_boss_rotation_tier_2,FOREIGN KEY,
daily_boss_rotation,fk_daily_boss_rotation_tier_3,FOREIGN KEY,
daily_boss_rotation,daily_boss_rotation_pkey,PRIMARY KEY,
daily_chest_progress,chk_daily_chest_progress_claim_state,CHECK,(((total_claims = 0) AND (last_claimed_at IS NULL)) OR ((total_claims > 0) AND (last_claimed_at IS NOT NULL)))
daily_chest_progress,chk_daily_chest_progress_claims,CHECK,(total_claims >= 0)
daily_chest_progress,daily_chest_progress_character_id_not_null,CHECK,character_id IS NOT NULL
daily_chest_progress,daily_chest_progress_created_at_not_null,CHECK,created_at IS NOT NULL
daily_chest_progress,daily_chest_progress_daily_chest_progress_id_not_null,CHECK,daily_chest_progress_id IS NOT NULL
daily_chest_progress,daily_chest_progress_is_available_not_null,CHECK,is_available IS NOT NULL
daily_chest_progress,daily_chest_progress_next_available_at_not_null,CHECK,next_available_at IS NOT NULL
daily_chest_progress,daily_chest_progress_total_claims_not_null,CHECK,total_claims IS NOT NULL
daily_chest_progress,daily_chest_progress_updated_at_not_null,CHECK,updated_at IS NOT NULL
daily_chest_progress,fk_daily_chest_progress_character,FOREIGN KEY,
daily_chest_progress,daily_chest_progress_pkey,PRIMARY KEY,
daily_chest_progress,daily_chest_progress_character_id_key,UNIQUE,
equipment_loadouts,equipment_loadouts_character_id_not_null,CHECK,character_id IS NOT NULL
equipment_loadouts,equipment_loadouts_created_at_not_null,CHECK,created_at IS NOT NULL
equipment_loadouts,equipment_loadouts_equipment_loadout_id_not_null,CHECK,equipment_loadout_id IS NOT NULL
equipment_loadouts,equipment_loadouts_is_default_not_null,CHECK,is_default IS NOT NULL
equipment_loadouts,equipment_loadouts_name_not_null,CHECK,name IS NOT NULL
equipment_loadouts,equipment_loadouts_updated_at_not_null,CHECK,updated_at IS NOT NULL
equipment_loadouts,fk_equipment_loadouts_amulet,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_armor,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_boots,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_character,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_helmet,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_legs,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_ring,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_shield,FOREIGN KEY,
equipment_loadouts,fk_equipment_loadouts_weapon,FOREIGN KEY,
equipment_loadouts,equipment_loadouts_pkey,PRIMARY KEY,
equipment_loadouts,ux_equipment_loadouts_character_name,UNIQUE,
friend_requests,chk_friend_requests_not_self,CHECK,(sender_account_id <> recipient_account_id)
friend_requests,chk_friend_requests_response,CHECK,((((status)::text = 'Pending'::text) AND (responded_at IS NULL)) OR (((status)::text <> 'Pending'::text) AND (responded_at IS NOT NULL) AND (responded_at >= sent_at)))
friend_requests,chk_friend_requests_status,CHECK,"((status)::text = ANY ((ARRAY['Pending'::character varying, 'Accepted'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying])::text[]))"
friend_requests,friend_requests_created_at_not_null,CHECK,created_at IS NOT NULL
friend_requests,friend_requests_friend_request_id_not_null,CHECK,friend_request_id IS NOT NULL
friend_requests,friend_requests_recipient_account_id_not_null,CHECK,recipient_account_id IS NOT NULL
friend_requests,friend_requests_sender_account_id_not_null,CHECK,sender_account_id IS NOT NULL
friend_requests,friend_requests_sent_at_not_null,CHECK,sent_at IS NOT NULL
friend_requests,friend_requests_status_not_null,CHECK,status IS NOT NULL
friend_requests,fk_friend_requests_recipient,FOREIGN KEY,
friend_requests,fk_friend_requests_sender,FOREIGN KEY,
friend_requests,friend_requests_pkey,PRIMARY KEY,
gathering_results,chk_gathering_results_quantity,CHECK,(quantity > 0)
gathering_results,chk_gathering_results_rolls,CHECK,(successful_rolls > 0)
gathering_results,gathering_results_created_at_not_null,CHECK,created_at IS NOT NULL
gathering_results,gathering_results_gathering_result_id_not_null,CHECK,gathering_result_id IS NOT NULL
gathering_results,gathering_results_gathering_session_id_not_null,CHECK,gathering_session_id IS NOT NULL
gathering_results,gathering_results_material_id_not_null,CHECK,material_id IS NOT NULL
gathering_results,gathering_results_quantity_not_null,CHECK,quantity IS NOT NULL
gathering_results,gathering_results_successful_rolls_not_null,CHECK,successful_rolls IS NOT NULL
gathering_results,fk_gathering_results_material,FOREIGN KEY,
gathering_results,fk_gathering_results_session,FOREIGN KEY,
gathering_results,gathering_results_pkey,PRIMARY KEY,
gathering_results,ux_gathering_results_session_material,UNIQUE,
gathering_sessions,chk_gathering_sessions_end_state,CHECK,((((status)::text = 'Active'::text) AND (ended_at IS NULL)) OR (((status)::text <> 'Active'::text) AND (ended_at IS NOT NULL) AND (ended_at >= started_at)))
gathering_sessions,chk_gathering_sessions_level,CHECK,(gathering_level_at_start >= 1)
gathering_sessions,chk_gathering_sessions_minutes,CHECK,((total_minutes_gathered >= 0) AND (total_minutes_gathered <= 1440))
gathering_sessions,chk_gathering_sessions_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))"
gathering_sessions,chk_gathering_sessions_xp,CHECK,(experience_earned >= 0)
gathering_sessions,gathering_sessions_character_id_not_null,CHECK,character_id IS NOT NULL
gathering_sessions,gathering_sessions_created_at_not_null,CHECK,created_at IS NOT NULL
gathering_sessions,gathering_sessions_experience_earned_not_null,CHECK,experience_earned IS NOT NULL
gathering_sessions,gathering_sessions_gathering_level_at_start_not_null,CHECK,gathering_level_at_start IS NOT NULL
gathering_sessions,gathering_sessions_gathering_session_id_not_null,CHECK,gathering_session_id IS NOT NULL
gathering_sessions,gathering_sessions_results_collected_not_null,CHECK,results_collected IS NOT NULL
gathering_sessions,gathering_sessions_started_at_not_null,CHECK,started_at IS NOT NULL
gathering_sessions,gathering_sessions_status_not_null,CHECK,status IS NOT NULL
gathering_sessions,gathering_sessions_total_minutes_gathered_not_null,CHECK,total_minutes_gathered IS NOT NULL
gathering_sessions,gathering_sessions_updated_at_not_null,CHECK,updated_at IS NOT NULL
gathering_sessions,fk_gathering_sessions_character,FOREIGN KEY,
gathering_sessions,gathering_sessions_pkey,PRIMARY KEY,
hall_of_fame,chk_hall_of_fame_deaths,CHECK,(total_deaths >= 0)
hall_of_fame,chk_hall_of_fame_experience,CHECK,(final_experience >= 0)
hall_of_fame,chk_hall_of_fame_grail,CHECK,((holy_grail_percent >= (0)::numeric) AND (holy_grail_percent <= (100)::numeric))
hall_of_fame,chk_hall_of_fame_level,CHECK,(final_level >= 1)
hall_of_fame,chk_hall_of_fame_playtime,CHECK,(total_playtime_seconds >= 0)
hall_of_fame,chk_hall_of_fame_rank,CHECK,(rank_position >= 1)
hall_of_fame,chk_hall_of_fame_score,CHECK,(achievement_score >= 0)
hall_of_fame,hall_of_fame_achievement_score_not_null,CHECK,achievement_score IS NOT NULL
hall_of_fame,hall_of_fame_character_name_not_null,CHECK,character_name IS NOT NULL
hall_of_fame,hall_of_fame_created_at_not_null,CHECK,created_at IS NOT NULL
hall_of_fame,hall_of_fame_final_experience_not_null,CHECK,final_experience IS NOT NULL
hall_of_fame,hall_of_fame_final_level_not_null,CHECK,final_level IS NOT NULL
hall_of_fame,hall_of_fame_hall_of_fame_id_not_null,CHECK,hall_of_fame_id IS NOT NULL
hall_of_fame,hall_of_fame_holy_grail_percent_not_null,CHECK,holy_grail_percent IS NOT NULL
hall_of_fame,hall_of_fame_rank_position_not_null,CHECK,rank_position IS NOT NULL
hall_of_fame,hall_of_fame_recorded_at_not_null,CHECK,recorded_at IS NOT NULL
hall_of_fame,hall_of_fame_season_id_not_null,CHECK,season_id IS NOT NULL
hall_of_fame,hall_of_fame_total_deaths_not_null,CHECK,total_deaths IS NOT NULL
hall_of_fame,hall_of_fame_total_playtime_seconds_not_null,CHECK,total_playtime_seconds IS NOT NULL
hall_of_fame,fk_hall_of_fame_character,FOREIGN KEY,
hall_of_fame,fk_hall_of_fame_season,FOREIGN KEY,
hall_of_fame,hall_of_fame_pkey,PRIMARY KEY,
hall_of_fame,ux_hall_of_fame_season_rank,UNIQUE,
holy_grail_entries,chk_holy_grail_entries_target,CHECK,((((unique_template_id IS NOT NULL))::integer + ((set_template_id IS NOT NULL))::integer) = 1)
holy_grail_entries,holy_grail_entries_account_id_not_null,CHECK,account_id IS NOT NULL
holy_grail_entries,holy_grail_entries_created_at_not_null,CHECK,created_at IS NOT NULL
holy_grail_entries,holy_grail_entries_first_found_at_not_null,CHECK,first_found_at IS NOT NULL
holy_grail_entries,holy_grail_entries_holy_grail_entry_id_not_null,CHECK,holy_grail_entry_id IS NOT NULL
holy_grail_entries,fk_holy_grail_entries_account,FOREIGN KEY,
holy_grail_entries,fk_holy_grail_entries_character,FOREIGN KEY,
holy_grail_entries,fk_holy_grail_entries_season,FOREIGN KEY,
holy_grail_entries,fk_holy_grail_entries_set,FOREIGN KEY,
holy_grail_entries,fk_holy_grail_entries_unique,FOREIGN KEY,
holy_grail_entries,holy_grail_entries_pkey,PRIMARY KEY,
hourly_chest_progress,chk_hourly_chest_progress_claim_state,CHECK,(((total_claims = 0) AND (last_claimed_at IS NULL)) OR ((total_claims > 0) AND (last_claimed_at IS NOT NULL)))
hourly_chest_progress,chk_hourly_chest_progress_claims,CHECK,(total_claims >= 0)
hourly_chest_progress,hourly_chest_progress_character_id_not_null,CHECK,character_id IS NOT NULL
hourly_chest_progress,hourly_chest_progress_created_at_not_null,CHECK,created_at IS NOT NULL
hourly_chest_progress,hourly_chest_progress_hourly_chest_progress_id_not_null,CHECK,hourly_chest_progress_id IS NOT NULL
hourly_chest_progress,hourly_chest_progress_is_available_not_null,CHECK,is_available IS NOT NULL
hourly_chest_progress,hourly_chest_progress_next_available_at_not_null,CHECK,next_available_at IS NOT NULL
hourly_chest_progress,hourly_chest_progress_total_claims_not_null,CHECK,total_claims IS NOT NULL
hourly_chest_progress,hourly_chest_progress_updated_at_not_null,CHECK,updated_at IS NOT NULL
hourly_chest_progress,fk_hourly_chest_progress_character,FOREIGN KEY,
hourly_chest_progress,hourly_chest_progress_pkey,PRIMARY KEY,
hourly_chest_progress,hourly_chest_progress_character_id_key,UNIQUE,
inventory_items,chk_inventory_items_position,CHECK,"(""position"" >= 1)"
inventory_items,inventory_items_acquired_at_not_null,CHECK,acquired_at IS NOT NULL
inventory_items,inventory_items_character_id_not_null,CHECK,character_id IS NOT NULL
inventory_items,inventory_items_inventory_item_id_not_null,CHECK,inventory_item_id IS NOT NULL
inventory_items,inventory_items_is_equipped_not_null,CHECK,is_equipped IS NOT NULL
inventory_items,inventory_items_item_id_not_null,CHECK,item_id IS NOT NULL
inventory_items,inventory_items_position_not_null,CHECK,position IS NOT NULL
inventory_items,fk_inventory_items_character,FOREIGN KEY,
inventory_items,fk_inventory_items_item,FOREIGN KEY,
inventory_items,inventory_items_pkey,PRIMARY KEY,
inventory_items,ux_inventory_items_character_position,UNIQUE,
inventory_items,ux_inventory_items_item_id,UNIQUE,
item_affixes,chk_item_affixes_roll_value,CHECK,(roll_value >= (0)::numeric)
item_affixes,item_affixes_affix_template_id_not_null,CHECK,affix_template_id IS NOT NULL
item_affixes,item_affixes_created_at_not_null,CHECK,created_at IS NOT NULL
item_affixes,item_affixes_item_affix_id_not_null,CHECK,item_affix_id IS NOT NULL
item_affixes,item_affixes_item_id_not_null,CHECK,item_id IS NOT NULL
item_affixes,item_affixes_roll_value_not_null,CHECK,roll_value IS NOT NULL
item_affixes,fk_item_affixes_item,FOREIGN KEY,
item_affixes,fk_item_affixes_template,FOREIGN KEY,
item_affixes,item_affixes_pkey,PRIMARY KEY,
item_affixes,ux_item_affixes_item_template,UNIQUE,
item_bases,chk_item_bases_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
item_bases,chk_item_bases_levels,CHECK,((item_level >= 1) AND (required_level >= 1))
item_bases,chk_item_bases_slot,CHECK,"((slot)::text = ANY ((ARRAY['Weapon'::character varying, 'Helmet'::character varying, 'Armor'::character varying, 'Shield'::character varying, 'Legs'::character varying, 'Boots'::character varying, 'Ring'::character varying, 'Amulet'::character varying])::text[]))"
item_bases,chk_item_bases_stats,CHECK,((attack >= (0)::numeric) AND (defense >= (0)::numeric) AND (spell_power >= (0)::numeric) AND (health >= (0)::numeric) AND (mana >= (0)::numeric) AND (energy >= (0)::numeric) AND (gold_percent >= (0)::numeric) AND (experience_percent >= (0)::numeric) AND (base_item_score >= 0))
item_bases,chk_item_bases_template_type,CHECK,(((is_unique = true) AND (unique_template_id IS NOT NULL) AND (is_set = false) AND (set_template_id IS NULL)) OR ((is_set = true) AND (set_template_id IS NOT NULL) AND (is_unique = false) AND (unique_template_id IS NULL)) OR ((is_unique = false) AND (unique_template_id IS NULL) AND (is_set = false) AND (set_template_id IS NULL)))
item_bases,chk_item_bases_weapon_type,CHECK,((((slot)::text = 'Weapon'::text) AND (weapon_type IS NOT NULL)) OR (((slot)::text <> 'Weapon'::text) AND (weapon_type IS NULL)))
item_bases,item_bases_attack_not_null,CHECK,attack IS NOT NULL
item_bases,item_bases_base_item_score_not_null,CHECK,base_item_score IS NOT NULL
item_bases,item_bases_code_not_null,CHECK,code IS NOT NULL
item_bases,item_bases_created_at_not_null,CHECK,created_at IS NOT NULL
item_bases,item_bases_defense_not_null,CHECK,defense IS NOT NULL
item_bases,item_bases_description_not_null,CHECK,description IS NOT NULL
item_bases,item_bases_energy_not_null,CHECK,energy IS NOT NULL
item_bases,item_bases_experience_percent_not_null,CHECK,experience_percent IS NOT NULL
item_bases,item_bases_gold_percent_not_null,CHECK,gold_percent IS NOT NULL
item_bases,item_bases_health_not_null,CHECK,health IS NOT NULL
item_bases,item_bases_is_boss_exclusive_not_null,CHECK,is_boss_exclusive IS NOT NULL
item_bases,item_bases_is_set_not_null,CHECK,is_set IS NOT NULL
item_bases,item_bases_is_unique_not_null,CHECK,is_unique IS NOT NULL
item_bases,item_bases_item_base_id_not_null,CHECK,item_base_id IS NOT NULL
item_bases,item_bases_item_level_not_null,CHECK,item_level IS NOT NULL
item_bases,item_bases_mana_not_null,CHECK,mana IS NOT NULL
item_bases,item_bases_name_not_null,CHECK,name IS NOT NULL
item_bases,item_bases_required_level_not_null,CHECK,required_level IS NOT NULL
item_bases,item_bases_slot_not_null,CHECK,slot IS NOT NULL
item_bases,item_bases_spell_power_not_null,CHECK,spell_power IS NOT NULL
item_bases,item_bases_updated_at_not_null,CHECK,updated_at IS NOT NULL
item_bases,fk_item_bases_set_template,FOREIGN KEY,
item_bases,fk_item_bases_unique_template,FOREIGN KEY,
item_bases,item_bases_pkey,PRIMARY KEY,
item_bases,ux_item_bases_code,UNIQUE,
item_bases,ux_item_bases_name,UNIQUE,
items,chk_items_item_level,CHECK,(item_level >= 1)
items,chk_items_item_score,CHECK,(item_score >= 0)
items,chk_items_rarity,CHECK,"((rarity)::text = ANY ((ARRAY['Common'::character varying, 'Magic'::character varying, 'Rare'::character varying, 'Epic'::character varying, 'Legendary'::character varying])::text[]))"
items,items_created_at_not_null,CHECK,created_at IS NOT NULL
items,items_is_locked_not_null,CHECK,is_locked IS NOT NULL
items,items_item_base_id_not_null,CHECK,item_base_id IS NOT NULL
items,items_item_id_not_null,CHECK,item_id IS NOT NULL
items,items_item_level_not_null,CHECK,item_level IS NOT NULL
items,items_item_score_not_null,CHECK,item_score IS NOT NULL
items,items_rarity_not_null,CHECK,rarity IS NOT NULL
items,fk_items_item_base,FOREIGN KEY,
items,items_pkey,PRIMARY KEY,
login_streak_progress,chk_login_streak_progress_current,CHECK,((current_streak >= 0) AND (current_streak <= 7))
login_streak_progress,chk_login_streak_progress_cycles,CHECK,(completed_cycles >= 0)
login_streak_progress,chk_login_streak_progress_highest,CHECK,(((highest_streak >= 0) AND (highest_streak <= 7)) AND (highest_streak >= current_streak))
login_streak_progress,chk_login_streak_progress_reward_day,CHECK,((last_reward_day >= 0) AND (last_reward_day <= 7))
login_streak_progress,login_streak_progress_character_id_not_null,CHECK,character_id IS NOT NULL
login_streak_progress,login_streak_progress_completed_cycles_not_null,CHECK,completed_cycles IS NOT NULL
login_streak_progress,login_streak_progress_created_at_not_null,CHECK,created_at IS NOT NULL
login_streak_progress,login_streak_progress_current_streak_not_null,CHECK,current_streak IS NOT NULL
login_streak_progress,login_streak_progress_highest_streak_not_null,CHECK,highest_streak IS NOT NULL
login_streak_progress,login_streak_progress_last_reward_day_not_null,CHECK,last_reward_day IS NOT NULL
login_streak_progress,login_streak_progress_login_streak_progress_id_not_null,CHECK,login_streak_progress_id IS NOT NULL
login_streak_progress,login_streak_progress_updated_at_not_null,CHECK,updated_at IS NOT NULL
login_streak_progress,fk_login_streak_progress_character,FOREIGN KEY,
login_streak_progress,login_streak_progress_pkey,PRIMARY KEY,
login_streak_progress,login_streak_progress_character_id_key,UNIQUE,
loot_tables,chk_loot_tables_chance,CHECK,((drop_chance_percent > (0)::numeric) AND (drop_chance_percent <= (100)::numeric))
loot_tables,chk_loot_tables_levels,CHECK,((min_item_level >= 1) AND (max_item_level >= min_item_level))
loot_tables,loot_tables_created_at_not_null,CHECK,created_at IS NOT NULL
loot_tables,loot_tables_drop_chance_percent_not_null,CHECK,drop_chance_percent IS NOT NULL
loot_tables,loot_tables_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
loot_tables,loot_tables_item_base_id_not_null,CHECK,item_base_id IS NOT NULL
loot_tables,loot_tables_loot_level_modifier_not_null,CHECK,loot_level_modifier IS NOT NULL
loot_tables,loot_tables_loot_table_id_not_null,CHECK,loot_table_id IS NOT NULL
loot_tables,loot_tables_max_item_level_not_null,CHECK,max_item_level IS NOT NULL
loot_tables,loot_tables_min_item_level_not_null,CHECK,min_item_level IS NOT NULL
loot_tables,loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
loot_tables,loot_tables_updated_at_not_null,CHECK,updated_at IS NOT NULL
loot_tables,fk_loot_tables_item_base,FOREIGN KEY,
loot_tables,fk_loot_tables_monster,FOREIGN KEY,
loot_tables,loot_tables_pkey,PRIMARY KEY,
loot_tables,ux_loot_tables_monster_item,UNIQUE,
mail_attachments,chk_mail_attachments_collection,CHECK,(((is_collected = false) AND (collected_at IS NULL)) OR ((is_collected = true) AND (collected_at IS NOT NULL) AND (collected_at >= created_at)))
mail_attachments,chk_mail_attachments_payload,CHECK,((((attachment_type)::text = 'Gold'::text) AND (gold_amount > 0) AND (item_id IS NULL) AND (material_id IS NULL) AND (material_quantity IS NULL) AND (consumable_definition_id IS NULL) AND (consumable_quantity IS NULL)) OR (((attachment_type)::text = 'Item'::text) AND (item_id IS NOT NULL) AND (gold_amount IS NULL) AND (material_id IS NULL) AND (material_quantity IS NULL) AND (consumable_definition_id IS NULL) AND (consumable_quantity IS NULL)) OR (((attachment_type)::text = 'Material'::text) AND (material_id IS NOT NULL) AND (material_quantity > 0) AND (gold_amount IS NULL) AND (item_id IS NULL) AND (consumable_definition_id IS NULL) AND (consumable_quantity IS NULL)) OR (((attachment_type)::text = 'Consumable'::text) AND (consumable_definition_id IS NOT NULL) AND (consumable_quantity > 0) AND (gold_amount IS NULL) AND (item_id IS NULL) AND (material_id IS NULL) AND (material_quantity IS NULL)))
mail_attachments,chk_mail_attachments_type,CHECK,"((attachment_type)::text = ANY ((ARRAY['Gold'::character varying, 'Item'::character varying, 'Material'::character varying, 'Consumable'::character varying])::text[]))"
mail_attachments,mail_attachments_attachment_type_not_null,CHECK,attachment_type IS NOT NULL
mail_attachments,mail_attachments_created_at_not_null,CHECK,created_at IS NOT NULL
mail_attachments,mail_attachments_is_collected_not_null,CHECK,is_collected IS NOT NULL
mail_attachments,mail_attachments_mail_attachment_id_not_null,CHECK,mail_attachment_id IS NOT NULL
mail_attachments,mail_attachments_mail_message_id_not_null,CHECK,mail_message_id IS NOT NULL
mail_attachments,fk_mail_attachments_consumable,FOREIGN KEY,
mail_attachments,fk_mail_attachments_item,FOREIGN KEY,
mail_attachments,fk_mail_attachments_material,FOREIGN KEY,
mail_attachments,fk_mail_attachments_message,FOREIGN KEY,
mail_attachments,mail_attachments_pkey,PRIMARY KEY,
mail_messages,chk_mail_messages_expiration,CHECK,((expires_at IS NULL) OR (expires_at > created_at))
mail_messages,chk_mail_messages_read_state,CHECK,(((is_read = false) AND (read_at IS NULL)) OR ((is_read = true) AND (read_at IS NOT NULL) AND (read_at >= created_at)))
mail_messages,chk_mail_messages_type,CHECK,"((message_type)::text = ANY ((ARRAY['MarketplaceSale'::character varying, 'MarketplacePurchase'::character varying, 'AchievementReward'::character varying, 'DailyBossReward'::character varying, 'SeasonReward'::character varying, 'CraftingReward'::character varying, 'AdminMessage'::character varying, 'SystemMessage'::character varying])::text[]))"
mail_messages,mail_messages_body_not_null,CHECK,body IS NOT NULL
mail_messages,mail_messages_character_id_not_null,CHECK,character_id IS NOT NULL
mail_messages,mail_messages_created_at_not_null,CHECK,created_at IS NOT NULL
mail_messages,mail_messages_is_read_not_null,CHECK,is_read IS NOT NULL
mail_messages,mail_messages_mail_message_id_not_null,CHECK,mail_message_id IS NOT NULL
mail_messages,mail_messages_message_type_not_null,CHECK,message_type IS NOT NULL
mail_messages,mail_messages_subject_not_null,CHECK,subject IS NOT NULL
mail_messages,fk_mail_messages_character,FOREIGN KEY,
mail_messages,mail_messages_pkey,PRIMARY KEY,
mail_templates,mail_templates_body_template_not_null,CHECK,body_template IS NOT NULL
mail_templates,mail_templates_code_not_null,CHECK,code IS NOT NULL
mail_templates,mail_templates_created_at_not_null,CHECK,created_at IS NOT NULL
mail_templates,mail_templates_mail_template_id_not_null,CHECK,mail_template_id IS NOT NULL
mail_templates,mail_templates_subject_template_not_null,CHECK,subject_template IS NOT NULL
mail_templates,mail_templates_updated_at_not_null,CHECK,updated_at IS NOT NULL
mail_templates,mail_templates_pkey,PRIMARY KEY,
mail_templates,mail_templates_code_key,UNIQUE,
material_storage,chk_material_storage_quantity,CHECK,(quantity >= 0)
material_storage,material_storage_character_id_not_null,CHECK,character_id IS NOT NULL
material_storage,material_storage_material_id_not_null,CHECK,material_id IS NOT NULL
material_storage,material_storage_material_storage_id_not_null,CHECK,material_storage_id IS NOT NULL
material_storage,material_storage_quantity_not_null,CHECK,quantity IS NOT NULL
material_storage,material_storage_updated_at_not_null,CHECK,updated_at IS NOT NULL
material_storage,fk_material_storage_character,FOREIGN KEY,
material_storage,fk_material_storage_material,FOREIGN KEY,
material_storage,material_storage_pkey,PRIMARY KEY,
material_storage,ux_material_storage_character_material,UNIQUE,
materials,chk_materials_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
materials,chk_materials_material_level,CHECK,(material_level >= 1)
materials,chk_materials_minimum_monster_level,CHECK,((minimum_monster_level IS NULL) OR (minimum_monster_level >= 1))
materials,chk_materials_required_gathering_level,CHECK,(required_gathering_level >= 1)
materials,chk_materials_source,CHECK,((is_gatherable = true) OR (is_lootable = true) OR (vendor_available = true))
materials,chk_materials_stack_size,CHECK,((max_stack_size >= 1) AND (max_stack_size <= 999))
materials,chk_materials_vendor_price,CHECK,(((vendor_available = false) AND (vendor_price IS NULL)) OR ((vendor_available = true) AND (vendor_price IS NOT NULL) AND (vendor_price >= 0)))
materials,materials_code_not_null,CHECK,code IS NOT NULL
materials,materials_created_at_not_null,CHECK,created_at IS NOT NULL
materials,materials_description_not_null,CHECK,description IS NOT NULL
materials,materials_is_crafting_ingredient_not_null,CHECK,is_crafting_ingredient IS NOT NULL
materials,materials_is_gatherable_not_null,CHECK,is_gatherable IS NOT NULL
materials,materials_is_lootable_not_null,CHECK,is_lootable IS NOT NULL
materials,materials_material_id_not_null,CHECK,material_id IS NOT NULL
materials,materials_material_level_not_null,CHECK,material_level IS NOT NULL
materials,materials_max_stack_size_not_null,CHECK,max_stack_size IS NOT NULL
materials,materials_name_not_null,CHECK,name IS NOT NULL
materials,materials_required_gathering_level_not_null,CHECK,required_gathering_level IS NOT NULL
materials,materials_updated_at_not_null,CHECK,updated_at IS NOT NULL
materials,materials_vendor_available_not_null,CHECK,vendor_available IS NOT NULL
materials,materials_pkey,PRIMARY KEY,
materials,ux_materials_code,UNIQUE,
materials,ux_materials_name,UNIQUE,
monster_abilities,monster_abilities_created_at_not_null,CHECK,created_at IS NOT NULL
monster_abilities,monster_abilities_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
monster_abilities,monster_abilities_monster_ability_id_not_null,CHECK,monster_ability_id IS NOT NULL
monster_abilities,monster_abilities_monster_id_not_null,CHECK,monster_id IS NOT NULL
monster_abilities,monster_abilities_spell_id_not_null,CHECK,spell_id IS NOT NULL
monster_abilities,fk_monster_abilities_monster,FOREIGN KEY,
monster_abilities,fk_monster_abilities_spell,FOREIGN KEY,
monster_abilities,monster_abilities_pkey,PRIMARY KEY,
monster_abilities,ux_monster_abilities_monster_spell,UNIQUE,
monster_ability_weights,chk_monster_ability_weights_weight,CHECK,(weight > (0)::numeric)
monster_ability_weights,monster_ability_weights_created_at_not_null,CHECK,created_at IS NOT NULL
monster_ability_weights,monster_ability_weights_monster_ability_id_not_null,CHECK,monster_ability_id IS NOT NULL
monster_ability_weights,monster_ability_weights_monster_ability_weight_id_not_null,CHECK,monster_ability_weight_id IS NOT NULL
monster_ability_weights,monster_ability_weights_weight_not_null,CHECK,weight IS NOT NULL
monster_ability_weights,fk_monster_ability_weights_ability,FOREIGN KEY,
monster_ability_weights,monster_ability_weights_pkey,PRIMARY KEY,
monster_families,chk_monster_families_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
monster_families,monster_families_code_not_null,CHECK,code IS NOT NULL
monster_families,monster_families_created_at_not_null,CHECK,created_at IS NOT NULL
monster_families,monster_families_description_not_null,CHECK,description IS NOT NULL
monster_families,monster_families_monster_family_id_not_null,CHECK,monster_family_id IS NOT NULL
monster_families,monster_families_name_not_null,CHECK,name IS NOT NULL
monster_families,monster_families_updated_at_not_null,CHECK,updated_at IS NOT NULL
monster_families,monster_families_pkey,PRIMARY KEY,
monster_families,ux_monster_families_code,UNIQUE,
monster_families,ux_monster_families_name,UNIQUE,
monster_tasks,chk_monster_tasks_required_kills,CHECK,(required_kills > 0)
monster_tasks,chk_monster_tasks_reunlock_gold_cost,CHECK,(reunlock_gold_cost >= 0)
monster_tasks,monster_tasks_boss_id_not_null,CHECK,boss_id IS NOT NULL
monster_tasks,monster_tasks_created_at_not_null,CHECK,created_at IS NOT NULL
monster_tasks,monster_tasks_monster_id_not_null,CHECK,monster_id IS NOT NULL
monster_tasks,monster_tasks_monster_task_id_not_null,CHECK,monster_task_id IS NOT NULL
monster_tasks,monster_tasks_required_kills_not_null,CHECK,required_kills IS NOT NULL
monster_tasks,monster_tasks_reunlock_gold_cost_not_null,CHECK,reunlock_gold_cost IS NOT NULL
monster_tasks,monster_tasks_updated_at_not_null,CHECK,updated_at IS NOT NULL
monster_tasks,fk_monster_tasks_boss,FOREIGN KEY,
monster_tasks,fk_monster_tasks_monster,FOREIGN KEY,
monster_tasks,monster_tasks_pkey,PRIMARY KEY,
monster_tasks,ux_monster_tasks_monster_id,UNIQUE,
monsters,chk_monsters_ability_chance,CHECK,((ability_chance_percent >= (0)::numeric) AND (ability_chance_percent <= (100)::numeric))
monsters,chk_monsters_attack,CHECK,(attack >= (0)::numeric)
monsters,chk_monsters_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
monsters,chk_monsters_cooldown,CHECK,(cooldown_seconds >= 0)
monsters,chk_monsters_defense,CHECK,(defense >= (0)::numeric)
monsters,chk_monsters_gold,CHECK,((gold_min >= 0) AND (gold_max >= gold_min))
monsters,chk_monsters_health,CHECK,(health > 0)
monsters,chk_monsters_level,CHECK,(level >= 1)
monsters,chk_monsters_power_score,CHECK,(power_score >= 0)
monsters,chk_monsters_spell_power,CHECK,(spell_power_percent >= (0)::numeric)
monsters,chk_monsters_type,CHECK,"((monster_type)::text = ANY ((ARRAY['Normal'::character varying, 'MiniBoss'::character varying, 'TaskBoss'::character varying, 'DailyBoss'::character varying])::text[]))"
monsters,monsters_ability_chance_percent_not_null,CHECK,ability_chance_percent IS NOT NULL
monsters,monsters_attack_not_null,CHECK,attack IS NOT NULL
monsters,monsters_code_not_null,CHECK,code IS NOT NULL
monsters,monsters_cooldown_seconds_not_null,CHECK,cooldown_seconds IS NOT NULL
monsters,monsters_created_at_not_null,CHECK,created_at IS NOT NULL
monsters,monsters_defense_not_null,CHECK,defense IS NOT NULL
monsters,monsters_description_not_null,CHECK,description IS NOT NULL
monsters,monsters_gold_max_not_null,CHECK,gold_max IS NOT NULL
monsters,monsters_gold_min_not_null,CHECK,gold_min IS NOT NULL
monsters,monsters_health_not_null,CHECK,health IS NOT NULL
monsters,monsters_level_not_null,CHECK,level IS NOT NULL
monsters,monsters_loot_level_modifier_not_null,CHECK,loot_level_modifier IS NOT NULL
monsters,monsters_monster_family_id_not_null,CHECK,monster_family_id IS NOT NULL
monsters,monsters_monster_id_not_null,CHECK,monster_id IS NOT NULL
monsters,monsters_monster_type_not_null,CHECK,monster_type IS NOT NULL
monsters,monsters_name_not_null,CHECK,name IS NOT NULL
monsters,monsters_power_score_not_null,CHECK,power_score IS NOT NULL
monsters,monsters_spell_power_percent_not_null,CHECK,spell_power_percent IS NOT NULL
monsters,monsters_updated_at_not_null,CHECK,updated_at IS NOT NULL
monsters,fk_monsters_family,FOREIGN KEY,
monsters,monsters_pkey,PRIMARY KEY,
monsters,ux_monsters_code,UNIQUE,
monsters,ux_monsters_name,UNIQUE,
npc_definitions,chk_npc_definitions_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
npc_definitions,chk_npc_definitions_levels,CHECK,(((level_min IS NULL) AND (level_max IS NULL)) OR ((level_min IS NOT NULL) AND (level_min >= 1) AND ((level_max IS NULL) OR (level_max >= level_min))))
npc_definitions,chk_npc_definitions_type,CHECK,"((npc_type)::text = ANY ((ARRAY['Vendor'::character varying, 'Healer'::character varying, 'BlessingMerchant'::character varying, 'PromotionTrainer'::character varying])::text[]))"
npc_definitions,npc_definitions_code_not_null,CHECK,code IS NOT NULL
npc_definitions,npc_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
npc_definitions,npc_definitions_description_not_null,CHECK,description IS NOT NULL
npc_definitions,npc_definitions_is_active_not_null,CHECK,is_active IS NOT NULL
npc_definitions,npc_definitions_name_not_null,CHECK,name IS NOT NULL
npc_definitions,npc_definitions_npc_definition_id_not_null,CHECK,npc_definition_id IS NOT NULL
npc_definitions,npc_definitions_npc_type_not_null,CHECK,npc_type IS NOT NULL
npc_definitions,npc_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
npc_definitions,npc_definitions_pkey,PRIMARY KEY,
npc_definitions,npc_definitions_name_key,UNIQUE,
npc_definitions,ux_npc_definitions_code,UNIQUE,
other_loot_tables,chk_other_loot_tables_chance,CHECK,((drop_chance_percent > (0)::numeric) AND (drop_chance_percent <= (100)::numeric))
other_loot_tables,chk_other_loot_tables_quantity,CHECK,((min_quantity >= 1) AND (max_quantity >= min_quantity))
other_loot_tables,chk_other_loot_tables_target,CHECK,((((material_id IS NOT NULL))::integer + ((consumable_definition_id IS NOT NULL))::integer) = 1)
other_loot_tables,other_loot_tables_created_at_not_null,CHECK,created_at IS NOT NULL
other_loot_tables,other_loot_tables_drop_chance_percent_not_null,CHECK,drop_chance_percent IS NOT NULL
other_loot_tables,other_loot_tables_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
other_loot_tables,other_loot_tables_max_quantity_not_null,CHECK,max_quantity IS NOT NULL
other_loot_tables,other_loot_tables_min_quantity_not_null,CHECK,min_quantity IS NOT NULL
other_loot_tables,other_loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
other_loot_tables,other_loot_tables_other_loot_table_id_not_null,CHECK,other_loot_table_id IS NOT NULL
other_loot_tables,other_loot_tables_updated_at_not_null,CHECK,updated_at IS NOT NULL
other_loot_tables,fk_other_loot_tables_consumable,FOREIGN KEY,
other_loot_tables,fk_other_loot_tables_material,FOREIGN KEY,
other_loot_tables,fk_other_loot_tables_monster,FOREIGN KEY,
other_loot_tables,other_loot_tables_pkey,PRIMARY KEY,
outfit_definitions,chk_outfit_definitions_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
outfit_definitions,chk_outfit_definitions_display_order,CHECK,(display_order >= 0)
outfit_definitions,outfit_definitions_category_not_null,CHECK,category IS NOT NULL
outfit_definitions,outfit_definitions_code_not_null,CHECK,code IS NOT NULL
outfit_definitions,outfit_definitions_created_at_not_null,CHECK,created_at IS NOT NULL
outfit_definitions,outfit_definitions_description_not_null,CHECK,description IS NOT NULL
outfit_definitions,outfit_definitions_display_order_not_null,CHECK,display_order IS NOT NULL
outfit_definitions,outfit_definitions_name_not_null,CHECK,name IS NOT NULL
outfit_definitions,outfit_definitions_outfit_definition_id_not_null,CHECK,outfit_definition_id IS NOT NULL
outfit_definitions,outfit_definitions_updated_at_not_null,CHECK,updated_at IS NOT NULL
outfit_definitions,outfit_definitions_pkey,PRIMARY KEY,
outfit_definitions,outfit_definitions_name_key,UNIQUE,
outfit_definitions,ux_outfit_definitions_code,UNIQUE,
private_messages,chk_private_messages_not_self,CHECK,(sender_account_id <> recipient_account_id)
private_messages,chk_private_messages_read_state,CHECK,(((is_read = false) AND (read_at IS NULL)) OR ((is_read = true) AND (read_at IS NOT NULL) AND (read_at >= sent_at)))
private_messages,private_messages_created_at_not_null,CHECK,created_at IS NOT NULL
private_messages,private_messages_is_read_not_null,CHECK,is_read IS NOT NULL
private_messages,private_messages_message_body_not_null,CHECK,message_body IS NOT NULL
private_messages,private_messages_private_message_id_not_null,CHECK,private_message_id IS NOT NULL
private_messages,private_messages_recipient_account_id_not_null,CHECK,recipient_account_id IS NOT NULL
private_messages,private_messages_sender_account_id_not_null,CHECK,sender_account_id IS NOT NULL
private_messages,private_messages_sent_at_not_null,CHECK,sent_at IS NOT NULL
private_messages,private_messages_subject_not_null,CHECK,subject IS NOT NULL
private_messages,fk_private_messages_recipient,FOREIGN KEY,
private_messages,fk_private_messages_sender,FOREIGN KEY,
private_messages,private_messages_pkey,PRIMARY KEY,
punishments,chk_punishments_active_state,CHECK,((is_active = true) OR (removed_at IS NOT NULL) OR ((expires_at IS NOT NULL) AND (expires_at <= now())))
punishments,chk_punishments_expiration_order,CHECK,((expires_at IS NULL) OR (expires_at > issued_at))
punishments,chk_punishments_expiration_type,CHECK,"((((punishment_type)::text = 'TemporaryBan'::text) AND (expires_at IS NOT NULL)) OR (((punishment_type)::text = 'PermanentBan'::text) AND (expires_at IS NULL)) OR ((punishment_type)::text = ANY ((ARRAY['Warning'::character varying, 'Mute'::character varying])::text[])))"
punishments,chk_punishments_removed_at,CHECK,((removed_at IS NULL) OR (removed_at >= issued_at))
punishments,chk_punishments_type,CHECK,"((punishment_type)::text = ANY ((ARRAY['Warning'::character varying, 'Mute'::character varying, 'TemporaryBan'::character varying, 'PermanentBan'::character varying])::text[]))"
punishments,punishments_account_id_not_null,CHECK,account_id IS NOT NULL
punishments,punishments_created_at_not_null,CHECK,created_at IS NOT NULL
punishments,punishments_is_active_not_null,CHECK,is_active IS NOT NULL
punishments,punishments_issued_at_not_null,CHECK,issued_at IS NOT NULL
punishments,punishments_issued_by_not_null,CHECK,issued_by IS NOT NULL
punishments,punishments_punishment_id_not_null,CHECK,punishment_id IS NOT NULL
punishments,punishments_punishment_type_not_null,CHECK,punishment_type IS NOT NULL
punishments,punishments_reason_not_null,CHECK,reason IS NOT NULL
punishments,fk_punishments_account,FOREIGN KEY,
punishments,punishments_pkey,PRIMARY KEY,
recipe_materials,chk_recipe_materials_quantity,CHECK,(required_quantity > 0)
recipe_materials,recipe_materials_created_at_not_null,CHECK,created_at IS NOT NULL
recipe_materials,recipe_materials_material_id_not_null,CHECK,material_id IS NOT NULL
recipe_materials,recipe_materials_recipe_id_not_null,CHECK,recipe_id IS NOT NULL
recipe_materials,recipe_materials_recipe_material_id_not_null,CHECK,recipe_material_id IS NOT NULL
recipe_materials,recipe_materials_required_quantity_not_null,CHECK,required_quantity IS NOT NULL
recipe_materials,fk_recipe_materials_material,FOREIGN KEY,
recipe_materials,fk_recipe_materials_recipe,FOREIGN KEY,
recipe_materials,recipe_materials_pkey,PRIMARY KEY,
recipe_materials,ux_recipe_materials_recipe_material,UNIQUE,
recipes,chk_recipes_category,CHECK,"((category)::text = ANY ((ARRAY['Potion'::character varying, 'Blessing'::character varying, 'Upgrade'::character varying, 'Boost'::character varying])::text[]))"
recipes,chk_recipes_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
recipes,chk_recipes_gold_cost,CHECK,(gold_cost >= 0)
recipes,chk_recipes_levels,CHECK,((required_crafting_level >= 1) AND (required_character_level >= 1))
recipes,chk_recipes_output,CHECK,(output_quantity >= 1)
recipes,chk_recipes_time,CHECK,(crafting_time_seconds > 0)
recipes,chk_recipes_xp,CHECK,(crafting_xp_reward >= 0)
recipes,recipes_category_not_null,CHECK,category IS NOT NULL
recipes,recipes_code_not_null,CHECK,code IS NOT NULL
recipes,recipes_consumable_definition_id_not_null,CHECK,consumable_definition_id IS NOT NULL
recipes,recipes_crafting_time_seconds_not_null,CHECK,crafting_time_seconds IS NOT NULL
recipes,recipes_crafting_xp_reward_not_null,CHECK,crafting_xp_reward IS NOT NULL
recipes,recipes_created_at_not_null,CHECK,created_at IS NOT NULL
recipes,recipes_description_not_null,CHECK,description IS NOT NULL
recipes,recipes_gold_cost_not_null,CHECK,gold_cost IS NOT NULL
recipes,recipes_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
recipes,recipes_name_not_null,CHECK,name IS NOT NULL
recipes,recipes_output_quantity_not_null,CHECK,output_quantity IS NOT NULL
recipes,recipes_recipe_id_not_null,CHECK,recipe_id IS NOT NULL
recipes,recipes_required_character_level_not_null,CHECK,required_character_level IS NOT NULL
recipes,recipes_required_crafting_level_not_null,CHECK,required_crafting_level IS NOT NULL
recipes,recipes_updated_at_not_null,CHECK,updated_at IS NOT NULL
recipes,fk_recipes_consumable,FOREIGN KEY,
recipes,recipes_pkey,PRIMARY KEY,
recipes,recipes_name_key,UNIQUE,
recipes,ux_recipes_code,UNIQUE,
season_rankings,chk_season_rankings_deaths,CHECK,(total_deaths >= 0)
season_rankings,chk_season_rankings_experience,CHECK,(character_experience >= 0)
season_rankings,chk_season_rankings_level,CHECK,(character_level >= 1)
season_rankings,chk_season_rankings_rank,CHECK,(rank_position >= 1)
season_rankings,chk_season_rankings_type,CHECK,"((ranking_type)::text = ANY ((ARRAY['Experience'::character varying, 'Hardcore'::character varying])::text[]))"
season_rankings,season_rankings_captured_at_not_null,CHECK,captured_at IS NOT NULL
season_rankings,season_rankings_character_experience_not_null,CHECK,character_experience IS NOT NULL
season_rankings,season_rankings_character_id_not_null,CHECK,character_id IS NOT NULL
season_rankings,season_rankings_character_level_not_null,CHECK,character_level IS NOT NULL
season_rankings,season_rankings_created_at_not_null,CHECK,created_at IS NOT NULL
season_rankings,season_rankings_rank_position_not_null,CHECK,rank_position IS NOT NULL
season_rankings,season_rankings_ranking_type_not_null,CHECK,ranking_type IS NOT NULL
season_rankings,season_rankings_season_id_not_null,CHECK,season_id IS NOT NULL
season_rankings,season_rankings_season_ranking_id_not_null,CHECK,season_ranking_id IS NOT NULL
season_rankings,season_rankings_total_deaths_not_null,CHECK,total_deaths IS NOT NULL
season_rankings,fk_season_rankings_character,FOREIGN KEY,
season_rankings,fk_season_rankings_season,FOREIGN KEY,
season_rankings,season_rankings_pkey,PRIMARY KEY,
season_rankings,ux_season_rankings_season_character_type,UNIQUE,
season_rankings,ux_season_rankings_season_type_rank,UNIQUE,
seasons,chk_seasons_current_status,CHECK,((is_current = false) OR ((status)::text = 'Active'::text))
seasons,chk_seasons_dates,CHECK,(end_date > start_date)
seasons,chk_seasons_number,CHECK,(season_number >= 1)
seasons,chk_seasons_status,CHECK,"((status)::text = ANY ((ARRAY['Upcoming'::character varying, 'Active'::character varying, 'Ended'::character varying])::text[]))"
seasons,seasons_created_at_not_null,CHECK,created_at IS NOT NULL
seasons,seasons_end_date_not_null,CHECK,end_date IS NOT NULL
seasons,seasons_is_current_not_null,CHECK,is_current IS NOT NULL
seasons,seasons_name_not_null,CHECK,name IS NOT NULL
seasons,seasons_season_id_not_null,CHECK,season_id IS NOT NULL
seasons,seasons_season_number_not_null,CHECK,season_number IS NOT NULL
seasons,seasons_start_date_not_null,CHECK,start_date IS NOT NULL
seasons,seasons_status_not_null,CHECK,status IS NOT NULL
seasons,seasons_updated_at_not_null,CHECK,updated_at IS NOT NULL
seasons,seasons_pkey,PRIMARY KEY,
seasons,ux_seasons_season_number,UNIQUE,
seed_history,chk_seed_history_checksum,CHECK,((checksum_sha256)::text ~ '^[a-f0-9]{64}$'::text)
seed_history,seed_history_applied_at_not_null,CHECK,applied_at IS NOT NULL
seed_history,seed_history_checksum_sha256_not_null,CHECK,checksum_sha256 IS NOT NULL
seed_history,seed_history_seed_history_id_not_null,CHECK,seed_history_id IS NOT NULL
seed_history,seed_history_seed_name_not_null,CHECK,seed_name IS NOT NULL
seed_history,seed_history_pkey,PRIMARY KEY,
seed_history,ux_seed_history_seed_name,UNIQUE,
set_bonuses,chk_set_bonuses_required_pieces,CHECK,(required_pieces >= 2)
set_bonuses,chk_set_bonuses_type,CHECK,"((bonus_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying, 'Health'::character varying, 'Mana'::character varying])::text[]))"
set_bonuses,chk_set_bonuses_value,CHECK,(bonus_value >= (0)::numeric)
set_bonuses,set_bonuses_bonus_type_not_null,CHECK,bonus_type IS NOT NULL
set_bonuses,set_bonuses_bonus_value_not_null,CHECK,bonus_value IS NOT NULL
set_bonuses,set_bonuses_created_at_not_null,CHECK,created_at IS NOT NULL
set_bonuses,set_bonuses_required_pieces_not_null,CHECK,required_pieces IS NOT NULL
set_bonuses,set_bonuses_set_bonus_id_not_null,CHECK,set_bonus_id IS NOT NULL
set_bonuses,set_bonuses_set_template_id_not_null,CHECK,set_template_id IS NOT NULL
set_bonuses,fk_set_bonuses_template,FOREIGN KEY,
set_bonuses,set_bonuses_pkey,PRIMARY KEY,
set_bonuses,ux_set_bonuses_template_pieces_type,UNIQUE,
set_progress,chk_set_progress_completion,CHECK,(((is_completed = false) AND (completed_at IS NULL)) OR ((is_completed = true) AND (completed_at IS NOT NULL) AND (pieces_discovered = total_pieces_required)))
set_progress,chk_set_progress_pieces,CHECK,((pieces_discovered >= 0) AND (total_pieces_required >= 1) AND (pieces_discovered <= total_pieces_required))
set_progress,set_progress_account_id_not_null,CHECK,account_id IS NOT NULL
set_progress,set_progress_created_at_not_null,CHECK,created_at IS NOT NULL
set_progress,set_progress_is_completed_not_null,CHECK,is_completed IS NOT NULL
set_progress,set_progress_pieces_discovered_not_null,CHECK,pieces_discovered IS NOT NULL
set_progress,set_progress_set_progress_id_not_null,CHECK,set_progress_id IS NOT NULL
set_progress,set_progress_set_template_id_not_null,CHECK,set_template_id IS NOT NULL
set_progress,set_progress_total_pieces_required_not_null,CHECK,total_pieces_required IS NOT NULL
set_progress,set_progress_updated_at_not_null,CHECK,updated_at IS NOT NULL
set_progress,fk_set_progress_account,FOREIGN KEY,
set_progress,fk_set_progress_template,FOREIGN KEY,
set_progress,set_progress_pkey,PRIMARY KEY,
set_progress,ux_set_progress_account_set,UNIQUE,
set_templates,chk_set_templates_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
set_templates,chk_set_templates_required_pieces,CHECK,(required_pieces >= 2)
set_templates,set_templates_code_not_null,CHECK,code IS NOT NULL
set_templates,set_templates_created_at_not_null,CHECK,created_at IS NOT NULL
set_templates,set_templates_description_not_null,CHECK,description IS NOT NULL
set_templates,set_templates_name_not_null,CHECK,name IS NOT NULL
set_templates,set_templates_required_pieces_not_null,CHECK,required_pieces IS NOT NULL
set_templates,set_templates_set_template_id_not_null,CHECK,set_template_id IS NOT NULL
set_templates,set_templates_updated_at_not_null,CHECK,updated_at IS NOT NULL
set_templates,set_templates_pkey,PRIMARY KEY,
set_templates,ux_set_templates_code,UNIQUE,
set_templates,ux_set_templates_name,UNIQUE,
spells,chk_spells_category,CHECK,"((category)::text = ANY ((ARRAY['Damage'::character varying, 'DamageOverTime'::character varying, 'Healing'::character varying, 'HealOverTime'::character varying, 'ManaDrain'::character varying, 'HealthDrain'::character varying, 'PotionDisable'::character varying, 'StatBuff'::character varying, 'StatDebuff'::character varying])::text[]))"
spells,chk_spells_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
spells,chk_spells_cooldown_turns,CHECK,(cooldown_turns >= 0)
spells,chk_spells_duration_turns,CHECK,(duration_turns >= 0)
spells,chk_spells_gold_cost,CHECK,(gold_cost >= 0)
spells,chk_spells_mana_cost,CHECK,(mana_cost >= 0)
spells,chk_spells_required_level,CHECK,(required_level >= 1)
spells,chk_spells_target_type,CHECK,"((target_type)::text = ANY ((ARRAY['Self'::character varying, 'Enemy'::character varying])::text[]))"
spells,spells_base_value_not_null,CHECK,base_value IS NOT NULL
spells,spells_category_not_null,CHECK,category IS NOT NULL
spells,spells_code_not_null,CHECK,code IS NOT NULL
spells,spells_cooldown_turns_not_null,CHECK,cooldown_turns IS NOT NULL
spells,spells_created_at_not_null,CHECK,created_at IS NOT NULL
spells,spells_description_not_null,CHECK,description IS NOT NULL
spells,spells_duration_turns_not_null,CHECK,duration_turns IS NOT NULL
spells,spells_gold_cost_not_null,CHECK,gold_cost IS NOT NULL
spells,spells_mana_cost_not_null,CHECK,mana_cost IS NOT NULL
spells,spells_name_not_null,CHECK,name IS NOT NULL
spells,spells_required_level_not_null,CHECK,required_level IS NOT NULL
spells,spells_spell_id_not_null,CHECK,spell_id IS NOT NULL
spells,spells_target_type_not_null,CHECK,target_type IS NOT NULL
spells,spells_updated_at_not_null,CHECK,updated_at IS NOT NULL
spells,spells_pkey,PRIMARY KEY,
spells,ux_spells_code,UNIQUE,
spells,ux_spells_name,UNIQUE,
unique_pity_tracking,chk_unique_pity_tracking_chance,CHECK,((current_chance_percent >= (0)::numeric) AND (current_chance_percent <= (100)::numeric))
unique_pity_tracking,chk_unique_pity_tracking_kills,CHECK,(eligible_kill_count >= 0)
unique_pity_tracking,unique_pity_tracking_character_id_not_null,CHECK,character_id IS NOT NULL
unique_pity_tracking,unique_pity_tracking_created_at_not_null,CHECK,created_at IS NOT NULL
unique_pity_tracking,unique_pity_tracking_current_chance_percent_not_null,CHECK,current_chance_percent IS NOT NULL
unique_pity_tracking,unique_pity_tracking_eligible_kill_count_not_null,CHECK,eligible_kill_count IS NOT NULL
unique_pity_tracking,unique_pity_tracking_unique_pity_tracking_id_not_null,CHECK,unique_pity_tracking_id IS NOT NULL
unique_pity_tracking,unique_pity_tracking_updated_at_not_null,CHECK,updated_at IS NOT NULL
unique_pity_tracking,fk_unique_pity_tracking_character,FOREIGN KEY,
unique_pity_tracking,unique_pity_tracking_pkey,PRIMARY KEY,
unique_pity_tracking,unique_pity_tracking_character_id_key,UNIQUE,
unique_templates,chk_unique_templates_attack,CHECK,((min_attack >= (0)::numeric) AND (max_attack >= min_attack))
unique_templates,chk_unique_templates_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
unique_templates,chk_unique_templates_defense,CHECK,((min_defense >= (0)::numeric) AND (max_defense >= min_defense))
unique_templates,chk_unique_templates_energy,CHECK,((min_energy >= (0)::numeric) AND (max_energy >= min_energy))
unique_templates,chk_unique_templates_health,CHECK,((min_health >= (0)::numeric) AND (max_health >= min_health))
unique_templates,chk_unique_templates_mana,CHECK,((min_mana >= (0)::numeric) AND (max_mana >= min_mana))
unique_templates,chk_unique_templates_spell_power,CHECK,((min_spell_power >= (0)::numeric) AND (max_spell_power >= min_spell_power))
unique_templates,unique_templates_code_not_null,CHECK,code IS NOT NULL
unique_templates,unique_templates_created_at_not_null,CHECK,created_at IS NOT NULL
unique_templates,unique_templates_description_not_null,CHECK,description IS NOT NULL
unique_templates,unique_templates_max_attack_not_null,CHECK,max_attack IS NOT NULL
unique_templates,unique_templates_max_defense_not_null,CHECK,max_defense IS NOT NULL
unique_templates,unique_templates_max_energy_not_null,CHECK,max_energy IS NOT NULL
unique_templates,unique_templates_max_health_not_null,CHECK,max_health IS NOT NULL
unique_templates,unique_templates_max_mana_not_null,CHECK,max_mana IS NOT NULL
unique_templates,unique_templates_max_spell_power_not_null,CHECK,max_spell_power IS NOT NULL
unique_templates,unique_templates_min_attack_not_null,CHECK,min_attack IS NOT NULL
unique_templates,unique_templates_min_defense_not_null,CHECK,min_defense IS NOT NULL
unique_templates,unique_templates_min_energy_not_null,CHECK,min_energy IS NOT NULL
unique_templates,unique_templates_min_health_not_null,CHECK,min_health IS NOT NULL
unique_templates,unique_templates_min_mana_not_null,CHECK,min_mana IS NOT NULL
unique_templates,unique_templates_min_spell_power_not_null,CHECK,min_spell_power IS NOT NULL
unique_templates,unique_templates_name_not_null,CHECK,name IS NOT NULL
unique_templates,unique_templates_unique_template_id_not_null,CHECK,unique_template_id IS NOT NULL
unique_templates,unique_templates_updated_at_not_null,CHECK,updated_at IS NOT NULL
unique_templates,unique_templates_pkey,PRIMARY KEY,
unique_templates,ux_unique_templates_code,UNIQUE,
unique_templates,ux_unique_templates_name,UNIQUE,

```

# ============================================================
# MIGRATION STATUS
# ============================================================

```text

> ostatnia-szansa-game@1.0.0 db:migrate:status
> tsx scripts/run-migrations.ts --status

Database: ostatnia_szansa_dev
Migrations: 90
applied  001_accounts.sql
applied  002_achievements.sql
applied  003_announcements.sql
applied  004_seasons.sql
applied  005_spells.sql
applied  006_consumable_definitions.sql
applied  007_materials.sql
applied  008_unique_templates.sql
applied  009_set_templates.sql
applied  010_monster_families.sql
applied  011_monsters.sql
applied  012_bosses.sql
applied  013_daily_boss_definitions.sql
applied  014_daily_boss_pools.sql
applied  015_daily_boss_rotation.sql
applied  016_account_sessions.sql
applied  017_item_bases.sql
applied  018_affix_templates.sql
applied  019_items.sql
applied  020_characters.sql
applied  021_achievement_progress.sql
applied  022_character_unlocks.sql
applied  023_character_spell_mastery.sql
applied  024_character_spells.sql
applied  025_character_loadouts.sql
applied  026_character_cooldowns.sql
applied  027_character_statistics.sql
applied  028_character_buffs.sql
applied  029_inventory_items.sql
applied  030_material_storage.sql
applied  031_consumable_storage.sql
applied  032_equipment_loadouts.sql
applied  033_item_affixes.sql
applied  034_set_bonuses.sql
applied  035_bestiary_entries.sql
applied  036_bestiary_statistics.sql
applied  037_character_daily_boss_progress.sql
applied  038_monster_tasks.sql
applied  039_monster_abilities.sql
applied  040_monster_ability_weights.sql
applied  041_chest_definitions.sql
applied  042_chest_reward_definitions.sql
applied  043_daily_chest_progress.sql
applied  044_hourly_chest_progress.sql
applied  045_login_streak_progress.sql
applied  046_combat_sessions.sql
applied  047_combat_effects.sql
applied  048_combat_spell_cooldowns.sql
applied  049_combat_logs.sql
applied  050_recipes.sql
applied  051_recipe_materials.sql
applied  052_crafting_queue.sql
applied  053_crafting_history.sql
applied  054_gathering_sessions.sql
applied  055_gathering_results.sql
applied  056_loot_tables.sql
applied  057_other_loot_tables.sql
applied  058_unique_pity_tracking.sql
applied  059_holy_grail_entries.sql
applied  060_set_progress.sql
applied  061_admin_actions.sql
applied  062_punishments.sql
applied  063_npc_definitions.sql
applied  064_outfit_definitions.sql
applied  065_addon_definitions.sql
applied  066_account_outfits.sql
applied  067_account_addons.sql
applied  068_account_friends.sql
applied  069_friend_requests.sql
applied  070_private_messages.sql
applied  071_auction_listings.sql
applied  072_auction_history.sql
applied  073_mail_templates.sql
applied  074_mail_messages.sql
applied  075_mail_attachments.sql
applied  076_season_rankings.sql
applied  077_hall_of_fame.sql
applied  078_seed_history.sql
applied  079_add_stable_content_codes.sql
applied  080_character_foundation_support.sql
applied  081_effective_character_statistics.sql
applied  082_add_item_handedness.sql
applied  083_add_monster_energy_cost.sql
applied  084_task_status_refactor.sql
applied  085_unique_monster_task_boss.sql
applied  086_daily_boss_rotation_window.sql
applied  087_daily_boss_attempt_rotation.sql
applied  088_persistent_combat_api.sql
applied  089_victory_death_progression.sql
applied  090_item_loot_generation.sql
Pending: 0
```

