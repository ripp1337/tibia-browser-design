# M6 Schema Data Dump

Generated: 2026-10-08 13:49:34 +02:00
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Authoritative schema evidence relevant to M6: Victory, Death, and Progression.

M6 settles completed combat outcomes transactionally and exactly once.
M6 may update character progression, rewards, statistics, cooldowns, Bestiary, Task Boss progress, and final combat summaries, while the M4 combat engine remains infrastructure-independent.

The schema is evidence for current terminology, constraints, relationships, and M6 migration planning.

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
# SOURCE: database/migrations/022_character_unlocks.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/026_character_cooldowns.sql
# ============================================================

```sql
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
# SOURCE: database/migrations/035_bestiary_entries.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/036_bestiary_statistics.sql
# ============================================================

```sql
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

```

# ============================================================
# SOURCE: database/migrations/037_character_daily_boss_progress.sql
# ============================================================

```sql
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
```

# ============================================================
# SOURCE: database/migrations/038_monster_tasks.sql
# ============================================================

```sql
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
# SOURCE: database/migrations/080_character_foundation_support.sql
# ============================================================

```sql
BEGIN;

ALTER TABLE characters
ADD COLUMN resources_updated_at timestamptz;

UPDATE characters
SET resources_updated_at = COALESCE(last_active_at, updated_at, created_at, now())
WHERE resources_updated_at IS NULL;

ALTER TABLE characters
ALTER COLUMN resources_updated_at SET DEFAULT now();

ALTER TABLE characters
ALTER COLUMN resources_updated_at SET NOT NULL;

CREATE UNIQUE INDEX ux_characters_normalized_name
ON characters (lower(btrim(name)));

COMMIT;

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
# SOURCE: database/migrations/083_add_monster_energy_cost.sql
# ============================================================

```sql
-- =====================================================
-- 083_add_monster_energy_cost.sql
-- =====================================================

ALTER TABLE monsters
    ADD COLUMN energy_cost INTEGER NOT NULL DEFAULT 0;

ALTER TABLE monsters
    ADD CONSTRAINT chk_monsters_energy_cost
    CHECK (energy_cost >= 0);
```

# ============================================================
# SOURCE: database/migrations/084_task_status_refactor.sql
# ============================================================

```sql
-- =====================================================
-- 084_task_status_refactor.sql
-- Requires: 083
-- =====================================================

ALTER TABLE bestiary_statistics
ADD COLUMN task_status VARCHAR(32);

UPDATE bestiary_statistics
SET task_status =
    CASE
        WHEN task_unlocked = TRUE
            THEN 'UNLOCKED'
        ELSE 'ACTIVE'
    END;

ALTER TABLE bestiary_statistics
ALTER COLUMN task_status SET NOT NULL;

ALTER TABLE bestiary_statistics
ADD CONSTRAINT chk_bestiary_statistics_task_status
CHECK (
    task_status IN (
        'ACTIVE',
        'UNLOCKED',
        'WAITING_FOR_REUNLOCK'
    )
);

ALTER TABLE bestiary_statistics
DROP COLUMN task_unlocked;
```

# ============================================================
# SOURCE: database/migrations/085_unique_monster_task_boss.sql
# ============================================================

```sql
-- =====================================================
-- 084_unique_monster_task_boss.sql
-- Requires: monster_tasks
-- =====================================================

ALTER TABLE monster_tasks
    ADD CONSTRAINT ux_monster_tasks_boss_id
    UNIQUE (boss_id);
```

# ============================================================
# SOURCE: database/migrations/086_daily_boss_rotation_window.sql
# ============================================================

```sql
-- =====================================================
-- 086_daily_boss_rotation_window.sql
-- Requires: daily_boss_rotation
-- =====================================================

ALTER TABLE daily_boss_rotation
    ADD CONSTRAINT chk_daily_boss_rotation_window
    CHECK (reset_timestamp > created_at);

```

# ============================================================
# SOURCE: database/migrations/087_daily_boss_attempt_rotation.sql
# ============================================================

```sql
-- =====================================================
-- 087_daily_boss_attempt_rotation.sql
-- Requires: daily_boss_rotation,
--           character_daily_boss_progress
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM character_daily_boss_progress
    ) THEN
        RAISE EXCEPTION
            'Migration 087 requires character_daily_boss_progress to be empty.';
    END IF;
END
$$;

