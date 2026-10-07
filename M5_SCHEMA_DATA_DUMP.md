# M5 Schema Data Dump

Generated: 2026-10-07 21:52:24 +02:00
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Authoritative schema evidence relevant to M5: Persistent Combat API.

## Architectural boundary

M5 connects the pure combat domain to persistent combat sessions and HTTP.
The schema is context for terminology and future integration.
The M5 application layer may use PostgreSQL, repositories and HTTP, while the M4 combat domain must remain infrastructure-independent.

# ============================================================
# SOURCE: database/migrations/005_spells.sql
# ============================================================

```sql
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
# SOURCE: database/migrations/023_character_spell_mastery.sql
# ============================================================

```sql
-- =====================================================
-- 023_character_spell_mastery.sql
-- Requires: characters
-- =====================================================

CREATE TABLE character_spell_mastery (
    character_spell_mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,

    mastery_level INTEGER NOT NULL DEFAULT 1,
    mastery_experience BIGINT NOT NULL DEFAULT 0,
    current_spell_power_percent NUMERIC(8, 4) NOT NULL DEFAULT 100.0000,

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
        CHECK (current_spell_power_percent >= 100)
);

```

# ============================================================
# SOURCE: database/migrations/024_character_spells.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/027_character_statistics.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/028_character_buffs.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/039_monster_abilities.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/040_monster_ability_weights.sql
# ============================================================

```sql
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
```

# ============================================================
# SOURCE: database/migrations/046_combat_sessions.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/047_combat_effects.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/048_combat_spell_cooldowns.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/049_combat_logs.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/081_effective_character_statistics.sql
# ============================================================

```sql
BEGIN;

ALTER TABLE character_spell_mastery
RENAME COLUMN current_spell_power_percent
TO current_spell_power;

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'character_spell_mastery'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%current_spell_power%'
    LOOP
        EXECUTE format(
            'ALTER TABLE character_spell_mastery DROP CONSTRAINT %I',
            constraint_record.conname
        );
    END LOOP;
END
$$;

ALTER TABLE character_spell_mastery
ADD CONSTRAINT chk_character_spell_mastery_spell_power
CHECK (current_spell_power >= 0);

