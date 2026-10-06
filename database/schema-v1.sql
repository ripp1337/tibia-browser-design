-- =====================================================
-- COMPLETE DATABASE SCHEMA V1
-- Generated: 2026-10-06 11:07:09
-- Migration count: 77
-- =====================================================

-- =====================================================
-- FILE: 001_accounts.sql
-- =====================================================

-- =====================================================
-- 001_accounts.sql
-- =====================================================

CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(32) NOT NULL,
    email VARCHAR(255) NULL,
    password_hash TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NULL,

    CONSTRAINT ux_accounts_username UNIQUE (username),
    CONSTRAINT ux_accounts_email UNIQUE (email),

    CONSTRAINT chk_accounts_status
        CHECK (status IN ('Active', 'Suspended', 'Banned', 'Deleted'))
);

CREATE INDEX ix_accounts_status
    ON accounts(status);

CREATE INDEX ix_accounts_created_at
    ON accounts(created_at);

-- =====================================================
-- FILE: 002_achievements.sql
-- =====================================================

-- =====================================================
-- 002_achievements.sql
-- =====================================================

CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    category VARCHAR(32) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    objective_type VARCHAR(64) NOT NULL,
    required_value BIGINT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,

    reward_attack INTEGER NOT NULL DEFAULT 0,
    reward_defense INTEGER NOT NULL DEFAULT 0,
    reward_gold_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
    reward_experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_achievements_code UNIQUE (code),
    CONSTRAINT ux_achievements_name UNIQUE (name),

    CONSTRAINT chk_achievements_category
        CHECK (category IN (
            'Combat', 'Boss', 'DailyBoss', 'Level', 'Gold', 'Crafting',
            'Gathering', 'Death', 'Hardcore', 'Unique', 'Set', 'HolyGrail'
        )),

    CONSTRAINT chk_achievements_points CHECK (points >= 0),
    CONSTRAINT chk_achievements_required_value CHECK (required_value > 0),
    CONSTRAINT chk_achievements_reward_attack CHECK (reward_attack >= 0),
    CONSTRAINT chk_achievements_reward_defense CHECK (reward_defense >= 0),
    CONSTRAINT chk_achievements_reward_gold_percent CHECK (reward_gold_percent >= 0),
    CONSTRAINT chk_achievements_reward_experience_percent
        CHECK (reward_experience_percent >= 0)
);

CREATE INDEX ix_achievements_category
    ON achievements(category);

CREATE INDEX ix_achievements_objective_type
    ON achievements(objective_type);

CREATE INDEX ix_achievements_is_hidden
    ON achievements(is_hidden);

-- =====================================================
-- FILE: 003_announcements.sql
-- =====================================================

-- =====================================================
-- 003_announcements.sql
-- =====================================================

CREATE TABLE announcements (
    announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    published_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_announcements_priority
        CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),

    CONSTRAINT chk_announcements_expiration
        CHECK (
            expires_at IS NULL
            OR published_at IS NULL
            OR expires_at > published_at
        )
);

CREATE INDEX ix_announcements_is_active
    ON announcements(is_active);

CREATE INDEX ix_announcements_published_at
    ON announcements(published_at);

CREATE INDEX ix_announcements_expires_at
    ON announcements(expires_at);

-- =====================================================
-- FILE: 004_seasons.sql
-- =====================================================

-- =====================================================
-- 004_seasons.sql
-- =====================================================

CREATE TABLE seasons (
    season_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    season_number INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,

    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'Upcoming',
    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_seasons_season_number UNIQUE (season_number),

    CONSTRAINT chk_seasons_number CHECK (season_number >= 1),

    CONSTRAINT chk_seasons_status
        CHECK (status IN ('Upcoming', 'Active', 'Ended')),

    CONSTRAINT chk_seasons_dates
        CHECK (end_date > start_date),

    CONSTRAINT chk_seasons_current_status
        CHECK (is_current = FALSE OR status = 'Active')
);

CREATE UNIQUE INDEX ux_seasons_one_active
    ON seasons ((TRUE))
    WHERE status = 'Active';

CREATE UNIQUE INDEX ux_seasons_one_current
    ON seasons ((TRUE))
    WHERE is_current = TRUE;

CREATE INDEX ix_seasons_status
    ON seasons(status);

CREATE INDEX ix_seasons_start_date
    ON seasons(start_date);

CREATE INDEX ix_seasons_end_date
    ON seasons(end_date);

-- =====================================================
-- FILE: 005_spells.sql
-- =====================================================

-- =====================================================
-- 005_spells.sql
-- =====================================================

CREATE TABLE spells (
    spell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NULL,

    category VARCHAR(32) NOT NULL,
    target_type VARCHAR(20) NOT NULL,

    mana_cost INTEGER NOT NULL DEFAULT 0,
    cooldown_turns INTEGER NOT NULL DEFAULT 0,
    base_value NUMERIC(12, 4) NOT NULL DEFAULT 0,
    duration_turns INTEGER NOT NULL DEFAULT 0,

    required_level INTEGER NOT NULL DEFAULT 1,
    gold_cost BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_spells_name UNIQUE (name),

    CONSTRAINT chk_spells_category
        CHECK (category IN (
            'Damage', 'DamageOverTime', 'Healing', 'HealOverTime',
            'ManaDrain', 'HealthDrain', 'PotionDisable', 'StatBuff', 'StatDebuff'
        )),

    CONSTRAINT chk_spells_target_type
        CHECK (target_type IN ('Self', 'Enemy')),

    CONSTRAINT chk_spells_mana_cost CHECK (mana_cost >= 0),
    CONSTRAINT chk_spells_cooldown_turns CHECK (cooldown_turns >= 0),
    CONSTRAINT chk_spells_duration_turns CHECK (duration_turns >= 0),
    CONSTRAINT chk_spells_required_level CHECK (required_level >= 1),
    CONSTRAINT chk_spells_gold_cost CHECK (gold_cost >= 0)
);

CREATE INDEX ix_spells_category
    ON spells(category);

CREATE INDEX ix_spells_required_level
    ON spells(required_level);

-- =====================================================
-- FILE: 006_consumable_definitions.sql
-- =====================================================

-- =====================================================
-- 006_consumable_definitions.sql
-- =====================================================

CREATE TABLE consumable_definitions (
    consumable_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    category VARCHAR(32) NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'None',
    effect_type VARCHAR(32) NOT NULL,

    effect_value NUMERIC(12, 4) NOT NULL DEFAULT 0,
    duration_type VARCHAR(20) NOT NULL,
    duration_value INTEGER NULL,
    potion_cooldown_turns INTEGER NOT NULL DEFAULT 0,

    max_stack_size INTEGER NOT NULL DEFAULT 999,
    is_tradable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_consumable_definitions_name UNIQUE (name),

    CONSTRAINT chk_consumable_definitions_category
        CHECK (category IN (
            'HealthPotion', 'ManaPotion', 'EnergyPotion', 'GoldBoost',
            'ExperienceBoost', 'Blessing', 'ProtectionStone'
        )),

    CONSTRAINT chk_consumable_definitions_tier
        CHECK (tier IN ('Small', 'Medium', 'Large', 'Grand', 'Ultimate', 'None')),

    CONSTRAINT chk_consumable_definitions_effect_type
        CHECK (effect_type IN (
            'RestoreHealth', 'RestoreMana', 'RestoreEnergy', 'GoldBonus',
            'ExperienceBonus', 'Blessing', 'UpgradeProtection'
        )),

    CONSTRAINT chk_consumable_definitions_duration_type
        CHECK (duration_type IN ('Instant', 'Fights', 'Passive')),

    CONSTRAINT chk_consumable_definitions_duration_value
        CHECK (
            (duration_type = 'Instant' AND duration_value IS NULL)
            OR
            (duration_type IN ('Fights', 'Passive') AND duration_value IS NOT NULL AND duration_value > 0)
        ),

    CONSTRAINT chk_consumable_definitions_effect_value
        CHECK (effect_value >= 0),

    CONSTRAINT chk_consumable_definitions_potion_cooldown
        CHECK (potion_cooldown_turns >= 0),

    CONSTRAINT chk_consumable_definitions_stack_size
        CHECK (max_stack_size BETWEEN 1 AND 999)
);

CREATE INDEX ix_consumable_definitions_category
    ON consumable_definitions(category);

CREATE INDEX ix_consumable_definitions_effect_type
    ON consumable_definitions(effect_type);

-- =====================================================
-- FILE: 007_materials.sql
-- =====================================================

-- =====================================================
-- 007_materials.sql
-- =====================================================