ALTER TABLE character_daily_boss_progress
    DROP CONSTRAINT ux_character_daily_boss_progress;

ALTER TABLE character_daily_boss_progress
    ADD COLUMN daily_boss_rotation_id UUID NOT NULL;

ALTER TABLE character_daily_boss_progress
    RENAME COLUMN attempts_used_today
    TO attempts_used_in_rotation;

ALTER TABLE character_daily_boss_progress
    RENAME CONSTRAINT chk_character_daily_boss_attempts_today
    TO chk_character_daily_boss_attempts_rotation;

ALTER TABLE character_daily_boss_progress
    DROP COLUMN attempts_date;

ALTER TABLE character_daily_boss_progress
    ADD CONSTRAINT fk_character_daily_boss_progress_rotation
    FOREIGN KEY (daily_boss_rotation_id)
    REFERENCES daily_boss_rotation(daily_boss_rotation_id)
    ON DELETE RESTRICT;

ALTER TABLE character_daily_boss_progress
    ADD CONSTRAINT ux_character_daily_boss_progress
    UNIQUE (
        character_id,
        daily_boss_definition_id,
        daily_boss_rotation_id
    );

CREATE INDEX ix_character_daily_boss_progress_rotation_id
    ON character_daily_boss_progress(
        daily_boss_rotation_id
    );

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
# RELEVANT TABLE COLUMNS
# ============================================================