COMMIT;
```

# ============================================================
# RELEVANT TABLE COLUMNS
# ============================================================

```text
bestiary_entries,3,monster_id,uuid,uuid,NO,,,,
bestiary_statistics,3,monster_id,uuid,uuid,NO,,,,
bosses,2,monster_id,uuid,uuid,NO,,,,
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
character_loadouts,4,spell_1_id,uuid,uuid,YES,,,,
character_loadouts,5,spell_2_id,uuid,uuid,YES,,,,
character_loadouts,6,spell_3_id,uuid,uuid,YES,,,,
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
character_unlocks,4,spell_slots_unlocked,integer,int4,NO,1,,32,0
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
item_bases,13,spell_power,numeric,numeric,NO,0,,12,4
loot_tables,2,monster_id,uuid,uuid,NO,,,,
materials,12,minimum_monster_level,integer,int4,YES,,,32,0
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
other_loot_tables,2,monster_id,uuid,uuid,NO,,,,
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
unique_templates,8,min_spell_power,numeric,numeric,NO,0,,12,4
unique_templates,9,max_spell_power,numeric,numeric,NO,0,,12,4
```

# ============================================================
# RELEVANT TABLE CONSTRAINTS
# ============================================================

```text
achievements,chk_achievements_category,CHECK,"((category)::text = ANY ((ARRAY['Combat'::character varying, 'Boss'::character varying, 'DailyBoss'::character varying, 'Level'::character varying, 'Gold'::character varying, 'Crafting'::character varying, 'Gathering'::character varying, 'Death'::character varying, 'Hardcore'::character varying, 'Unique'::character varying, 'Set'::character varying, 'HolyGrail'::character varying])::text[]))"
affix_templates,chk_affix_templates_type,CHECK,"((affix_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'Health'::character varying, 'Mana'::character varying, 'Energy'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying])::text[]))"
bestiary_entries,bestiary_entries_monster_id_not_null,CHECK,monster_id IS NOT NULL
bestiary_entries,fk_bestiary_entries_monster,FOREIGN KEY,
bestiary_entries,ux_bestiary_entries_character_monster,UNIQUE,
bestiary_statistics,bestiary_statistics_monster_id_not_null,CHECK,monster_id IS NOT NULL
bestiary_statistics,fk_bestiary_statistics_monster,FOREIGN KEY,
bestiary_statistics,ux_bestiary_statistics_character_monster,UNIQUE,
bosses,bosses_monster_id_not_null,CHECK,monster_id IS NOT NULL
bosses,fk_bosses_monster,FOREIGN KEY,
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
character_cooldowns,chk_character_cooldowns_target,CHECK,((((cooldown_type)::text = 'Monster'::text) AND (target_id IS NOT NULL)) OR (((cooldown_type)::text = 'NpcHealer'::text) AND (target_id IS NULL)))
character_cooldowns,chk_character_cooldowns_type,CHECK,"((cooldown_type)::text = ANY ((ARRAY['Monster'::character varying, 'NpcHealer'::character varying])::text[]))"
character_loadouts,chk_character_loadouts_distinct_spells,CHECK,(((spell_1_id IS NULL) OR (spell_2_id IS NULL) OR (spell_1_id <> spell_2_id)) AND ((spell_1_id IS NULL) OR (spell_3_id IS NULL) OR (spell_1_id <> spell_3_id)) AND ((spell_2_id IS NULL) OR (spell_3_id IS NULL) OR (spell_2_id <> spell_3_id)))
character_loadouts,chk_character_loadouts_spell_order,CHECK,(((spell_2_id IS NULL) OR (spell_1_id IS NOT NULL)) AND ((spell_3_id IS NULL) OR (spell_2_id IS NOT NULL)))
character_loadouts,fk_character_loadouts_spell_1,FOREIGN KEY,
character_loadouts,fk_character_loadouts_spell_2,FOREIGN KEY,
character_loadouts,fk_character_loadouts_spell_3,FOREIGN KEY,
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
character_unlocks,character_unlocks_spell_slots_unlocked_not_null,CHECK,spell_slots_unlocked IS NOT NULL
character_unlocks,chk_character_unlocks_spell_slots,CHECK,((spell_slots_unlocked >= 1) AND (spell_slots_unlocked <= 3))
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
item_bases,chk_item_bases_stats,CHECK,((attack >= (0)::numeric) AND (defense >= (0)::numeric) AND (spell_power >= (0)::numeric) AND (health >= (0)::numeric) AND (mana >= (0)::numeric) AND (energy >= (0)::numeric) AND (gold_percent >= (0)::numeric) AND (experience_percent >= (0)::numeric) AND (base_item_score >= 0))
item_bases,item_bases_spell_power_not_null,CHECK,spell_power IS NOT NULL
loot_tables,loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
loot_tables,fk_loot_tables_monster,FOREIGN KEY,
loot_tables,ux_loot_tables_monster_item,UNIQUE,
materials,chk_materials_minimum_monster_level,CHECK,((minimum_monster_level IS NULL) OR (minimum_monster_level >= 1))
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
other_loot_tables,other_loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
other_loot_tables,fk_other_loot_tables_monster,FOREIGN KEY,
set_bonuses,chk_set_bonuses_type,CHECK,"((bonus_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying, 'Health'::character varying, 'Mana'::character varying])::text[]))"
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
unique_templates,chk_unique_templates_spell_power,CHECK,((min_spell_power >= (0)::numeric) AND (max_spell_power >= min_spell_power))
unique_templates,unique_templates_max_spell_power_not_null,CHECK,max_spell_power IS NOT NULL
unique_templates,unique_templates_min_spell_power_not_null,CHECK,min_spell_power IS NOT NULL
```

# ============================================================
# MIGRATION STATUS
# ============================================================

```text

> ostatnia-szansa-game@1.0.0 db:migrate:status
> tsx scripts/run-migrations.ts --status

Database: ostatnia_szansa_dev
Migrations: 87
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
Pending: 0
```