CREATE TABLE materials (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    material_level INTEGER NOT NULL DEFAULT 1,

    vendor_available BOOLEAN NOT NULL DEFAULT FALSE,
    vendor_price BIGINT NULL,

    is_gatherable BOOLEAN NOT NULL DEFAULT FALSE,
    is_lootable BOOLEAN NOT NULL DEFAULT FALSE,
    is_crafting_ingredient BOOLEAN NOT NULL DEFAULT TRUE,

    required_gathering_level INTEGER NOT NULL DEFAULT 1,
    minimum_monster_level INTEGER NULL,
    max_stack_size INTEGER NOT NULL DEFAULT 999,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_materials_name UNIQUE (name),

    CONSTRAINT chk_materials_material_level
        CHECK (material_level >= 1),

    CONSTRAINT chk_materials_vendor_price
        CHECK (
            (vendor_available = FALSE AND vendor_price IS NULL)
            OR
            (vendor_available = TRUE AND vendor_price IS NOT NULL AND vendor_price >= 0)
        ),

    CONSTRAINT chk_materials_required_gathering_level
        CHECK (required_gathering_level >= 1),

    CONSTRAINT chk_materials_minimum_monster_level
        CHECK (minimum_monster_level IS NULL OR minimum_monster_level >= 1),

    CONSTRAINT chk_materials_stack_size
        CHECK (max_stack_size BETWEEN 1 AND 999),

    CONSTRAINT chk_materials_source
        CHECK (is_gatherable = TRUE OR is_lootable = TRUE OR vendor_available = TRUE)
);

CREATE INDEX ix_materials_material_level
    ON materials(material_level);

CREATE INDEX ix_materials_required_gathering_level
    ON materials(required_gathering_level);

CREATE INDEX ix_materials_minimum_monster_level
    ON materials(minimum_monster_level);

CREATE INDEX ix_materials_is_gatherable
    ON materials(is_gatherable);

CREATE INDEX ix_materials_is_lootable
    ON materials(is_lootable);

-- =====================================================
-- FILE: 008_unique_templates.sql
-- =====================================================

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

-- =====================================================
-- FILE: 009_set_templates.sql
-- =====================================================

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

-- =====================================================
-- FILE: 010_monster_families.sql
-- =====================================================

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

-- =====================================================
-- FILE: 011_monsters.sql
-- =====================================================

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

-- =====================================================
-- FILE: 012_bosses.sql
-- =====================================================

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

-- =====================================================
-- FILE: 013_daily_boss_definitions.sql
-- =====================================================

-- =====================================================
-- 013_daily_boss_definitions.sql
-- Requires: bosses
-- =====================================================