```text
table_name,ordinal_position,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale
accounts,2,username,character varying,varchar,NO,,32,,
accounts,3,email,character varying,varchar,YES,,255,,
accounts,5,status,character varying,varchar,NO,'Active'::character varying,20,,
achievements,2,code,character varying,varchar,NO,,64,,
achievements,3,name,character varying,varchar,NO,,100,,
achievements,5,category,character varying,varchar,NO,,32,,
achievements,7,objective_type,character varying,varchar,NO,,64,,
addon_definitions,3,name,character varying,varchar,NO,,100,,
admin_actions,2,admin_user,character varying,varchar,NO,,100,,
admin_actions,3,action_type,character varying,varchar,NO,,64,,
admin_actions,5,target_entity_type,character varying,varchar,YES,,64,,
affix_templates,2,affix_type,character varying,varchar,NO,,32,,
announcements,2,title,character varying,varchar,NO,,200,,
announcements,4,priority,character varying,varchar,NO,'Normal'::character varying,20,,
auction_history,3,seller_character_id,uuid,uuid,NO,,,,
auction_history,4,buyer_character_id,uuid,uuid,NO,,,,
auction_listings,2,character_id,uuid,uuid,NO,,,,
auction_listings,9,status,character varying,varchar,NO,'Active'::character varying,20,,
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
bosses,2,monster_id,uuid,uuid,NO,,,,
bosses,3,boss_type,character varying,varchar,NO,,20,,
bosses,6,additional_cooldown_seconds,integer,int4,NO,0,,32,0
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
chest_definitions,2,name,character varying,varchar,NO,,32,,
chest_definitions,3,cooldown_seconds,integer,int4,NO,,,32,0
chest_reward_definitions,3,reward_type,character varying,varchar,NO,,32,,
chest_reward_definitions,7,minimum_character_level,integer,int4,NO,1,,32,0
chest_reward_definitions,8,maximum_character_level,integer,int4,YES,,,32,0
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
consumable_definitions,2,name,character varying,varchar,NO,,100,,
consumable_definitions,5,category,character varying,varchar,NO,,32,,
consumable_definitions,6,tier,character varying,varchar,NO,'None'::character varying,20,,
consumable_definitions,7,effect_type,character varying,varchar,NO,,32,,
consumable_definitions,9,duration_type,character varying,varchar,NO,,20,,
consumable_definitions,11,potion_cooldown_turns,integer,int4,NO,0,,32,0
consumable_definitions,16,code,character varying,varchar,NO,,64,,
consumable_storage,2,character_id,uuid,uuid,NO,,,,
crafting_history,2,character_id,uuid,uuid,NO,,,,
crafting_queue,2,character_id,uuid,uuid,NO,,,,
crafting_queue,5,status,character varying,varchar,NO,'Pending'::character varying,20,,
daily_chest_progress,2,character_id,uuid,uuid,NO,,,,
equipment_loadouts,2,character_id,uuid,uuid,NO,,,,
equipment_loadouts,3,name,character varying,varchar,NO,,50,,
friend_requests,4,status,character varying,varchar,NO,'Pending'::character varying,20,,
gathering_sessions,2,character_id,uuid,uuid,NO,,,,
gathering_sessions,5,status,character varying,varchar,NO,'Active'::character varying,20,,
hall_of_fame,3,character_id,uuid,uuid,YES,,,,
hall_of_fame,4,character_name,character varying,varchar,NO,,32,,
holy_grail_entries,5,found_by_character_id,uuid,uuid,YES,,,,
hourly_chest_progress,2,character_id,uuid,uuid,NO,,,,
inventory_items,2,character_id,uuid,uuid,NO,,,,
item_bases,4,name,character varying,varchar,NO,,100,,
item_bases,9,slot,character varying,varchar,NO,,20,,
item_bases,10,weapon_type,character varying,varchar,YES,,32,,
item_bases,25,code,character varying,varchar,NO,,64,,
items,4,rarity,character varying,varchar,NO,,20,,
login_streak_progress,2,character_id,uuid,uuid,NO,,,,
loot_tables,2,monster_id,uuid,uuid,NO,,,,
mail_attachments,3,attachment_type,character varying,varchar,NO,,20,,
mail_messages,2,character_id,uuid,uuid,NO,,,,
mail_messages,3,subject,character varying,varchar,NO,,200,,
mail_messages,5,message_type,character varying,varchar,NO,,32,,
mail_templates,2,code,character varying,varchar,NO,,64,,
material_storage,2,character_id,uuid,uuid,NO,,,,
materials,2,name,character varying,varchar,NO,,100,,
materials,12,minimum_monster_level,integer,int4,YES,,,32,0
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
npc_definitions,2,name,character varying,varchar,NO,,100,,
npc_definitions,5,npc_type,character varying,varchar,NO,,32,,
npc_definitions,11,code,character varying,varchar,NO,,64,,
other_loot_tables,2,monster_id,uuid,uuid,NO,,,,
outfit_definitions,2,name,character varying,varchar,NO,,100,,
outfit_definitions,5,category,character varying,varchar,NO,,64,,
outfit_definitions,9,code,character varying,varchar,NO,,64,,
private_messages,4,subject,character varying,varchar,NO,,200,,
punishments,3,punishment_type,character varying,varchar,NO,,32,,
punishments,5,issued_by,character varying,varchar,NO,,100,,
recipes,2,name,character varying,varchar,NO,,100,,
recipes,4,category,character varying,varchar,NO,,20,,
recipes,7,required_character_level,integer,int4,NO,1,,32,0
recipes,15,code,character varying,varchar,NO,,64,,
season_rankings,3,character_id,uuid,uuid,NO,,,,
season_rankings,4,ranking_type,character varying,varchar,NO,,20,,
season_rankings,6,character_level,integer,int4,NO,,,32,0
season_rankings,7,character_experience,bigint,int8,NO,,,64,0
seasons,3,name,character varying,varchar,NO,,100,,
seasons,6,status,character varying,varchar,NO,'Upcoming'::character varying,20,,
seed_history,2,seed_name,character varying,varchar,NO,,255,,
seed_history,3,checksum_sha256,character varying,varchar,NO,,64,,
set_bonuses,4,bonus_type,character varying,varchar,NO,,32,,
set_templates,2,name,character varying,varchar,NO,,100,,
set_templates,7,code,character varying,varchar,NO,,64,,
spells,2,name,character varying,varchar,NO,,100,,
spells,5,category,character varying,varchar,NO,,32,,
spells,6,target_type,character varying,varchar,NO,,20,,
spells,8,cooldown_turns,integer,int4,NO,0,,32,0
spells,15,code,character varying,varchar,NO,,64,,
unique_pity_tracking,2,character_id,uuid,uuid,NO,,,,
unique_templates,2,name,character varying,varchar,NO,,100,,
unique_templates,18,code,character varying,varchar,NO,,64,,
```

# ============================================================
# RELEVANT TABLE CONSTRAINTS
# ============================================================