CREATE TABLE daily_boss_definitions (
    daily_boss_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,

    tier INTEGER NOT NULL,
    recommended_level INTEGER NOT NULL,
    attempts_per_day INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_definitions_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(boss_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_daily_boss_definitions_boss_id UNIQUE (boss_id),
    CONSTRAINT chk_daily_boss_definitions_tier CHECK (tier BETWEEN 1 AND 3),
    CONSTRAINT chk_daily_boss_definitions_recommended_level
        CHECK (recommended_level >= 1),
    CONSTRAINT chk_daily_boss_definitions_attempts
        CHECK (attempts_per_day >= 1)
);

CREATE INDEX ix_daily_boss_definitions_tier
    ON daily_boss_definitions(tier);

-- =====================================================
-- FILE: 014_daily_boss_pools.sql
-- =====================================================

-- =====================================================
-- 014_daily_boss_pools.sql
-- Requires: daily_boss_definitions
-- =====================================================

CREATE TABLE daily_boss_pools (
    daily_boss_pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_boss_definition_id UUID NOT NULL,

    tier INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_pools_definition
        FOREIGN KEY (daily_boss_definition_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_daily_boss_pools_tier_definition
        UNIQUE (tier, daily_boss_definition_id),

    CONSTRAINT chk_daily_boss_pools_tier CHECK (tier BETWEEN 1 AND 3)
);

CREATE INDEX ix_daily_boss_pools_tier
    ON daily_boss_pools(tier);

CREATE INDEX ix_daily_boss_pools_definition_id
    ON daily_boss_pools(daily_boss_definition_id);

CREATE INDEX ix_daily_boss_pools_active_tier
    ON daily_boss_pools(tier)
    WHERE is_active = TRUE;

-- =====================================================
-- FILE: 015_daily_boss_rotation.sql
-- =====================================================

-- =====================================================
-- 015_daily_boss_rotation.sql
-- Requires: daily_boss_definitions
-- =====================================================

CREATE TABLE daily_boss_rotation (
    daily_boss_rotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tier_1_boss_id UUID NOT NULL,
    tier_2_boss_id UUID NOT NULL,
    tier_3_boss_id UUID NOT NULL,

    reset_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_rotation_tier_1
        FOREIGN KEY (tier_1_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_daily_boss_rotation_tier_2
        FOREIGN KEY (tier_2_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_daily_boss_rotation_tier_3
        FOREIGN KEY (tier_3_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_daily_boss_rotation_distinct
        CHECK (
            tier_1_boss_id <> tier_2_boss_id
            AND tier_1_boss_id <> tier_3_boss_id
            AND tier_2_boss_id <> tier_3_boss_id
        )
);

CREATE INDEX ix_daily_boss_rotation_reset_timestamp
    ON daily_boss_rotation(reset_timestamp);

-- =====================================================
-- FILE: 016_account_sessions.sql
-- =====================================================

-- =====================================================
-- 016_account_sessions.sql
-- Requires: accounts
-- =====================================================

CREATE TABLE account_sessions (
    account_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,

    session_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT NULL,

    ip_address INET NULL,
    user_agent TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_account_sessions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_account_sessions_session_token_hash
        UNIQUE (session_token_hash),

    CONSTRAINT ux_account_sessions_refresh_token_hash
        UNIQUE (refresh_token_hash),

    CONSTRAINT chk_account_sessions_expiration
        CHECK (expires_at > created_at),

    CONSTRAINT chk_account_sessions_activity
        CHECK (last_activity_at >= created_at),

    CONSTRAINT chk_account_sessions_revocation
        CHECK (
            (is_revoked = FALSE AND revoked_at IS NULL)
            OR
            (is_revoked = TRUE AND revoked_at IS NOT NULL AND revoked_at >= created_at)
        )
);

CREATE INDEX ix_account_sessions_account_id
    ON account_sessions(account_id);

CREATE INDEX ix_account_sessions_expires_at
    ON account_sessions(expires_at);

CREATE INDEX ix_account_sessions_last_activity_at
    ON account_sessions(last_activity_at);

CREATE INDEX ix_account_sessions_is_revoked
    ON account_sessions(is_revoked);

-- =====================================================
-- FILE: 017_item_bases.sql
-- =====================================================

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

-- =====================================================
-- FILE: 018_affix_templates.sql
-- =====================================================

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

-- =====================================================
-- FILE: 019_items.sql
-- =====================================================

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

-- =====================================================
-- FILE: 020_characters.sql
-- =====================================================

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

-- =====================================================
-- FILE: 021_achievement_progress.sql
-- =====================================================

-- =====================================================
-- 021_achievement_progress.sql
-- Requires: accounts, achievements
-- =====================================================

CREATE TABLE achievement_progress (
    achievement_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL,
    achievement_id UUID NOT NULL,

    current_value BIGINT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_achievement_progress_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_achievement_progress_achievement
        FOREIGN KEY (achievement_id)
        REFERENCES achievements(achievement_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_achievement_progress_account_achievement
        UNIQUE (account_id, achievement_id),

    CONSTRAINT chk_achievement_progress_current_value
        CHECK (current_value >= 0),

    CONSTRAINT chk_achievement_progress_completion
        CHECK (
            (is_completed = FALSE AND completed_at IS NULL)
            OR
            (is_completed = TRUE AND completed_at IS NOT NULL)
        )
);

CREATE INDEX ix_achievement_progress_account_id
    ON achievement_progress(account_id);

CREATE INDEX ix_achievement_progress_achievement_id
    ON achievement_progress(achievement_id);

CREATE INDEX ix_achievement_progress_is_completed
    ON achievement_progress(is_completed);

-- =====================================================
-- FILE: 022_character_unlocks.sql
-- =====================================================

-- =====================================================
-- 022_character_unlocks.sql
-- Requires: characters
-- =====================================================

CREATE TABLE character_unlocks (
    character_unlocks_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
    spell_slots_unlocked INTEGER NOT NULL DEFAULT 1,
    crafting_slots_unlocked INTEGER NOT NULL DEFAULT 1,
    inventory_slots INTEGER NOT NULL DEFAULT 50,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_unlocks_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_unlocks_character_id
        UNIQUE (character_id),

    CONSTRAINT chk_character_unlocks_spell_slots
        CHECK (spell_slots_unlocked BETWEEN 1 AND 3),

    CONSTRAINT chk_character_unlocks_crafting_slots
        CHECK (crafting_slots_unlocked BETWEEN 1 AND 3),

    CONSTRAINT chk_character_unlocks_inventory_slots
        CHECK (inventory_slots IN (50, 100))
);

-- =====================================================
-- FILE: 023_character_spell_mastery.sql
-- =====================================================

-- =====================================================
-- 023_character_spell_mastery.sql
-- Requires: characters
-- =====================================================

CREATE TABLE character_spell_mastery (
    character_spell_mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    mastery_level INTEGER NOT NULL DEFAULT 1,
    mastery_experience BIGINT NOT NULL DEFAULT 0,
    current_spell_power NUMERIC(8, 4) NOT NULL DEFAULT 100.0000,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_spell_mastery_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_character_spell_mastery_character_id
        UNIQUE (character_id),

    CONSTRAINT chk_character_spell_mastery_level
        CHECK (mastery_level >= 1),

    CONSTRAINT chk_character_spell_mastery_experience
        CHECK (mastery_experience >= 0),

    CONSTRAINT chk_character_spell_mastery_power
        CHECK (current_spell_power >= 100)
);

-- =====================================================
-- FILE: 024_character_spells.sql
-- =====================================================

-- =====================================================
-- 024_character_spells.sql
-- Requires: characters, spells
-- =====================================================

CREATE TABLE character_spells (
    character_spell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,
    spell_id UUID NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_spells_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_spells_spell
        FOREIGN KEY (spell_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_spells_character_spell
        UNIQUE (character_id, spell_id)
);

CREATE INDEX ix_character_spells_character_id
    ON character_spells(character_id);

CREATE INDEX ix_character_spells_spell_id
    ON character_spells(spell_id);

-- =====================================================
-- FILE: 025_character_loadouts.sql
-- =====================================================

-- =====================================================
-- 025_character_loadouts.sql
-- Requires: characters, spells
-- =====================================================

CREATE TABLE character_loadouts (
    character_loadout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    name VARCHAR(50) NOT NULL,

    spell_1_id UUID NULL,
    spell_2_id UUID NULL,
    spell_3_id UUID NULL,

    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_loadouts_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_loadouts_spell_1
        FOREIGN KEY (spell_1_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_character_loadouts_spell_2
        FOREIGN KEY (spell_2_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_character_loadouts_spell_3
        FOREIGN KEY (spell_3_id)
        REFERENCES spells(spell_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_loadouts_character_name
        UNIQUE (character_id, name),

    CONSTRAINT chk_character_loadouts_distinct_spells
        CHECK (
            (spell_1_id IS NULL OR spell_2_id IS NULL OR spell_1_id <> spell_2_id)
            AND
            (spell_1_id IS NULL OR spell_3_id IS NULL OR spell_1_id <> spell_3_id)
            AND
            (spell_2_id IS NULL OR spell_3_id IS NULL OR spell_2_id <> spell_3_id)
        ),

    CONSTRAINT chk_character_loadouts_spell_order
        CHECK (
            (spell_2_id IS NULL OR spell_1_id IS NOT NULL)
            AND
            (spell_3_id IS NULL OR spell_2_id IS NOT NULL)
        )
);

CREATE INDEX ix_character_loadouts_character_id
    ON character_loadouts(character_id);

CREATE UNIQUE INDEX ux_character_loadouts_default
    ON character_loadouts(character_id)
    WHERE is_default = TRUE;

-- =====================================================
-- FILE: 026_character_cooldowns.sql
-- =====================================================

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

-- =====================================================
-- FILE: 027_character_statistics.sql
-- =====================================================

-- =====================================================
-- 027_character_statistics.sql
-- Requires: characters, monsters, bosses
-- =====================================================

CREATE TABLE character_statistics (
    character_statistics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    total_playtime_seconds BIGINT NOT NULL DEFAULT 0,
    total_gold_earned BIGINT NOT NULL DEFAULT 0,
    total_gold_spent BIGINT NOT NULL DEFAULT 0,
    highest_gold_owned BIGINT NOT NULL DEFAULT 0,
    total_monsters_killed BIGINT NOT NULL DEFAULT 0,
    total_bosses_killed BIGINT NOT NULL DEFAULT 0,
    total_daily_bosses_killed BIGINT NOT NULL DEFAULT 0,
    total_deaths BIGINT NOT NULL DEFAULT 0,
    total_damage_dealt BIGINT NOT NULL DEFAULT 0,
    total_damage_taken BIGINT NOT NULL DEFAULT 0,
    total_healing_done BIGINT NOT NULL DEFAULT 0,
    total_mana_spent BIGINT NOT NULL DEFAULT 0,
    highest_physical_hit BIGINT NOT NULL DEFAULT 0,
    highest_spell_hit BIGINT NOT NULL DEFAULT 0,
    strongest_monster_killed_id UUID NULL,
    strongest_boss_killed_id UUID NULL,
    longest_no_death_streak BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_statistics_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_statistics_strongest_monster
        FOREIGN KEY (strongest_monster_killed_id)
        REFERENCES monsters(monster_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_character_statistics_strongest_boss
        FOREIGN KEY (strongest_boss_killed_id)
        REFERENCES bosses(boss_id)
        ON DELETE SET NULL,

    CONSTRAINT ux_character_statistics_character_id UNIQUE (character_id),

    CONSTRAINT chk_character_statistics_nonnegative
        CHECK (
            total_playtime_seconds >= 0 AND total_gold_earned >= 0
            AND total_gold_spent >= 0 AND highest_gold_owned >= 0
            AND total_monsters_killed >= 0 AND total_bosses_killed >= 0
            AND total_daily_bosses_killed >= 0 AND total_deaths >= 0
            AND total_damage_dealt >= 0 AND total_damage_taken >= 0
            AND total_healing_done >= 0 AND total_mana_spent >= 0
            AND highest_physical_hit >= 0 AND highest_spell_hit >= 0
            AND longest_no_death_streak >= 0
        ),

    CONSTRAINT chk_character_statistics_kill_totals
        CHECK (
            total_bosses_killed <= total_monsters_killed
            AND total_daily_bosses_killed <= total_bosses_killed
        )
);

CREATE INDEX ix_character_statistics_strongest_monster
    ON character_statistics(strongest_monster_killed_id);

CREATE INDEX ix_character_statistics_strongest_boss
    ON character_statistics(strongest_boss_killed_id);

-- =====================================================
-- FILE: 028_character_buffs.sql
-- =====================================================

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

-- =====================================================
-- FILE: 029_inventory_items.sql
-- =====================================================

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

-- =====================================================
-- FILE: 030_material_storage.sql
-- =====================================================

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

-- =====================================================
-- FILE: 031_consumable_storage.sql
-- =====================================================

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

-- =====================================================
-- FILE: 032_equipment_loadouts.sql
-- =====================================================

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

-- =====================================================
-- FILE: 033_item_affixes.sql
-- =====================================================

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

-- =====================================================
-- FILE: 034_set_bonuses.sql
-- =====================================================

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

-- =====================================================
-- FILE: 035_bestiary_entries.sql
-- =====================================================

-- =====================================================
-- 035_bestiary_entries.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE bestiary_entries (
    bestiary_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    monster_id UUID NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bestiary_entries_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_bestiary_entries_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT ux_bestiary_entries_character_monster UNIQUE (character_id, monster_id)
);

CREATE INDEX ix_bestiary_entries_character_id ON bestiary_entries(character_id);
CREATE INDEX ix_bestiary_entries_monster_id ON bestiary_entries(monster_id);

-- =====================================================
-- FILE: 036_bestiary_statistics.sql
-- =====================================================

-- =====================================================
-- 036_bestiary_statistics.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE bestiary_statistics (
    bestiary_statistics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    monster_id UUID NOT NULL,
    kill_count BIGINT NOT NULL DEFAULT 1,
    first_kill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_kill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    task_progress BIGINT NOT NULL DEFAULT 0,
    task_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bestiary_statistics_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_bestiary_statistics_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT ux_bestiary_statistics_character_monster UNIQUE (character_id, monster_id),
    CONSTRAINT chk_bestiary_statistics_kill_count CHECK (kill_count >= 1),
    CONSTRAINT chk_bestiary_statistics_task_progress CHECK (task_progress >= 0),
    CONSTRAINT chk_bestiary_statistics_dates CHECK (last_kill_at >= first_kill_at)
);

CREATE INDEX ix_bestiary_statistics_character_id ON bestiary_statistics(character_id);
CREATE INDEX ix_bestiary_statistics_monster_id ON bestiary_statistics(monster_id);
CREATE INDEX ix_bestiary_statistics_kill_count ON bestiary_statistics(kill_count);

-- =====================================================
-- FILE: 037_character_daily_boss_progress.sql
-- =====================================================

-- =====================================================
-- 037_character_daily_boss_progress.sql
-- Requires: characters, daily_boss_definitions
-- =====================================================

CREATE TABLE character_daily_boss_progress (
    character_daily_boss_progress_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,
    daily_boss_definition_id UUID NOT NULL,

    attempts_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attempts_used_today INTEGER NOT NULL DEFAULT 0,

    total_attempts BIGINT NOT NULL DEFAULT 0,
    total_victories BIGINT NOT NULL DEFAULT 0,

    last_attempt_at TIMESTAMPTZ NULL,
    last_victory_at TIMESTAMPTZ NULL,

    highest_tier_defeated INTEGER NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_daily_boss_progress_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_daily_boss_progress_definition
        FOREIGN KEY (daily_boss_definition_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_daily_boss_progress
        UNIQUE (
            character_id,
            daily_boss_definition_id
        ),

    CONSTRAINT chk_character_daily_boss_attempts_today
        CHECK (attempts_used_today >= 0),

    CONSTRAINT chk_character_daily_boss_totals
        CHECK (
            total_attempts >= 0
            AND total_victories >= 0
            AND total_victories <= total_attempts
        ),

    CONSTRAINT chk_character_daily_boss_highest_tier
        CHECK (
            highest_tier_defeated IS NULL
            OR highest_tier_defeated BETWEEN 1 AND 3
        ),

    CONSTRAINT chk_character_daily_boss_last_victory
        CHECK (
            last_victory_at IS NULL
            OR (
                last_attempt_at IS NOT NULL
                AND last_victory_at <= last_attempt_at
            )
        )
);

CREATE INDEX ix_character_daily_boss_progress_character_id
    ON character_daily_boss_progress(character_id);

CREATE INDEX ix_character_daily_boss_progress_definition_id
    ON character_daily_boss_progress(daily_boss_definition_id);

CREATE INDEX ix_character_daily_boss_progress_attempts_date
    ON character_daily_boss_progress(attempts_date);

-- =====================================================
-- FILE: 038_monster_tasks.sql
-- =====================================================

-- =====================================================
-- 038_monster_tasks.sql
-- Requires: monsters, bosses
-- =====================================================

CREATE TABLE monster_tasks (
    monster_task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,
    boss_id UUID NOT NULL,
    required_kills BIGINT NOT NULL,
    reunlock_gold_cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_tasks_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT fk_monster_tasks_boss
        FOREIGN KEY (boss_id) REFERENCES bosses(boss_id) ON DELETE RESTRICT,
    CONSTRAINT ux_monster_tasks_monster_id UNIQUE (monster_id),
    CONSTRAINT chk_monster_tasks_required_kills CHECK (required_kills > 0),
    CONSTRAINT chk_monster_tasks_reunlock_gold_cost CHECK (reunlock_gold_cost >= 0)
);

CREATE INDEX ix_monster_tasks_boss_id ON monster_tasks(boss_id);

-- =====================================================
-- FILE: 039_monster_abilities.sql
-- =====================================================

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

-- =====================================================
-- FILE: 040_monster_ability_weights.sql
-- =====================================================

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

-- =====================================================
-- FILE: 041_chest_definitions.sql
-- =====================================================

-- 041_chest_definitions.sql
CREATE TABLE chest_definitions (
 chest_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(32) NOT NULL UNIQUE,
 cooldown_seconds INTEGER NOT NULL,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT chk_chest_definitions_name CHECK (name IN ('HourlyChest','DailyChest')),
 CONSTRAINT chk_chest_definitions_cooldown CHECK (cooldown_seconds > 0)
);
CREATE INDEX ix_chest_definitions_is_enabled ON chest_definitions(is_enabled);

-- =====================================================
-- FILE: 042_chest_reward_definitions.sql
-- =====================================================

-- 042_chest_reward_definitions.sql
-- Requires: chest_definitions
CREATE TABLE chest_reward_definitions (
 chest_reward_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 chest_definition_id UUID NOT NULL,
 reward_type VARCHAR(32) NOT NULL,
 min_quantity INTEGER NOT NULL DEFAULT 1,
 max_quantity INTEGER NOT NULL DEFAULT 1,
 chance_percent NUMERIC(7,4) NOT NULL,
 minimum_character_level INTEGER NOT NULL DEFAULT 1,
 maximum_character_level INTEGER NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_chest_reward_definitions_chest FOREIGN KEY (chest_definition_id) REFERENCES chest_definitions(chest_definition_id) ON DELETE CASCADE,
 CONSTRAINT chk_chest_reward_definitions_type CHECK (reward_type IN ('Gold','Item','Material','Consumable','Blessing','ProtectionStone','UniqueRoll','SetRoll')),
 CONSTRAINT chk_chest_reward_definitions_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity),
 CONSTRAINT chk_chest_reward_definitions_chance CHECK (chance_percent > 0 AND chance_percent <= 100),
 CONSTRAINT chk_chest_reward_definitions_levels CHECK (minimum_character_level >= 1 AND (maximum_character_level IS NULL OR maximum_character_level >= minimum_character_level))
);
CREATE INDEX ix_chest_reward_definitions_chest_id ON chest_reward_definitions(chest_definition_id);
CREATE INDEX ix_chest_reward_definitions_reward_type ON chest_reward_definitions(reward_type);
CREATE INDEX ix_chest_reward_definitions_level_range ON chest_reward_definitions(minimum_character_level,maximum_character_level);

-- =====================================================
-- FILE: 043_daily_chest_progress.sql
-- =====================================================

-- 043_daily_chest_progress.sql
-- Requires: characters
CREATE TABLE daily_chest_progress (
 daily_chest_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 next_available_at TIMESTAMPTZ NOT NULL,
 is_available BOOLEAN NOT NULL DEFAULT FALSE,
 last_claimed_at TIMESTAMPTZ NULL,
 total_claims BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_daily_chest_progress_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_daily_chest_progress_claims CHECK (total_claims >= 0),
 CONSTRAINT chk_daily_chest_progress_claim_state CHECK ((total_claims = 0 AND last_claimed_at IS NULL) OR (total_claims > 0 AND last_claimed_at IS NOT NULL))
);
CREATE INDEX ix_daily_chest_progress_next_available_at ON daily_chest_progress(next_available_at);
CREATE INDEX ix_daily_chest_progress_is_available ON daily_chest_progress(is_available);

-- =====================================================
-- FILE: 044_hourly_chest_progress.sql
-- =====================================================

-- 044_hourly_chest_progress.sql
-- Requires: characters
CREATE TABLE hourly_chest_progress (
 hourly_chest_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 next_available_at TIMESTAMPTZ NOT NULL,
 is_available BOOLEAN NOT NULL DEFAULT FALSE,
 last_claimed_at TIMESTAMPTZ NULL,
 total_claims BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_hourly_chest_progress_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_hourly_chest_progress_claims CHECK (total_claims >= 0),
 CONSTRAINT chk_hourly_chest_progress_claim_state CHECK ((total_claims = 0 AND last_claimed_at IS NULL) OR (total_claims > 0 AND last_claimed_at IS NOT NULL))
);
CREATE INDEX ix_hourly_chest_progress_next_available_at ON hourly_chest_progress(next_available_at);
CREATE INDEX ix_hourly_chest_progress_is_available ON hourly_chest_progress(is_available);

-- =====================================================
-- FILE: 045_login_streak_progress.sql
-- =====================================================

-- 045_login_streak_progress.sql
-- Requires: characters
CREATE TABLE login_streak_progress (
 login_streak_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL UNIQUE,
 current_streak INTEGER NOT NULL DEFAULT 0,
 highest_streak INTEGER NOT NULL DEFAULT 0,
 last_login_date DATE NULL,
 last_reward_day INTEGER NOT NULL DEFAULT 0,
 completed_cycles BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_login_streak_progress_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_login_streak_progress_current CHECK (current_streak BETWEEN 0 AND 7),
 CONSTRAINT chk_login_streak_progress_highest CHECK (highest_streak BETWEEN 0 AND 7 AND highest_streak >= current_streak),
 CONSTRAINT chk_login_streak_progress_reward_day CHECK (last_reward_day BETWEEN 0 AND 7),
 CONSTRAINT chk_login_streak_progress_cycles CHECK (completed_cycles >= 0)
);
CREATE INDEX ix_login_streak_progress_current_streak ON login_streak_progress(current_streak);
CREATE INDEX ix_login_streak_progress_last_login_date ON login_streak_progress(last_login_date);

-- =====================================================
-- FILE: 046_combat_sessions.sql
-- =====================================================

-- 046_combat_sessions.sql
-- Requires: characters, monsters
CREATE TABLE combat_sessions (
 combat_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 monster_id UUID NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 current_turn INTEGER NOT NULL DEFAULT 1,
 character_health BIGINT NOT NULL,
 character_mana BIGINT NOT NULL,
 monster_health BIGINT NOT NULL,
 started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 ended_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_sessions_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_sessions_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_sessions_status CHECK (status IN ('Active','Victory','Defeat','Abandoned')),
 CONSTRAINT chk_combat_sessions_turn CHECK (current_turn >= 1),
 CONSTRAINT chk_combat_sessions_resources CHECK (character_health >= 0 AND character_mana >= 0 AND monster_health >= 0),
 CONSTRAINT chk_combat_sessions_end_state CHECK ((status = 'Active' AND ended_at IS NULL) OR (status <> 'Active' AND ended_at IS NOT NULL AND ended_at >= started_at))
);
CREATE UNIQUE INDEX ux_combat_sessions_active_character ON combat_sessions(character_id) WHERE status = 'Active';
CREATE INDEX ix_combat_sessions_character_id ON combat_sessions(character_id);
CREATE INDEX ix_combat_sessions_monster_id ON combat_sessions(monster_id);
CREATE INDEX ix_combat_sessions_status ON combat_sessions(status);

-- =====================================================
-- FILE: 047_combat_effects.sql
-- =====================================================

-- 047_combat_effects.sql
-- Requires: combat_sessions, spells, consumable_definitions
CREATE TABLE combat_effects (
 combat_effect_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 combat_session_id UUID NOT NULL,
 effect_type VARCHAR(32) NOT NULL,
 target_type VARCHAR(20) NOT NULL,
 source_type VARCHAR(20) NOT NULL,
 spell_id UUID NULL,
 consumable_definition_id UUID NULL,
 value NUMERIC(12,4) NOT NULL,
 remaining_turns INTEGER NOT NULL,
 applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_effects_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_effects_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
 CONSTRAINT fk_combat_effects_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_effects_type CHECK (effect_type IN ('DamageOverTime','HealOverTime','AttackBuff','DefenseBuff','SpellPowerBuff','AttackDebuff','DefenseDebuff','SpellPowerDebuff','ManaDrain','HealthDrain','PotionDisable')),
 CONSTRAINT chk_combat_effects_target CHECK (target_type IN ('Character','Monster')),
 CONSTRAINT chk_combat_effects_source_type CHECK (source_type IN ('Spell','Consumable','System')),
 CONSTRAINT chk_combat_effects_source CHECK ((source_type='Spell' AND spell_id IS NOT NULL AND consumable_definition_id IS NULL) OR (source_type='Consumable' AND consumable_definition_id IS NOT NULL AND spell_id IS NULL) OR (source_type='System' AND spell_id IS NULL AND consumable_definition_id IS NULL)),
 CONSTRAINT chk_combat_effects_turns CHECK (remaining_turns >= 0),
 CONSTRAINT ux_combat_effects_session_type_target UNIQUE (combat_session_id,effect_type,target_type)
);
CREATE INDEX ix_combat_effects_session_id ON combat_effects(combat_session_id);
CREATE INDEX ix_combat_effects_effect_type ON combat_effects(effect_type);
CREATE INDEX ix_combat_effects_target_type ON combat_effects(target_type);

-- =====================================================
-- FILE: 048_combat_spell_cooldowns.sql
-- =====================================================

-- 048_combat_spell_cooldowns.sql
-- Requires: combat_sessions, spells
CREATE TABLE combat_spell_cooldowns (
 combat_spell_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 combat_session_id UUID NOT NULL,
 spell_id UUID NOT NULL,
 remaining_turns INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_spell_cooldowns_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_spell_cooldowns_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
 CONSTRAINT ux_combat_spell_cooldowns_session_spell UNIQUE (combat_session_id,spell_id),
 CONSTRAINT chk_combat_spell_cooldowns_turns CHECK (remaining_turns >= 0)
);
CREATE INDEX ix_combat_spell_cooldowns_session_id ON combat_spell_cooldowns(combat_session_id);
CREATE INDEX ix_combat_spell_cooldowns_spell_id ON combat_spell_cooldowns(spell_id);

-- =====================================================
-- FILE: 049_combat_logs.sql
-- =====================================================

-- 049_combat_logs.sql
-- Requires: combat_sessions, characters, monsters
CREATE TABLE combat_logs (
 combat_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 combat_session_id UUID NOT NULL UNIQUE,
 character_id UUID NOT NULL,
 monster_id UUID NOT NULL,
 combat_result VARCHAR(20) NOT NULL,
 turn_count INTEGER NOT NULL,
 started_at TIMESTAMPTZ NOT NULL,
 ended_at TIMESTAMPTZ NOT NULL,
 combat_data_json JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_logs_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE RESTRICT,
 CONSTRAINT fk_combat_logs_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_logs_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_logs_result CHECK (combat_result IN ('Victory','Defeat')),
 CONSTRAINT chk_combat_logs_turn_count CHECK (turn_count >= 1),
 CONSTRAINT chk_combat_logs_dates CHECK (ended_at >= started_at)
);
CREATE INDEX ix_combat_logs_character_id ON combat_logs(character_id);
CREATE INDEX ix_combat_logs_monster_id ON combat_logs(monster_id);
CREATE INDEX ix_combat_logs_created_at ON combat_logs(created_at);

-- =====================================================
-- FILE: 050_recipes.sql
-- =====================================================

-- 050_recipes.sql
-- Requires: consumable_definitions
CREATE TABLE recipes (
 recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 category VARCHAR(20) NOT NULL,
 consumable_definition_id UUID NOT NULL,
 required_crafting_level INTEGER NOT NULL DEFAULT 1,
 required_character_level INTEGER NOT NULL DEFAULT 1,
 gold_cost BIGINT NOT NULL DEFAULT 0,
 crafting_time_seconds INTEGER NOT NULL,
 crafting_xp_reward BIGINT NOT NULL DEFAULT 0,
 output_quantity INTEGER NOT NULL DEFAULT 1,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_recipes_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_recipes_category CHECK (category IN ('Potion','Blessing','Upgrade','Boost')),
 CONSTRAINT chk_recipes_levels CHECK (required_crafting_level >= 1 AND required_character_level >= 1),
 CONSTRAINT chk_recipes_gold_cost CHECK (gold_cost >= 0),
 CONSTRAINT chk_recipes_time CHECK (crafting_time_seconds > 0),
 CONSTRAINT chk_recipes_xp CHECK (crafting_xp_reward >= 0),
 CONSTRAINT chk_recipes_output CHECK (output_quantity >= 1)
);
CREATE INDEX ix_recipes_category ON recipes(category);
CREATE INDEX ix_recipes_required_crafting_level ON recipes(required_crafting_level);

-- =====================================================
-- FILE: 051_recipe_materials.sql
-- =====================================================

-- 051_recipe_materials.sql
-- Requires: recipes, materials
CREATE TABLE recipe_materials (
 recipe_material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 recipe_id UUID NOT NULL,
 material_id UUID NOT NULL,
 required_quantity BIGINT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_recipe_materials_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
 CONSTRAINT fk_recipe_materials_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT ux_recipe_materials_recipe_material UNIQUE (recipe_id,material_id),
 CONSTRAINT chk_recipe_materials_quantity CHECK (required_quantity > 0)
);
CREATE INDEX ix_recipe_materials_recipe_id ON recipe_materials(recipe_id);
CREATE INDEX ix_recipe_materials_material_id ON recipe_materials(material_id);

-- =====================================================
-- FILE: 052_crafting_queue.sql
-- =====================================================

-- 052_crafting_queue.sql
-- Requires: characters, recipes
CREATE TABLE crafting_queue (
 crafting_queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 recipe_id UUID NOT NULL,
 quantity INTEGER NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Pending',
 started_at TIMESTAMPTZ NULL,
 completes_at TIMESTAMPTZ NOT NULL,
 crafting_slot INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_crafting_queue_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_crafting_queue_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE RESTRICT,
 CONSTRAINT chk_crafting_queue_quantity CHECK (quantity > 0),
 CONSTRAINT chk_crafting_queue_status CHECK (status IN ('Pending','Active','Completed','Cancelled')),
 CONSTRAINT chk_crafting_queue_slot CHECK (crafting_slot BETWEEN 1 AND 3),
 CONSTRAINT chk_crafting_queue_dates CHECK ((started_at IS NULL AND status IN ('Pending','Cancelled')) OR (started_at IS NOT NULL AND completes_at > started_at))
);
CREATE INDEX ix_crafting_queue_character_id ON crafting_queue(character_id);
CREATE INDEX ix_crafting_queue_status ON crafting_queue(status);
CREATE INDEX ix_crafting_queue_completes_at ON crafting_queue(completes_at);
CREATE UNIQUE INDEX ux_crafting_queue_active_slot ON crafting_queue(character_id,crafting_slot) WHERE status IN ('Pending','Active');

-- =====================================================
-- FILE: 053_crafting_history.sql
-- =====================================================

-- 053_crafting_history.sql
-- Requires: characters, recipes
CREATE TABLE crafting_history (
 crafting_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 recipe_id UUID NOT NULL,
 quantity_crafted INTEGER NOT NULL,
 crafting_xp_earned BIGINT NOT NULL DEFAULT 0,
 completed_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_crafting_history_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_crafting_history_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE RESTRICT,
 CONSTRAINT chk_crafting_history_quantity CHECK (quantity_crafted > 0),
 CONSTRAINT chk_crafting_history_xp CHECK (crafting_xp_earned >= 0)
);
CREATE INDEX ix_crafting_history_character_id ON crafting_history(character_id);
CREATE INDEX ix_crafting_history_recipe_id ON crafting_history(recipe_id);
CREATE INDEX ix_crafting_history_completed_at ON crafting_history(completed_at);

-- =====================================================
-- FILE: 054_gathering_sessions.sql
-- =====================================================

-- 054_gathering_sessions.sql
-- Requires: characters
CREATE TABLE gathering_sessions (
 gathering_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 ended_at TIMESTAMPTZ NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 gathering_level_at_start INTEGER NOT NULL,
 total_minutes_gathered INTEGER NOT NULL DEFAULT 0,
 experience_earned BIGINT NOT NULL DEFAULT 0,
 results_collected BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_gathering_sessions_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT chk_gathering_sessions_status CHECK (status IN ('Active','Completed','Cancelled')),
 CONSTRAINT chk_gathering_sessions_level CHECK (gathering_level_at_start >= 1),
 CONSTRAINT chk_gathering_sessions_minutes CHECK (total_minutes_gathered BETWEEN 0 AND 1440),
 CONSTRAINT chk_gathering_sessions_xp CHECK (experience_earned >= 0),
 CONSTRAINT chk_gathering_sessions_end_state CHECK ((status='Active' AND ended_at IS NULL) OR (status<>'Active' AND ended_at IS NOT NULL AND ended_at >= started_at))
);
CREATE UNIQUE INDEX ux_gathering_sessions_active_character ON gathering_sessions(character_id) WHERE status='Active';
CREATE INDEX ix_gathering_sessions_character_id ON gathering_sessions(character_id);
CREATE INDEX ix_gathering_sessions_status ON gathering_sessions(status);
CREATE INDEX ix_gathering_sessions_started_at ON gathering_sessions(started_at);

-- =====================================================
-- FILE: 055_gathering_results.sql
-- =====================================================

-- 055_gathering_results.sql
-- Requires: gathering_sessions, materials
CREATE TABLE gathering_results (
 gathering_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 gathering_session_id UUID NOT NULL,
 material_id UUID NOT NULL,
 quantity BIGINT NOT NULL,
 successful_rolls INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_gathering_results_session FOREIGN KEY (gathering_session_id) REFERENCES gathering_sessions(gathering_session_id) ON DELETE CASCADE,
 CONSTRAINT fk_gathering_results_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT ux_gathering_results_session_material UNIQUE (gathering_session_id,material_id),
 CONSTRAINT chk_gathering_results_quantity CHECK (quantity > 0),
 CONSTRAINT chk_gathering_results_rolls CHECK (successful_rolls > 0)
);
CREATE INDEX ix_gathering_results_session_id ON gathering_results(gathering_session_id);
CREATE INDEX ix_gathering_results_material_id ON gathering_results(material_id);

-- =====================================================
-- FILE: 056_loot_tables.sql
-- =====================================================

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

-- =====================================================
-- FILE: 057_other_loot_tables.sql
-- =====================================================

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

-- =====================================================
-- FILE: 058_unique_pity_tracking.sql
-- =====================================================

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

-- =====================================================
-- FILE: 059_holy_grail_entries.sql
-- =====================================================

-- 059_holy_grail_entries.sql
-- Requires: accounts, unique_templates, set_templates, characters, seasons
CREATE TABLE holy_grail_entries (
 holy_grail_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 unique_template_id UUID NULL,
 set_template_id UUID NULL,
 found_by_character_id UUID NULL,
 found_season_id UUID NULL,
 first_found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_holy_grail_entries_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_holy_grail_entries_unique FOREIGN KEY (unique_template_id) REFERENCES unique_templates(unique_template_id) ON DELETE RESTRICT,
 CONSTRAINT fk_holy_grail_entries_set FOREIGN KEY (set_template_id) REFERENCES set_templates(set_template_id) ON DELETE RESTRICT,
 CONSTRAINT fk_holy_grail_entries_character FOREIGN KEY (found_by_character_id) REFERENCES characters(character_id) ON DELETE SET NULL,
 CONSTRAINT fk_holy_grail_entries_season FOREIGN KEY (found_season_id) REFERENCES seasons(season_id) ON DELETE SET NULL,
 CONSTRAINT chk_holy_grail_entries_target CHECK ((unique_template_id IS NOT NULL)::integer + (set_template_id IS NOT NULL)::integer = 1)
);
CREATE UNIQUE INDEX ux_holy_grail_entries_account_unique ON holy_grail_entries(account_id,unique_template_id) WHERE unique_template_id IS NOT NULL;
CREATE UNIQUE INDEX ux_holy_grail_entries_account_set ON holy_grail_entries(account_id,set_template_id) WHERE set_template_id IS NOT NULL;
CREATE INDEX ix_holy_grail_entries_account_id ON holy_grail_entries(account_id);
CREATE INDEX ix_holy_grail_entries_unique_id ON holy_grail_entries(unique_template_id);
CREATE INDEX ix_holy_grail_entries_set_id ON holy_grail_entries(set_template_id);

-- =====================================================
-- FILE: 060_set_progress.sql
-- =====================================================

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

-- =====================================================
-- FILE: 061_admin_actions.sql
-- =====================================================

-- 061_admin_actions.sql
-- Requires: accounts
CREATE TABLE admin_actions (
 admin_action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 admin_user VARCHAR(100) NOT NULL,
 action_type VARCHAR(64) NOT NULL,
 account_id UUID NULL,
 target_entity_type VARCHAR(64) NULL,
 target_entity_id UUID NULL,
 reason TEXT NULL,
 action_data JSONB NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_admin_actions_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
 CONSTRAINT chk_admin_actions_target CHECK ((target_entity_type IS NULL AND target_entity_id IS NULL) OR (target_entity_type IS NOT NULL AND target_entity_id IS NOT NULL))
);
CREATE INDEX ix_admin_actions_account_id ON admin_actions(account_id);
CREATE INDEX ix_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX ix_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX ix_admin_actions_target ON admin_actions(target_entity_type,target_entity_id);

-- =====================================================
-- FILE: 062_punishments.sql
-- =====================================================

-- =====================================================
-- 062_punishments.sql
-- Requires: accounts
-- =====================================================

CREATE TABLE punishments (
    punishment_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL,

    punishment_type VARCHAR(32) NOT NULL,

    reason TEXT NOT NULL,
    issued_by VARCHAR(100) NOT NULL,

    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    removed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_punishments_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_punishments_type
        CHECK (
            punishment_type IN (
                'Warning',
                'Mute',
                'TemporaryBan',
                'PermanentBan'
            )
        ),

    CONSTRAINT chk_punishments_expiration_order
        CHECK (
            expires_at IS NULL
            OR expires_at > issued_at
        ),

    CONSTRAINT chk_punishments_expiration_type
        CHECK (
            (
                punishment_type = 'TemporaryBan'
                AND expires_at IS NOT NULL
            )
            OR
            (
                punishment_type = 'PermanentBan'
                AND expires_at IS NULL
            )
            OR
            punishment_type IN (
                'Warning',
                'Mute'
            )
        ),

    CONSTRAINT chk_punishments_removed_at
        CHECK (
            removed_at IS NULL
            OR removed_at >= issued_at
        ),

    CONSTRAINT chk_punishments_active_state
        CHECK (
            is_active = TRUE
            OR removed_at IS NOT NULL
            OR (
                expires_at IS NOT NULL
                AND expires_at <= NOW()
            )
        )
);

CREATE INDEX ix_punishments_account_id
    ON punishments(account_id);

CREATE INDEX ix_punishments_type
    ON punishments(punishment_type);

CREATE INDEX ix_punishments_is_active
    ON punishments(is_active);

CREATE INDEX ix_punishments_expires_at
    ON punishments(expires_at);

-- =====================================================
-- FILE: 063_npc_definitions.sql
-- =====================================================

-- 063_npc_definitions.sql
CREATE TABLE npc_definitions (
 npc_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 artwork TEXT NULL,
 npc_type VARCHAR(32) NOT NULL,
 level_min INTEGER NULL,
 level_max INTEGER NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT chk_npc_definitions_type CHECK (npc_type IN ('Vendor','Healer','BlessingMerchant','PromotionTrainer')),
 CONSTRAINT chk_npc_definitions_levels CHECK ((level_min IS NULL AND level_max IS NULL) OR (level_min IS NOT NULL AND level_min>=1 AND (level_max IS NULL OR level_max>=level_min)))
);
CREATE INDEX ix_npc_definitions_type ON npc_definitions(npc_type);
CREATE INDEX ix_npc_definitions_is_active ON npc_definitions(is_active);

-- =====================================================
-- FILE: 064_outfit_definitions.sql
-- =====================================================

-- 064_outfit_definitions.sql
CREATE TABLE outfit_definitions (
 outfit_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 artwork TEXT NULL,
 category VARCHAR(64) NOT NULL,
 display_order INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT chk_outfit_definitions_display_order CHECK (display_order>=0)
);
CREATE INDEX ix_outfit_definitions_display_order ON outfit_definitions(display_order);
CREATE INDEX ix_outfit_definitions_category ON outfit_definitions(category);

-- =====================================================
-- FILE: 065_addon_definitions.sql
-- =====================================================

-- 065_addon_definitions.sql
-- Requires: outfit_definitions
CREATE TABLE addon_definitions (
 addon_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 outfit_definition_id UUID NOT NULL,
 name VARCHAR(100) NOT NULL,
 description TEXT NOT NULL,
 artwork TEXT NULL,
 display_order INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_addon_definitions_outfit FOREIGN KEY (outfit_definition_id) REFERENCES outfit_definitions(outfit_definition_id) ON DELETE CASCADE,
 CONSTRAINT ux_addon_definitions_outfit_name UNIQUE (outfit_definition_id,name),
 CONSTRAINT chk_addon_definitions_display_order CHECK (display_order>=0)
);
CREATE INDEX ix_addon_definitions_outfit_id ON addon_definitions(outfit_definition_id);
CREATE INDEX ix_addon_definitions_display_order ON addon_definitions(display_order);

-- =====================================================
-- FILE: 066_account_outfits.sql
-- =====================================================

-- 066_account_outfits.sql
-- Requires: accounts, outfit_definitions
CREATE TABLE account_outfits (
 account_outfit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 outfit_definition_id UUID NOT NULL,
 unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_account_outfits_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_account_outfits_outfit FOREIGN KEY (outfit_definition_id) REFERENCES outfit_definitions(outfit_definition_id) ON DELETE RESTRICT,
 CONSTRAINT ux_account_outfits_account_outfit UNIQUE (account_id,outfit_definition_id)
);
CREATE INDEX ix_account_outfits_account_id ON account_outfits(account_id);
CREATE INDEX ix_account_outfits_outfit_id ON account_outfits(outfit_definition_id);

-- =====================================================
-- FILE: 067_account_addons.sql
-- =====================================================

-- 067_account_addons.sql
-- Requires: accounts, addon_definitions
CREATE TABLE account_addons (
 account_addon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 addon_definition_id UUID NOT NULL,
 unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_account_addons_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_account_addons_addon FOREIGN KEY (addon_definition_id) REFERENCES addon_definitions(addon_definition_id) ON DELETE RESTRICT,
 CONSTRAINT ux_account_addons_account_addon UNIQUE (account_id,addon_definition_id)
);
CREATE INDEX ix_account_addons_account_id ON account_addons(account_id);
CREATE INDEX ix_account_addons_addon_id ON account_addons(addon_definition_id);

-- =====================================================
-- FILE: 068_account_friends.sql
-- =====================================================

-- 068_account_friends.sql
-- Requires: accounts
CREATE TABLE account_friends (
 account_friend_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 friend_account_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_account_friends_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_account_friends_friend FOREIGN KEY (friend_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT ux_account_friends_pair UNIQUE (account_id,friend_account_id),
 CONSTRAINT chk_account_friends_not_self CHECK (account_id<>friend_account_id)
);
CREATE INDEX ix_account_friends_account_id ON account_friends(account_id);
CREATE INDEX ix_account_friends_friend_account_id ON account_friends(friend_account_id);

-- =====================================================
-- FILE: 069_friend_requests.sql
-- =====================================================

-- 069_friend_requests.sql
-- Requires: accounts
CREATE TABLE friend_requests (
 friend_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_account_id UUID NOT NULL,
 recipient_account_id UUID NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Pending',
 sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 responded_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_friend_requests_sender FOREIGN KEY (sender_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_friend_requests_recipient FOREIGN KEY (recipient_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT chk_friend_requests_not_self CHECK (sender_account_id<>recipient_account_id),
 CONSTRAINT chk_friend_requests_status CHECK (status IN ('Pending','Accepted','Rejected','Cancelled')),
 CONSTRAINT chk_friend_requests_response CHECK ((status='Pending' AND responded_at IS NULL) OR (status<>'Pending' AND responded_at IS NOT NULL AND responded_at>=sent_at))
);
CREATE UNIQUE INDEX ux_friend_requests_pending_pair ON friend_requests(sender_account_id,recipient_account_id) WHERE status='Pending';
CREATE INDEX ix_friend_requests_sender_id ON friend_requests(sender_account_id);
CREATE INDEX ix_friend_requests_recipient_id ON friend_requests(recipient_account_id);
CREATE INDEX ix_friend_requests_status ON friend_requests(status);

-- =====================================================
-- FILE: 070_private_messages.sql
-- =====================================================

-- 070_private_messages.sql
-- Requires: accounts
CREATE TABLE private_messages (
 private_message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_account_id UUID NOT NULL,
 recipient_account_id UUID NOT NULL,
 subject VARCHAR(200) NOT NULL,
 message_body TEXT NOT NULL,
 is_read BOOLEAN NOT NULL DEFAULT FALSE,
 sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 read_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_private_messages_sender FOREIGN KEY (sender_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_private_messages_recipient FOREIGN KEY (recipient_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT chk_private_messages_not_self CHECK (sender_account_id<>recipient_account_id),
 CONSTRAINT chk_private_messages_read_state CHECK ((is_read=FALSE AND read_at IS NULL) OR (is_read=TRUE AND read_at IS NOT NULL AND read_at>=sent_at))
);
CREATE INDEX ix_private_messages_sender_id ON private_messages(sender_account_id);
CREATE INDEX ix_private_messages_recipient_id ON private_messages(recipient_account_id);
CREATE INDEX ix_private_messages_is_read ON private_messages(is_read);
CREATE INDEX ix_private_messages_sent_at ON private_messages(sent_at);

-- =====================================================
-- FILE: 071_auction_listings.sql
-- =====================================================

-- 071_auction_listings.sql
-- Requires: characters, items, materials, consumable_definitions
CREATE TABLE auction_listings (
 auction_listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 item_id UUID NULL,
 material_id UUID NULL,
 consumable_definition_id UUID NULL,
 quantity BIGINT NOT NULL,
 unit_price BIGINT NOT NULL,
 listing_fee_paid BIGINT NOT NULL DEFAULT 0,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_auction_listings_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_listings_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_listings_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_listings_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_auction_listings_asset CHECK ((item_id IS NOT NULL)::integer + (material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
 CONSTRAINT chk_auction_listings_quantity CHECK (quantity > 0),
 CONSTRAINT chk_auction_listings_unit_price CHECK (unit_price > 0),
 CONSTRAINT chk_auction_listings_fee CHECK (listing_fee_paid >= 0),
 CONSTRAINT chk_auction_listings_status CHECK (status IN ('Active','Sold','Expired','Cancelled')),
 CONSTRAINT chk_auction_listings_expiration CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '24 hours')
);
CREATE INDEX ix_auction_listings_character_id ON auction_listings(character_id);
CREATE INDEX ix_auction_listings_status ON auction_listings(status);
CREATE INDEX ix_auction_listings_expires_at ON auction_listings(expires_at);
CREATE INDEX ix_auction_listings_item_id ON auction_listings(item_id);
CREATE INDEX ix_auction_listings_material_id ON auction_listings(material_id);
CREATE INDEX ix_auction_listings_consumable_id ON auction_listings(consumable_definition_id);

-- =====================================================
-- FILE: 072_auction_history.sql
-- =====================================================

-- 072_auction_history.sql
-- Requires: auction_listings, characters, items, materials, consumable_definitions
CREATE TABLE auction_history (
 auction_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 auction_listing_id UUID NOT NULL,
 seller_character_id UUID NOT NULL,
 buyer_character_id UUID NOT NULL,
 item_id UUID NULL,
 material_id UUID NULL,
 consumable_definition_id UUID NULL,
 quantity BIGINT NOT NULL,
 unit_price BIGINT NOT NULL,
 total_price BIGINT NOT NULL,
 sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_auction_history_listing FOREIGN KEY (auction_listing_id) REFERENCES auction_listings(auction_listing_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_seller FOREIGN KEY (seller_character_id) REFERENCES characters(character_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_buyer FOREIGN KEY (buyer_character_id) REFERENCES characters(character_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_auction_history_asset CHECK ((item_id IS NOT NULL)::integer + (material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
 CONSTRAINT chk_auction_history_characters CHECK (seller_character_id <> buyer_character_id),
 CONSTRAINT chk_auction_history_quantity CHECK (quantity > 0),
 CONSTRAINT chk_auction_history_prices CHECK (unit_price > 0 AND total_price > 0 AND total_price = quantity * unit_price)
);
CREATE INDEX ix_auction_history_listing_id ON auction_history(auction_listing_id);
CREATE INDEX ix_auction_history_seller_id ON auction_history(seller_character_id);
CREATE INDEX ix_auction_history_buyer_id ON auction_history(buyer_character_id);
CREATE INDEX ix_auction_history_sold_at ON auction_history(sold_at);
CREATE INDEX ix_auction_history_item_id ON auction_history(item_id);
CREATE INDEX ix_auction_history_material_id ON auction_history(material_id);
CREATE INDEX ix_auction_history_consumable_id ON auction_history(consumable_definition_id);

-- =====================================================
-- FILE: 073_mail_templates.sql
-- =====================================================

-- 073_mail_templates.sql
CREATE TABLE mail_templates (
 mail_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 code VARCHAR(64) NOT NULL UNIQUE,
 subject_template TEXT NOT NULL,
 body_template TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FILE: 074_mail_messages.sql
-- =====================================================

-- =====================================================
-- 074_mail_messages.sql
-- Requires: characters
-- =====================================================

CREATE TABLE mail_messages (
    mail_message_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,

    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,

    message_type VARCHAR(32) NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    expires_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_mail_messages_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_mail_messages_type
        CHECK (
            message_type IN (
                'MarketplaceSale',
                'MarketplacePurchase',
                'AchievementReward',
                'DailyBossReward',
                'SeasonReward',
                'CraftingReward',
                'AdminMessage',
                'SystemMessage'
            )
        ),

    CONSTRAINT chk_mail_messages_read_state
        CHECK (
            (
                is_read = FALSE
                AND read_at IS NULL
            )
            OR
            (
                is_read = TRUE
                AND read_at IS NOT NULL
                AND read_at >= created_at
            )
        ),

    CONSTRAINT chk_mail_messages_expiration
        CHECK (
            expires_at IS NULL
            OR expires_at > created_at
        )
);

CREATE INDEX ix_mail_messages_character_id
    ON mail_messages(character_id);

CREATE INDEX ix_mail_messages_is_read
    ON mail_messages(is_read);

CREATE INDEX ix_mail_messages_type
    ON mail_messages(message_type);

CREATE INDEX ix_mail_messages_expires_at
    ON mail_messages(expires_at);

-- =====================================================
-- FILE: 075_mail_attachments.sql
-- =====================================================

-- 075_mail_attachments.sql
-- Requires: mail_messages, items, materials, consumable_definitions
CREATE TABLE mail_attachments (
 mail_attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 mail_message_id UUID NOT NULL,
 attachment_type VARCHAR(20) NOT NULL,
 gold_amount BIGINT NULL,
 item_id UUID NULL,
 material_id UUID NULL,
 material_quantity BIGINT NULL,
 consumable_definition_id UUID NULL,
 consumable_quantity BIGINT NULL,
 is_collected BOOLEAN NOT NULL DEFAULT FALSE,
 collected_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_mail_attachments_message FOREIGN KEY (mail_message_id) REFERENCES mail_messages(mail_message_id) ON DELETE CASCADE,
 CONSTRAINT fk_mail_attachments_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
 CONSTRAINT fk_mail_attachments_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_mail_attachments_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_mail_attachments_type CHECK (attachment_type IN ('Gold','Item','Material','Consumable')),
 CONSTRAINT chk_mail_attachments_payload CHECK ((attachment_type='Gold' AND gold_amount>0 AND item_id IS NULL AND material_id IS NULL AND material_quantity IS NULL AND consumable_definition_id IS NULL AND consumable_quantity IS NULL) OR (attachment_type='Item' AND item_id IS NOT NULL AND gold_amount IS NULL AND material_id IS NULL AND material_quantity IS NULL AND consumable_definition_id IS NULL AND consumable_quantity IS NULL) OR (attachment_type='Material' AND material_id IS NOT NULL AND material_quantity>0 AND gold_amount IS NULL AND item_id IS NULL AND consumable_definition_id IS NULL AND consumable_quantity IS NULL) OR (attachment_type='Consumable' AND consumable_definition_id IS NOT NULL AND consumable_quantity>0 AND gold_amount IS NULL AND item_id IS NULL AND material_id IS NULL AND material_quantity IS NULL)),
 CONSTRAINT chk_mail_attachments_collection CHECK ((is_collected=FALSE AND collected_at IS NULL) OR (is_collected=TRUE AND collected_at IS NOT NULL AND collected_at>=created_at))
);
CREATE INDEX ix_mail_attachments_message_id ON mail_attachments(mail_message_id);
CREATE INDEX ix_mail_attachments_is_collected ON mail_attachments(is_collected);
CREATE INDEX ix_mail_attachments_item_id ON mail_attachments(item_id);
CREATE INDEX ix_mail_attachments_material_id ON mail_attachments(material_id);
CREATE INDEX ix_mail_attachments_consumable_id ON mail_attachments(consumable_definition_id);

-- =====================================================
-- FILE: 076_season_rankings.sql
-- =====================================================

-- =====================================================
-- 076_season_rankings.sql
-- Requires: seasons, characters
-- =====================================================

CREATE TABLE season_rankings (
    season_ranking_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    season_id UUID NOT NULL,
    character_id UUID NOT NULL,

    ranking_type VARCHAR(20) NOT NULL,

    rank_position INTEGER NOT NULL,

    character_level INTEGER NOT NULL,
    character_experience BIGINT NOT NULL,
    total_deaths BIGINT NOT NULL DEFAULT 0,

    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_season_rankings_season
        FOREIGN KEY (season_id)
        REFERENCES seasons(season_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_season_rankings_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_season_rankings_season_character_type
        UNIQUE (
            season_id,
            character_id,
            ranking_type
        ),

    CONSTRAINT ux_season_rankings_season_type_rank
        UNIQUE (
            season_id,
            ranking_type,
            rank_position
        ),

    CONSTRAINT chk_season_rankings_type
        CHECK (
            ranking_type IN (
                'Experience',
                'Hardcore'
            )
        ),

    CONSTRAINT chk_season_rankings_rank
        CHECK (rank_position >= 1),

    CONSTRAINT chk_season_rankings_level
        CHECK (character_level >= 1),

    CONSTRAINT chk_season_rankings_experience
        CHECK (character_experience >= 0),

    CONSTRAINT chk_season_rankings_deaths
        CHECK (total_deaths >= 0)
);

CREATE INDEX ix_season_rankings_season_id
    ON season_rankings(season_id);

CREATE INDEX ix_season_rankings_character_id
    ON season_rankings(character_id);

CREATE INDEX ix_season_rankings_type
    ON season_rankings(ranking_type);

CREATE INDEX ix_season_rankings_rank_position
    ON season_rankings(rank_position);

-- =====================================================
-- FILE: 077_hall_of_fame.sql
-- =====================================================

-- 077_hall_of_fame.sql
-- Requires: seasons, characters
CREATE TABLE hall_of_fame (
 hall_of_fame_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 season_id UUID NOT NULL,
 character_id UUID NULL,
 character_name VARCHAR(32) NOT NULL,
 rank_position INTEGER NOT NULL,
 final_level INTEGER NOT NULL,
 final_experience BIGINT NOT NULL,
 achievement_score BIGINT NOT NULL DEFAULT 0,
 holy_grail_percent NUMERIC(7,4) NOT NULL DEFAULT 0,
 total_playtime_seconds BIGINT NOT NULL DEFAULT 0,
 total_deaths BIGINT NOT NULL DEFAULT 0,
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_hall_of_fame_season FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE RESTRICT,
 CONSTRAINT fk_hall_of_fame_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE SET NULL,
 CONSTRAINT ux_hall_of_fame_season_rank UNIQUE (season_id,rank_position),
 CONSTRAINT chk_hall_of_fame_rank CHECK (rank_position>=1),
 CONSTRAINT chk_hall_of_fame_level CHECK (final_level>=1),
 CONSTRAINT chk_hall_of_fame_experience CHECK (final_experience>=0),
 CONSTRAINT chk_hall_of_fame_score CHECK (achievement_score>=0),
 CONSTRAINT chk_hall_of_fame_grail CHECK (holy_grail_percent>=0 AND holy_grail_percent<=100),
 CONSTRAINT chk_hall_of_fame_playtime CHECK (total_playtime_seconds>=0),
 CONSTRAINT chk_hall_of_fame_deaths CHECK (total_deaths>=0)
);
CREATE INDEX ix_hall_of_fame_season_id ON hall_of_fame(season_id);
CREATE INDEX ix_hall_of_fame_character_id ON hall_of_fame(character_id);
CREATE INDEX ix_hall_of_fame_rank_position ON hall_of_fame(rank_position);