```text
accounts,chk_accounts_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Suspended'::character varying, 'Banned'::character varying, 'Deleted'::character varying])::text[]))"
achievements,chk_achievements_category,CHECK,"((category)::text = ANY ((ARRAY['Combat'::character varying, 'Boss'::character varying, 'DailyBoss'::character varying, 'Level'::character varying, 'Gold'::character varying, 'Crafting'::character varying, 'Gathering'::character varying, 'Death'::character varying, 'Hardcore'::character varying, 'Unique'::character varying, 'Set'::character varying, 'HolyGrail'::character varying])::text[]))"
affix_templates,chk_affix_templates_type,CHECK,"((affix_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'Health'::character varying, 'Mana'::character varying, 'Energy'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying])::text[]))"
announcements,chk_announcements_priority,CHECK,"((priority)::text = ANY ((ARRAY['Low'::character varying, 'Normal'::character varying, 'High'::character varying, 'Critical'::character varying])::text[]))"
auction_history,auction_history_buyer_character_id_not_null,CHECK,buyer_character_id IS NOT NULL
auction_history,auction_history_seller_character_id_not_null,CHECK,seller_character_id IS NOT NULL
auction_history,chk_auction_history_characters,CHECK,(seller_character_id <> buyer_character_id)
auction_listings,auction_listings_character_id_not_null,CHECK,character_id IS NOT NULL
auction_listings,chk_auction_listings_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Sold'::character varying, 'Expired'::character varying, 'Cancelled'::character varying])::text[]))"
auction_listings,fk_auction_listings_character,FOREIGN KEY,
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
bosses,bosses_monster_id_not_null,CHECK,monster_id IS NOT NULL
bosses,chk_bosses_additional_cooldown,CHECK,(additional_cooldown_seconds >= 0)
bosses,chk_bosses_type,CHECK,"((boss_type)::text = ANY ((ARRAY['MiniBoss'::character varying, 'TaskBoss'::character varying, 'DailyBoss'::character varying])::text[]))"
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
chest_definitions,chest_definitions_cooldown_seconds_not_null,CHECK,cooldown_seconds IS NOT NULL
chest_definitions,chk_chest_definitions_cooldown,CHECK,(cooldown_seconds > 0)
chest_definitions,chk_chest_definitions_name,CHECK,"((name)::text = ANY ((ARRAY['HourlyChest'::character varying, 'DailyChest'::character varying])::text[]))"
chest_reward_definitions,chest_reward_definitions_minimum_character_level_not_null,CHECK,minimum_character_level IS NOT NULL
chest_reward_definitions,chk_chest_reward_definitions_levels,CHECK,((minimum_character_level >= 1) AND ((maximum_character_level IS NULL) OR (maximum_character_level >= minimum_character_level)))
chest_reward_definitions,chk_chest_reward_definitions_type,CHECK,"((reward_type)::text = ANY ((ARRAY['Gold'::character varying, 'Item'::character varying, 'Material'::character varying, 'Consumable'::character varying, 'Blessing'::character varying, 'ProtectionStone'::character varying, 'UniqueRoll'::character varying, 'SetRoll'::character varying])::text[]))"
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
consumable_definitions,chk_consumable_definitions_duration_type,CHECK,"((duration_type)::text = ANY ((ARRAY['Instant'::character varying, 'Fights'::character varying, 'Passive'::character varying])::text[]))"
consumable_definitions,chk_consumable_definitions_duration_value,CHECK,"((((duration_type)::text = 'Instant'::text) AND (duration_value IS NULL)) OR (((duration_type)::text = ANY ((ARRAY['Fights'::character varying, 'Passive'::character varying])::text[])) AND (duration_value IS NOT NULL) AND (duration_value > 0)))"
consumable_definitions,chk_consumable_definitions_effect_type,CHECK,"((effect_type)::text = ANY ((ARRAY['RestoreHealth'::character varying, 'RestoreMana'::character varying, 'RestoreEnergy'::character varying, 'GoldBonus'::character varying, 'ExperienceBonus'::character varying, 'Blessing'::character varying, 'UpgradeProtection'::character varying])::text[]))"
consumable_definitions,chk_consumable_definitions_potion_cooldown,CHECK,(potion_cooldown_turns >= 0)
consumable_definitions,chk_consumable_definitions_tier,CHECK,"((tier)::text = ANY ((ARRAY['Small'::character varying, 'Medium'::character varying, 'Large'::character varying, 'Grand'::character varying, 'Ultimate'::character varying, 'None'::character varying])::text[]))"
consumable_definitions,consumable_definitions_potion_cooldown_turns_not_null,CHECK,potion_cooldown_turns IS NOT NULL
consumable_storage,consumable_storage_character_id_not_null,CHECK,character_id IS NOT NULL
consumable_storage,fk_consumable_storage_character,FOREIGN KEY,
consumable_storage,ux_consumable_storage_character_definition,UNIQUE,
crafting_history,crafting_history_character_id_not_null,CHECK,character_id IS NOT NULL
crafting_history,fk_crafting_history_character,FOREIGN KEY,
crafting_queue,chk_crafting_queue_dates,CHECK,"(((started_at IS NULL) AND ((status)::text = ANY ((ARRAY['Pending'::character varying, 'Cancelled'::character varying])::text[]))) OR ((started_at IS NOT NULL) AND (completes_at > started_at)))"
crafting_queue,chk_crafting_queue_status,CHECK,"((status)::text = ANY ((ARRAY['Pending'::character varying, 'Active'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))"
crafting_queue,crafting_queue_character_id_not_null,CHECK,character_id IS NOT NULL
crafting_queue,fk_crafting_queue_character,FOREIGN KEY,
daily_chest_progress,daily_chest_progress_character_id_not_null,CHECK,character_id IS NOT NULL
daily_chest_progress,fk_daily_chest_progress_character,FOREIGN KEY,
daily_chest_progress,daily_chest_progress_character_id_key,UNIQUE,
equipment_loadouts,equipment_loadouts_character_id_not_null,CHECK,character_id IS NOT NULL
equipment_loadouts,fk_equipment_loadouts_character,FOREIGN KEY,
equipment_loadouts,ux_equipment_loadouts_character_name,UNIQUE,
friend_requests,chk_friend_requests_status,CHECK,"((status)::text = ANY ((ARRAY['Pending'::character varying, 'Accepted'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying])::text[]))"
gathering_sessions,chk_gathering_sessions_status,CHECK,"((status)::text = ANY ((ARRAY['Active'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))"
gathering_sessions,gathering_sessions_character_id_not_null,CHECK,character_id IS NOT NULL
gathering_sessions,fk_gathering_sessions_character,FOREIGN KEY,
hall_of_fame,hall_of_fame_character_name_not_null,CHECK,character_name IS NOT NULL
hall_of_fame,fk_hall_of_fame_character,FOREIGN KEY,
holy_grail_entries,fk_holy_grail_entries_character,FOREIGN KEY,
hourly_chest_progress,hourly_chest_progress_character_id_not_null,CHECK,character_id IS NOT NULL
hourly_chest_progress,fk_hourly_chest_progress_character,FOREIGN KEY,
hourly_chest_progress,hourly_chest_progress_character_id_key,UNIQUE,
inventory_items,inventory_items_character_id_not_null,CHECK,character_id IS NOT NULL
inventory_items,fk_inventory_items_character,FOREIGN KEY,
inventory_items,ux_inventory_items_character_position,UNIQUE,
item_bases,chk_item_bases_slot,CHECK,"((slot)::text = ANY ((ARRAY['Weapon'::character varying, 'Helmet'::character varying, 'Armor'::character varying, 'Shield'::character varying, 'Legs'::character varying, 'Boots'::character varying, 'Ring'::character varying, 'Amulet'::character varying])::text[]))"
items,chk_items_rarity,CHECK,"((rarity)::text = ANY ((ARRAY['Common'::character varying, 'Magic'::character varying, 'Rare'::character varying, 'Epic'::character varying, 'Legendary'::character varying])::text[]))"
login_streak_progress,login_streak_progress_character_id_not_null,CHECK,character_id IS NOT NULL
login_streak_progress,fk_login_streak_progress_character,FOREIGN KEY,
login_streak_progress,login_streak_progress_character_id_key,UNIQUE,
loot_tables,loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
loot_tables,fk_loot_tables_monster,FOREIGN KEY,
loot_tables,ux_loot_tables_monster_item,UNIQUE,
mail_attachments,chk_mail_attachments_type,CHECK,"((attachment_type)::text = ANY ((ARRAY['Gold'::character varying, 'Item'::character varying, 'Material'::character varying, 'Consumable'::character varying])::text[]))"
mail_messages,chk_mail_messages_type,CHECK,"((message_type)::text = ANY ((ARRAY['MarketplaceSale'::character varying, 'MarketplacePurchase'::character varying, 'AchievementReward'::character varying, 'DailyBossReward'::character varying, 'SeasonReward'::character varying, 'CraftingReward'::character varying, 'AdminMessage'::character varying, 'SystemMessage'::character varying])::text[]))"
mail_messages,mail_messages_character_id_not_null,CHECK,character_id IS NOT NULL
mail_messages,fk_mail_messages_character,FOREIGN KEY,
material_storage,material_storage_character_id_not_null,CHECK,character_id IS NOT NULL
material_storage,fk_material_storage_character,FOREIGN KEY,
material_storage,ux_material_storage_character_material,UNIQUE,
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
npc_definitions,chk_npc_definitions_type,CHECK,"((npc_type)::text = ANY ((ARRAY['Vendor'::character varying, 'Healer'::character varying, 'BlessingMerchant'::character varying, 'PromotionTrainer'::character varying])::text[]))"
other_loot_tables,other_loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
other_loot_tables,fk_other_loot_tables_monster,FOREIGN KEY,
punishments,chk_punishments_expiration_type,CHECK,"((((punishment_type)::text = 'TemporaryBan'::text) AND (expires_at IS NOT NULL)) OR (((punishment_type)::text = 'PermanentBan'::text) AND (expires_at IS NULL)) OR ((punishment_type)::text = ANY ((ARRAY['Warning'::character varying, 'Mute'::character varying])::text[])))"
punishments,chk_punishments_type,CHECK,"((punishment_type)::text = ANY ((ARRAY['Warning'::character varying, 'Mute'::character varying, 'TemporaryBan'::character varying, 'PermanentBan'::character varying])::text[]))"
recipes,chk_recipes_category,CHECK,"((category)::text = ANY ((ARRAY['Potion'::character varying, 'Blessing'::character varying, 'Upgrade'::character varying, 'Boost'::character varying])::text[]))"
recipes,chk_recipes_levels,CHECK,((required_crafting_level >= 1) AND (required_character_level >= 1))
recipes,recipes_required_character_level_not_null,CHECK,required_character_level IS NOT NULL
season_rankings,chk_season_rankings_experience,CHECK,(character_experience >= 0)
season_rankings,chk_season_rankings_level,CHECK,(character_level >= 1)
season_rankings,chk_season_rankings_type,CHECK,"((ranking_type)::text = ANY ((ARRAY['Experience'::character varying, 'Hardcore'::character varying])::text[]))"
season_rankings,season_rankings_character_experience_not_null,CHECK,character_experience IS NOT NULL
season_rankings,season_rankings_character_id_not_null,CHECK,character_id IS NOT NULL
season_rankings,season_rankings_character_level_not_null,CHECK,character_level IS NOT NULL
season_rankings,fk_season_rankings_character,FOREIGN KEY,
season_rankings,ux_season_rankings_season_character_type,UNIQUE,
seasons,chk_seasons_status,CHECK,"((status)::text = ANY ((ARRAY['Upcoming'::character varying, 'Active'::character varying, 'Ended'::character varying])::text[]))"
set_bonuses,chk_set_bonuses_type,CHECK,"((bonus_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying, 'Health'::character varying, 'Mana'::character varying])::text[]))"
spells,chk_spells_category,CHECK,"((category)::text = ANY ((ARRAY['Damage'::character varying, 'DamageOverTime'::character varying, 'Healing'::character varying, 'HealOverTime'::character varying, 'ManaDrain'::character varying, 'HealthDrain'::character varying, 'PotionDisable'::character varying, 'StatBuff'::character varying, 'StatDebuff'::character varying])::text[]))"
spells,chk_spells_cooldown_turns,CHECK,(cooldown_turns >= 0)
spells,chk_spells_target_type,CHECK,"((target_type)::text = ANY ((ARRAY['Self'::character varying, 'Enemy'::character varying])::text[]))"
spells,spells_cooldown_turns_not_null,CHECK,cooldown_turns IS NOT NULL
unique_pity_tracking,unique_pity_tracking_character_id_not_null,CHECK,character_id IS NOT NULL
unique_pity_tracking,fk_unique_pity_tracking_character,FOREIGN KEY,
unique_pity_tracking,unique_pity_tracking_character_id_key,UNIQUE,
```

# ============================================================
# MIGRATION STATUS
# ============================================================

```text

> ostatnia-szansa-game@1.0.0 db:migrate:status
> tsx scripts/run-migrations.ts --status

Database: ostatnia_szansa_dev
Migrations: 88
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
Pending: 0
```

