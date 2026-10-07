# M3 Schema and Data Dump

Generated: 2026-10-06T20:45:30.743Z

## Columns
[
  {
    "table_name": "bestiary_entries",
    "ordinal_position": 1,
    "column_name": "bestiary_entry_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "bestiary_entries",
    "ordinal_position": 2,
    "column_name": "character_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bestiary_entries",
    "ordinal_position": 3,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bestiary_entries",
    "ordinal_position": 4,
    "column_name": "unlocked_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bestiary_entries",
    "ordinal_position": 5,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 1,
    "column_name": "bestiary_statistics_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 2,
    "column_name": "character_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 3,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 4,
    "column_name": "kill_count",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "1"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 5,
    "column_name": "first_kill_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 6,
    "column_name": "last_kill_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 7,
    "column_name": "task_progress",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 8,
    "column_name": "task_unlocked",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 9,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bestiary_statistics",
    "ordinal_position": 10,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bosses",
    "ordinal_position": 1,
    "column_name": "boss_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "bosses",
    "ordinal_position": 2,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bosses",
    "ordinal_position": 3,
    "column_name": "boss_type",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bosses",
    "ordinal_position": 4,
    "column_name": "loot_level_bonus",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "bosses",
    "ordinal_position": 5,
    "column_name": "unique_modifier",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "1.0000"
  },
  {
    "table_name": "bosses",
    "ordinal_position": 6,
    "column_name": "additional_cooldown_seconds",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "bosses",
    "ordinal_position": 7,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "bosses",
    "ordinal_position": 8,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 1,
    "column_name": "character_cooldown_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 2,
    "column_name": "character_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 3,
    "column_name": "cooldown_type",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 4,
    "column_name": "target_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 5,
    "column_name": "available_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 6,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "character_cooldowns",
    "ordinal_position": 7,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 1,
    "column_name": "character_daily_boss_progress_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 2,
    "column_name": "character_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 3,
    "column_name": "daily_boss_definition_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 4,
    "column_name": "attempts_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 5,
    "column_name": "attempts_used_today",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 6,
    "column_name": "total_attempts",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 7,
    "column_name": "total_victories",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 8,
    "column_name": "last_attempt_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 9,
    "column_name": "last_victory_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 10,
    "column_name": "highest_tier_defeated",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 11,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "character_daily_boss_progress",
    "ordinal_position": 12,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 1,
    "column_name": "combat_session_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 2,
    "column_name": "character_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 3,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 4,
    "column_name": "status",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": "'Active'::character varying"
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 5,
    "column_name": "current_turn",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "1"
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 6,
    "column_name": "character_health",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 7,
    "column_name": "character_mana",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 8,
    "column_name": "monster_health",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 9,
    "column_name": "started_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 10,
    "column_name": "ended_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 11,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "combat_sessions",
    "ordinal_position": 12,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 1,
    "column_name": "daily_boss_definition_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 2,
    "column_name": "boss_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 3,
    "column_name": "tier",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 4,
    "column_name": "recommended_level",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 5,
    "column_name": "attempts_per_day",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "1"
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 6,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "daily_boss_definitions",
    "ordinal_position": 7,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "daily_boss_pools",
    "ordinal_position": 1,
    "column_name": "daily_boss_pool_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "daily_boss_pools",
    "ordinal_position": 2,
    "column_name": "daily_boss_definition_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_pools",
    "ordinal_position": 3,
    "column_name": "tier",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_pools",
    "ordinal_position": 4,
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  },
  {
    "table_name": "daily_boss_pools",
    "ordinal_position": 5,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "daily_boss_rotation",
    "ordinal_position": 1,
    "column_name": "daily_boss_rotation_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "daily_boss_rotation",
    "ordinal_position": 2,
    "column_name": "tier_1_boss_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_rotation",
    "ordinal_position": 3,
    "column_name": "tier_2_boss_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_rotation",
    "ordinal_position": 4,
    "column_name": "tier_3_boss_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_rotation",
    "ordinal_position": 5,
    "column_name": "reset_timestamp",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "daily_boss_rotation",
    "ordinal_position": 6,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monster_abilities",
    "ordinal_position": 1,
    "column_name": "monster_ability_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "monster_abilities",
    "ordinal_position": 2,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_abilities",
    "ordinal_position": 3,
    "column_name": "spell_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_abilities",
    "ordinal_position": 4,
    "column_name": "is_enabled",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  },
  {
    "table_name": "monster_abilities",
    "ordinal_position": 5,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monster_ability_weights",
    "ordinal_position": 1,
    "column_name": "monster_ability_weight_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "monster_ability_weights",
    "ordinal_position": 2,
    "column_name": "monster_ability_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_ability_weights",
    "ordinal_position": 3,
    "column_name": "weight",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_ability_weights",
    "ordinal_position": 4,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monster_families",
    "ordinal_position": 1,
    "column_name": "monster_family_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "monster_families",
    "ordinal_position": 2,
    "column_name": "name",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_families",
    "ordinal_position": 3,
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_families",
    "ordinal_position": 4,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monster_families",
    "ordinal_position": 5,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monster_families",
    "ordinal_position": 6,
    "column_name": "code",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 1,
    "column_name": "monster_task_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 2,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 3,
    "column_name": "boss_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 4,
    "column_name": "required_kills",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 5,
    "column_name": "reunlock_gold_cost",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 6,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monster_tasks",
    "ordinal_position": 7,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 1,
    "column_name": "monster_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 2,
    "column_name": "monster_family_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 3,
    "column_name": "name",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 4,
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 5,
    "column_name": "artwork",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 6,
    "column_name": "monster_type",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 7,
    "column_name": "level",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 8,
    "column_name": "health",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 9,
    "column_name": "attack",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 10,
    "column_name": "defense",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "monsters",
    "ordinal_position": 11,
    "column_name": "spell_power_percent",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "100.0000"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 12,
    "column_name": "cooldown_seconds",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 13,
    "column_name": "ability_chance_percent",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 14,
    "column_name": "gold_min",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 15,
    "column_name": "gold_max",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 16,
    "column_name": "loot_level_modifier",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 17,
    "column_name": "power_score",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 18,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 19,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "table_name": "monsters",
    "ordinal_position": 20,
    "column_name": "code",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  }
]

## Constraints
[
  {
    "table_name": "bestiary_entries",
    "constraint_name": "bestiary_entries_bestiary_entry_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "bestiary_entry_id IS NOT NULL"
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "bestiary_entries_character_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_id IS NOT NULL"
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "bestiary_entries_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "bestiary_entries_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "bestiary_entries_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "bestiary_entries_unlocked_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "unlocked_at IS NOT NULL"
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "fk_bestiary_entries_character",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "fk_bestiary_entries_monster",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "bestiary_entries",
    "constraint_name": "ux_bestiary_entries_character_monster",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_bestiary_statistics_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "bestiary_statistics_id IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_character_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_id IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_first_kill_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "first_kill_at IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_kill_count_not_null",
    "constraint_type": "CHECK",
    "check_clause": "kill_count IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_last_kill_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "last_kill_at IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_task_progress_not_null",
    "constraint_type": "CHECK",
    "check_clause": "task_progress IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_task_unlocked_not_null",
    "constraint_type": "CHECK",
    "check_clause": "task_unlocked IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "bestiary_statistics_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "chk_bestiary_statistics_dates",
    "constraint_type": "CHECK",
    "check_clause": "(last_kill_at >= first_kill_at)"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "chk_bestiary_statistics_kill_count",
    "constraint_type": "CHECK",
    "check_clause": "(kill_count >= 1)"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "chk_bestiary_statistics_task_progress",
    "constraint_type": "CHECK",
    "check_clause": "(task_progress >= 0)"
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "fk_bestiary_statistics_character",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "fk_bestiary_statistics_monster",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "bestiary_statistics",
    "constraint_name": "ux_bestiary_statistics_character_monster",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_additional_cooldown_seconds_not_null",
    "constraint_type": "CHECK",
    "check_clause": "additional_cooldown_seconds IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_boss_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "boss_id IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_boss_type_not_null",
    "constraint_type": "CHECK",
    "check_clause": "boss_type IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_loot_level_bonus_not_null",
    "constraint_type": "CHECK",
    "check_clause": "loot_level_bonus IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_unique_modifier_not_null",
    "constraint_type": "CHECK",
    "check_clause": "unique_modifier IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "bosses_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "bosses",
    "constraint_name": "chk_bosses_additional_cooldown",
    "constraint_type": "CHECK",
    "check_clause": "(additional_cooldown_seconds >= 0)"
  },
  {
    "table_name": "bosses",
    "constraint_name": "chk_bosses_loot_level_bonus",
    "constraint_type": "CHECK",
    "check_clause": "(loot_level_bonus >= 0)"
  },
  {
    "table_name": "bosses",
    "constraint_name": "chk_bosses_type",
    "constraint_type": "CHECK",
    "check_clause": "((boss_type)::text = ANY ((ARRAY['MiniBoss'::character varying, 'TaskBoss'::character varying, 'DailyBoss'::character varying])::text[]))"
  },
  {
    "table_name": "bosses",
    "constraint_name": "chk_bosses_unique_modifier",
    "constraint_type": "CHECK",
    "check_clause": "(unique_modifier >= (0)::numeric)"
  },
  {
    "table_name": "bosses",
    "constraint_name": "fk_bosses_monster",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "bosses",
    "constraint_name": "ux_bosses_monster_id",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_available_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "available_at IS NOT NULL"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_character_cooldown_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_cooldown_id IS NOT NULL"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_character_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_id IS NOT NULL"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_cooldown_type_not_null",
    "constraint_type": "CHECK",
    "check_clause": "cooldown_type IS NOT NULL"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "character_cooldowns_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "chk_character_cooldowns_target",
    "constraint_type": "CHECK",
    "check_clause": "((((cooldown_type)::text = 'Monster'::text) AND (target_id IS NOT NULL)) OR (((cooldown_type)::text = 'NpcHealer'::text) AND (target_id IS NULL)))"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "chk_character_cooldowns_type",
    "constraint_type": "CHECK",
    "check_clause": "((cooldown_type)::text = ANY ((ARRAY['Monster'::character varying, 'NpcHealer'::character varying])::text[]))"
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "fk_character_cooldowns_character",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "character_cooldowns",
    "constraint_name": "fk_character_cooldowns_target",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progre_character_daily_boss_progr_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_daily_boss_progress_id IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_attempts_date_not_null",
    "constraint_type": "CHECK",
    "check_clause": "attempts_date IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_attempts_used_today_not_null",
    "constraint_type": "CHECK",
    "check_clause": "attempts_used_today IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_character_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_id IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_daily_boss_definition_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "daily_boss_definition_id IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_total_attempts_not_null",
    "constraint_type": "CHECK",
    "check_clause": "total_attempts IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_total_victories_not_null",
    "constraint_type": "CHECK",
    "check_clause": "total_victories IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "character_daily_boss_progress_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "chk_character_daily_boss_attempts_today",
    "constraint_type": "CHECK",
    "check_clause": "(attempts_used_today >= 0)"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "chk_character_daily_boss_highest_tier",
    "constraint_type": "CHECK",
    "check_clause": "((highest_tier_defeated IS NULL) OR ((highest_tier_defeated >= 1) AND (highest_tier_defeated <= 3)))"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "chk_character_daily_boss_last_victory",
    "constraint_type": "CHECK",
    "check_clause": "((last_victory_at IS NULL) OR ((last_attempt_at IS NOT NULL) AND (last_victory_at <= last_attempt_at)))"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "chk_character_daily_boss_totals",
    "constraint_type": "CHECK",
    "check_clause": "((total_attempts >= 0) AND (total_victories >= 0) AND (total_victories <= total_attempts))"
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "fk_character_daily_boss_progress_character",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "fk_character_daily_boss_progress_definition",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "character_daily_boss_progress",
    "constraint_name": "ux_character_daily_boss_progress",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "chk_combat_sessions_end_state",
    "constraint_type": "CHECK",
    "check_clause": "((((status)::text = 'Active'::text) AND (ended_at IS NULL)) OR (((status)::text <> 'Active'::text) AND (ended_at IS NOT NULL) AND (ended_at >= started_at)))"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "chk_combat_sessions_resources",
    "constraint_type": "CHECK",
    "check_clause": "((character_health >= 0) AND (character_mana >= 0) AND (monster_health >= 0))"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "chk_combat_sessions_status",
    "constraint_type": "CHECK",
    "check_clause": "((status)::text = ANY ((ARRAY['Active'::character varying, 'Victory'::character varying, 'Defeat'::character varying, 'Abandoned'::character varying])::text[]))"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "chk_combat_sessions_turn",
    "constraint_type": "CHECK",
    "check_clause": "(current_turn >= 1)"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_character_health_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_health IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_character_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_id IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_character_mana_not_null",
    "constraint_type": "CHECK",
    "check_clause": "character_mana IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_combat_session_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "combat_session_id IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_current_turn_not_null",
    "constraint_type": "CHECK",
    "check_clause": "current_turn IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_monster_health_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_health IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_started_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "started_at IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_status_not_null",
    "constraint_type": "CHECK",
    "check_clause": "status IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "combat_sessions_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "fk_combat_sessions_character",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "combat_sessions",
    "constraint_name": "fk_combat_sessions_monster",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "chk_daily_boss_definitions_attempts",
    "constraint_type": "CHECK",
    "check_clause": "(attempts_per_day >= 1)"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "chk_daily_boss_definitions_recommended_level",
    "constraint_type": "CHECK",
    "check_clause": "(recommended_level >= 1)"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "chk_daily_boss_definitions_tier",
    "constraint_type": "CHECK",
    "check_clause": "((tier >= 1) AND (tier <= 3))"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_attempts_per_day_not_null",
    "constraint_type": "CHECK",
    "check_clause": "attempts_per_day IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_boss_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "boss_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_daily_boss_definition_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "daily_boss_definition_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_recommended_level_not_null",
    "constraint_type": "CHECK",
    "check_clause": "recommended_level IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_tier_not_null",
    "constraint_type": "CHECK",
    "check_clause": "tier IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "daily_boss_definitions_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "fk_daily_boss_definitions_boss",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_definitions",
    "constraint_name": "ux_daily_boss_definitions_boss_id",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "chk_daily_boss_pools_tier",
    "constraint_type": "CHECK",
    "check_clause": "((tier >= 1) AND (tier <= 3))"
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "daily_boss_pools_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "daily_boss_pools_daily_boss_definition_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "daily_boss_definition_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "daily_boss_pools_daily_boss_pool_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "daily_boss_pool_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "daily_boss_pools_is_active_not_null",
    "constraint_type": "CHECK",
    "check_clause": "is_active IS NOT NULL"
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "daily_boss_pools_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "daily_boss_pools_tier_not_null",
    "constraint_type": "CHECK",
    "check_clause": "tier IS NOT NULL"
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "fk_daily_boss_pools_definition",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_pools",
    "constraint_name": "ux_daily_boss_pools_tier_definition",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "chk_daily_boss_rotation_distinct",
    "constraint_type": "CHECK",
    "check_clause": "((tier_1_boss_id <> tier_2_boss_id) AND (tier_1_boss_id <> tier_3_boss_id) AND (tier_2_boss_id <> tier_3_boss_id))"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_daily_boss_rotation_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "daily_boss_rotation_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_reset_timestamp_not_null",
    "constraint_type": "CHECK",
    "check_clause": "reset_timestamp IS NOT NULL"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_tier_1_boss_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "tier_1_boss_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_tier_2_boss_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "tier_2_boss_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "daily_boss_rotation_tier_3_boss_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "tier_3_boss_id IS NOT NULL"
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "fk_daily_boss_rotation_tier_1",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "fk_daily_boss_rotation_tier_2",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "daily_boss_rotation",
    "constraint_name": "fk_daily_boss_rotation_tier_3",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "fk_monster_abilities_monster",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "fk_monster_abilities_spell",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "monster_abilities_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "monster_abilities_is_enabled_not_null",
    "constraint_type": "CHECK",
    "check_clause": "is_enabled IS NOT NULL"
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "monster_abilities_monster_ability_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_ability_id IS NOT NULL"
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "monster_abilities_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "monster_abilities_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "monster_abilities_spell_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "spell_id IS NOT NULL"
  },
  {
    "table_name": "monster_abilities",
    "constraint_name": "ux_monster_abilities_monster_spell",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "chk_monster_ability_weights_weight",
    "constraint_type": "CHECK",
    "check_clause": "(weight > (0)::numeric)"
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "fk_monster_ability_weights_ability",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "monster_ability_weights_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "monster_ability_weights_monster_ability_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_ability_id IS NOT NULL"
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "monster_ability_weights_monster_ability_weight_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_ability_weight_id IS NOT NULL"
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "monster_ability_weights_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_ability_weights",
    "constraint_name": "monster_ability_weights_weight_not_null",
    "constraint_type": "CHECK",
    "check_clause": "weight IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "chk_monster_families_code",
    "constraint_type": "CHECK",
    "check_clause": "((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_code_not_null",
    "constraint_type": "CHECK",
    "check_clause": "code IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_description_not_null",
    "constraint_type": "CHECK",
    "check_clause": "description IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_monster_family_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_family_id IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_name_not_null",
    "constraint_type": "CHECK",
    "check_clause": "name IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_families",
    "constraint_name": "monster_families_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "monster_families",
    "constraint_name": "ux_monster_families_code",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "monster_families",
    "constraint_name": "ux_monster_families_name",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "chk_monster_tasks_required_kills",
    "constraint_type": "CHECK",
    "check_clause": "(required_kills > 0)"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "chk_monster_tasks_reunlock_gold_cost",
    "constraint_type": "CHECK",
    "check_clause": "(reunlock_gold_cost >= 0)"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "fk_monster_tasks_boss",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "fk_monster_tasks_monster",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_boss_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "boss_id IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_monster_task_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_task_id IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_required_kills_not_null",
    "constraint_type": "CHECK",
    "check_clause": "required_kills IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_reunlock_gold_cost_not_null",
    "constraint_type": "CHECK",
    "check_clause": "reunlock_gold_cost IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "monster_tasks_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "monster_tasks",
    "constraint_name": "ux_monster_tasks_monster_id",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_ability_chance",
    "constraint_type": "CHECK",
    "check_clause": "((ability_chance_percent >= (0)::numeric) AND (ability_chance_percent <= (100)::numeric))"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_attack",
    "constraint_type": "CHECK",
    "check_clause": "(attack >= (0)::numeric)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_code",
    "constraint_type": "CHECK",
    "check_clause": "((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_cooldown",
    "constraint_type": "CHECK",
    "check_clause": "(cooldown_seconds >= 0)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_defense",
    "constraint_type": "CHECK",
    "check_clause": "(defense >= (0)::numeric)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_gold",
    "constraint_type": "CHECK",
    "check_clause": "((gold_min >= 0) AND (gold_max >= gold_min))"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_health",
    "constraint_type": "CHECK",
    "check_clause": "(health > 0)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_level",
    "constraint_type": "CHECK",
    "check_clause": "(level >= 1)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_power_score",
    "constraint_type": "CHECK",
    "check_clause": "(power_score >= 0)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_spell_power",
    "constraint_type": "CHECK",
    "check_clause": "(spell_power_percent >= (0)::numeric)"
  },
  {
    "table_name": "monsters",
    "constraint_name": "chk_monsters_type",
    "constraint_type": "CHECK",
    "check_clause": "((monster_type)::text = ANY ((ARRAY['Normal'::character varying, 'MiniBoss'::character varying, 'TaskBoss'::character varying, 'DailyBoss'::character varying])::text[]))"
  },
  {
    "table_name": "monsters",
    "constraint_name": "fk_monsters_family",
    "constraint_type": "FOREIGN KEY",
    "check_clause": null
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_ability_chance_percent_not_null",
    "constraint_type": "CHECK",
    "check_clause": "ability_chance_percent IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_attack_not_null",
    "constraint_type": "CHECK",
    "check_clause": "attack IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_code_not_null",
    "constraint_type": "CHECK",
    "check_clause": "code IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_cooldown_seconds_not_null",
    "constraint_type": "CHECK",
    "check_clause": "cooldown_seconds IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_created_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "created_at IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_defense_not_null",
    "constraint_type": "CHECK",
    "check_clause": "defense IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_description_not_null",
    "constraint_type": "CHECK",
    "check_clause": "description IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_gold_max_not_null",
    "constraint_type": "CHECK",
    "check_clause": "gold_max IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_gold_min_not_null",
    "constraint_type": "CHECK",
    "check_clause": "gold_min IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_health_not_null",
    "constraint_type": "CHECK",
    "check_clause": "health IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_level_not_null",
    "constraint_type": "CHECK",
    "check_clause": "level IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_loot_level_modifier_not_null",
    "constraint_type": "CHECK",
    "check_clause": "loot_level_modifier IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_monster_family_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_family_id IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_monster_id_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_id IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_monster_type_not_null",
    "constraint_type": "CHECK",
    "check_clause": "monster_type IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_name_not_null",
    "constraint_type": "CHECK",
    "check_clause": "name IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_pkey",
    "constraint_type": "PRIMARY KEY",
    "check_clause": null
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_power_score_not_null",
    "constraint_type": "CHECK",
    "check_clause": "power_score IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_spell_power_percent_not_null",
    "constraint_type": "CHECK",
    "check_clause": "spell_power_percent IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "monsters_updated_at_not_null",
    "constraint_type": "CHECK",
    "check_clause": "updated_at IS NOT NULL"
  },
  {
    "table_name": "monsters",
    "constraint_name": "ux_monsters_code",
    "constraint_type": "UNIQUE",
    "check_clause": null
  },
  {
    "table_name": "monsters",
    "constraint_name": "ux_monsters_name",
    "constraint_type": "UNIQUE",
    "check_clause": null
  }
]

## Foreign Keys
[
  {
    "table_name": "bestiary_entries",
    "column_name": "character_id",
    "referenced_table": "characters",
    "referenced_column": "character_id"
  },
  {
    "table_name": "bestiary_entries",
    "column_name": "monster_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "bestiary_statistics",
    "column_name": "character_id",
    "referenced_table": "characters",
    "referenced_column": "character_id"
  },
  {
    "table_name": "bestiary_statistics",
    "column_name": "monster_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "bosses",
    "column_name": "monster_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "character_cooldowns",
    "column_name": "character_id",
    "referenced_table": "characters",
    "referenced_column": "character_id"
  },
  {
    "table_name": "character_cooldowns",
    "column_name": "target_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "character_daily_boss_progress",
    "column_name": "character_id",
    "referenced_table": "characters",
    "referenced_column": "character_id"
  },
  {
    "table_name": "character_daily_boss_progress",
    "column_name": "daily_boss_definition_id",
    "referenced_table": "daily_boss_definitions",
    "referenced_column": "daily_boss_definition_id"
  },
  {
    "table_name": "combat_sessions",
    "column_name": "character_id",
    "referenced_table": "characters",
    "referenced_column": "character_id"
  },
  {
    "table_name": "combat_sessions",
    "column_name": "monster_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "daily_boss_definitions",
    "column_name": "boss_id",
    "referenced_table": "bosses",
    "referenced_column": "boss_id"
  },
  {
    "table_name": "daily_boss_pools",
    "column_name": "daily_boss_definition_id",
    "referenced_table": "daily_boss_definitions",
    "referenced_column": "daily_boss_definition_id"
  },
  {
    "table_name": "daily_boss_rotation",
    "column_name": "tier_1_boss_id",
    "referenced_table": "daily_boss_definitions",
    "referenced_column": "daily_boss_definition_id"
  },
  {
    "table_name": "daily_boss_rotation",
    "column_name": "tier_2_boss_id",
    "referenced_table": "daily_boss_definitions",
    "referenced_column": "daily_boss_definition_id"
  },
  {
    "table_name": "daily_boss_rotation",
    "column_name": "tier_3_boss_id",
    "referenced_table": "daily_boss_definitions",
    "referenced_column": "daily_boss_definition_id"
  },
  {
    "table_name": "monster_abilities",
    "column_name": "monster_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "monster_abilities",
    "column_name": "spell_id",
    "referenced_table": "spells",
    "referenced_column": "spell_id"
  },
  {
    "table_name": "monster_ability_weights",
    "column_name": "monster_ability_id",
    "referenced_table": "monster_abilities",
    "referenced_column": "monster_ability_id"
  },
  {
    "table_name": "monster_tasks",
    "column_name": "boss_id",
    "referenced_table": "bosses",
    "referenced_column": "boss_id"
  },
  {
    "table_name": "monster_tasks",
    "column_name": "monster_id",
    "referenced_table": "monsters",
    "referenced_column": "monster_id"
  },
  {
    "table_name": "monsters",
    "column_name": "monster_family_id",
    "referenced_table": "monster_families",
    "referenced_column": "monster_family_id"
  }
]

## Indexes
[
  {
    "table_name": "bestiary_entries",
    "index_name": "bestiary_entries_pkey",
    "index_definition": "CREATE UNIQUE INDEX bestiary_entries_pkey ON public.bestiary_entries USING btree (bestiary_entry_id)"
  },
  {
    "table_name": "bestiary_entries",
    "index_name": "ix_bestiary_entries_character_id",
    "index_definition": "CREATE INDEX ix_bestiary_entries_character_id ON public.bestiary_entries USING btree (character_id)"
  },
  {
    "table_name": "bestiary_entries",
    "index_name": "ix_bestiary_entries_monster_id",
    "index_definition": "CREATE INDEX ix_bestiary_entries_monster_id ON public.bestiary_entries USING btree (monster_id)"
  },
  {
    "table_name": "bestiary_entries",
    "index_name": "ux_bestiary_entries_character_monster",
    "index_definition": "CREATE UNIQUE INDEX ux_bestiary_entries_character_monster ON public.bestiary_entries USING btree (character_id, monster_id)"
  },
  {
    "table_name": "bestiary_statistics",
    "index_name": "bestiary_statistics_pkey",
    "index_definition": "CREATE UNIQUE INDEX bestiary_statistics_pkey ON public.bestiary_statistics USING btree (bestiary_statistics_id)"
  },
  {
    "table_name": "bestiary_statistics",
    "index_name": "ix_bestiary_statistics_character_id",
    "index_definition": "CREATE INDEX ix_bestiary_statistics_character_id ON public.bestiary_statistics USING btree (character_id)"
  },
  {
    "table_name": "bestiary_statistics",
    "index_name": "ix_bestiary_statistics_kill_count",
    "index_definition": "CREATE INDEX ix_bestiary_statistics_kill_count ON public.bestiary_statistics USING btree (kill_count)"
  },
  {
    "table_name": "bestiary_statistics",
    "index_name": "ix_bestiary_statistics_monster_id",
    "index_definition": "CREATE INDEX ix_bestiary_statistics_monster_id ON public.bestiary_statistics USING btree (monster_id)"
  },
  {
    "table_name": "bestiary_statistics",
    "index_name": "ux_bestiary_statistics_character_monster",
    "index_definition": "CREATE UNIQUE INDEX ux_bestiary_statistics_character_monster ON public.bestiary_statistics USING btree (character_id, monster_id)"
  },
  {
    "table_name": "bosses",
    "index_name": "bosses_pkey",
    "index_definition": "CREATE UNIQUE INDEX bosses_pkey ON public.bosses USING btree (boss_id)"
  },
  {
    "table_name": "bosses",
    "index_name": "ix_bosses_boss_type",
    "index_definition": "CREATE INDEX ix_bosses_boss_type ON public.bosses USING btree (boss_type)"
  },
  {
    "table_name": "bosses",
    "index_name": "ux_bosses_monster_id",
    "index_definition": "CREATE UNIQUE INDEX ux_bosses_monster_id ON public.bosses USING btree (monster_id)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "character_cooldowns_pkey",
    "index_definition": "CREATE UNIQUE INDEX character_cooldowns_pkey ON public.character_cooldowns USING btree (character_cooldown_id)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "ix_character_cooldowns_available_at",
    "index_definition": "CREATE INDEX ix_character_cooldowns_available_at ON public.character_cooldowns USING btree (available_at)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "ix_character_cooldowns_character_id",
    "index_definition": "CREATE INDEX ix_character_cooldowns_character_id ON public.character_cooldowns USING btree (character_id)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "ix_character_cooldowns_cooldown_type",
    "index_definition": "CREATE INDEX ix_character_cooldowns_cooldown_type ON public.character_cooldowns USING btree (cooldown_type)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "ix_character_cooldowns_target_id",
    "index_definition": "CREATE INDEX ix_character_cooldowns_target_id ON public.character_cooldowns USING btree (target_id)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "ux_character_cooldowns_monster",
    "index_definition": "CREATE UNIQUE INDEX ux_character_cooldowns_monster ON public.character_cooldowns USING btree (character_id, target_id) WHERE ((cooldown_type)::text = 'Monster'::text)"
  },
  {
    "table_name": "character_cooldowns",
    "index_name": "ux_character_cooldowns_npc_healer",
    "index_definition": "CREATE UNIQUE INDEX ux_character_cooldowns_npc_healer ON public.character_cooldowns USING btree (character_id) WHERE ((cooldown_type)::text = 'NpcHealer'::text)"
  },
  {
    "table_name": "character_daily_boss_progress",
    "index_name": "character_daily_boss_progress_pkey",
    "index_definition": "CREATE UNIQUE INDEX character_daily_boss_progress_pkey ON public.character_daily_boss_progress USING btree (character_daily_boss_progress_id)"
  },
  {
    "table_name": "character_daily_boss_progress",
    "index_name": "ix_character_daily_boss_progress_attempts_date",
    "index_definition": "CREATE INDEX ix_character_daily_boss_progress_attempts_date ON public.character_daily_boss_progress USING btree (attempts_date)"
  },
  {
    "table_name": "character_daily_boss_progress",
    "index_name": "ix_character_daily_boss_progress_character_id",
    "index_definition": "CREATE INDEX ix_character_daily_boss_progress_character_id ON public.character_daily_boss_progress USING btree (character_id)"
  },
  {
    "table_name": "character_daily_boss_progress",
    "index_name": "ix_character_daily_boss_progress_definition_id",
    "index_definition": "CREATE INDEX ix_character_daily_boss_progress_definition_id ON public.character_daily_boss_progress USING btree (daily_boss_definition_id)"
  },
  {
    "table_name": "character_daily_boss_progress",
    "index_name": "ux_character_daily_boss_progress",
    "index_definition": "CREATE UNIQUE INDEX ux_character_daily_boss_progress ON public.character_daily_boss_progress USING btree (character_id, daily_boss_definition_id)"
  },
  {
    "table_name": "combat_sessions",
    "index_name": "combat_sessions_pkey",
    "index_definition": "CREATE UNIQUE INDEX combat_sessions_pkey ON public.combat_sessions USING btree (combat_session_id)"
  },
  {
    "table_name": "combat_sessions",
    "index_name": "ix_combat_sessions_character_id",
    "index_definition": "CREATE INDEX ix_combat_sessions_character_id ON public.combat_sessions USING btree (character_id)"
  },
  {
    "table_name": "combat_sessions",
    "index_name": "ix_combat_sessions_monster_id",
    "index_definition": "CREATE INDEX ix_combat_sessions_monster_id ON public.combat_sessions USING btree (monster_id)"
  },
  {
    "table_name": "combat_sessions",
    "index_name": "ix_combat_sessions_status",
    "index_definition": "CREATE INDEX ix_combat_sessions_status ON public.combat_sessions USING btree (status)"
  },
  {
    "table_name": "combat_sessions",
    "index_name": "ux_combat_sessions_active_character",
    "index_definition": "CREATE UNIQUE INDEX ux_combat_sessions_active_character ON public.combat_sessions USING btree (character_id) WHERE ((status)::text = 'Active'::text)"
  },
  {
    "table_name": "daily_boss_definitions",
    "index_name": "daily_boss_definitions_pkey",
    "index_definition": "CREATE UNIQUE INDEX daily_boss_definitions_pkey ON public.daily_boss_definitions USING btree (daily_boss_definition_id)"
  },
  {
    "table_name": "daily_boss_definitions",
    "index_name": "ix_daily_boss_definitions_tier",
    "index_definition": "CREATE INDEX ix_daily_boss_definitions_tier ON public.daily_boss_definitions USING btree (tier)"
  },
  {
    "table_name": "daily_boss_definitions",
    "index_name": "ux_daily_boss_definitions_boss_id",
    "index_definition": "CREATE UNIQUE INDEX ux_daily_boss_definitions_boss_id ON public.daily_boss_definitions USING btree (boss_id)"
  },
  {
    "table_name": "daily_boss_pools",
    "index_name": "daily_boss_pools_pkey",
    "index_definition": "CREATE UNIQUE INDEX daily_boss_pools_pkey ON public.daily_boss_pools USING btree (daily_boss_pool_id)"
  },
  {
    "table_name": "daily_boss_pools",
    "index_name": "ix_daily_boss_pools_active_tier",
    "index_definition": "CREATE INDEX ix_daily_boss_pools_active_tier ON public.daily_boss_pools USING btree (tier) WHERE (is_active = true)"
  },
  {
    "table_name": "daily_boss_pools",
    "index_name": "ix_daily_boss_pools_definition_id",
    "index_definition": "CREATE INDEX ix_daily_boss_pools_definition_id ON public.daily_boss_pools USING btree (daily_boss_definition_id)"
  },
  {
    "table_name": "daily_boss_pools",
    "index_name": "ix_daily_boss_pools_tier",
    "index_definition": "CREATE INDEX ix_daily_boss_pools_tier ON public.daily_boss_pools USING btree (tier)"
  },
  {
    "table_name": "daily_boss_pools",
    "index_name": "ux_daily_boss_pools_tier_definition",
    "index_definition": "CREATE UNIQUE INDEX ux_daily_boss_pools_tier_definition ON public.daily_boss_pools USING btree (tier, daily_boss_definition_id)"
  },
  {
    "table_name": "daily_boss_rotation",
    "index_name": "daily_boss_rotation_pkey",
    "index_definition": "CREATE UNIQUE INDEX daily_boss_rotation_pkey ON public.daily_boss_rotation USING btree (daily_boss_rotation_id)"
  },
  {
    "table_name": "daily_boss_rotation",
    "index_name": "ix_daily_boss_rotation_reset_timestamp",
    "index_definition": "CREATE INDEX ix_daily_boss_rotation_reset_timestamp ON public.daily_boss_rotation USING btree (reset_timestamp)"
  },
  {
    "table_name": "monster_abilities",
    "index_name": "ix_monster_abilities_monster_id",
    "index_definition": "CREATE INDEX ix_monster_abilities_monster_id ON public.monster_abilities USING btree (monster_id)"
  },
  {
    "table_name": "monster_abilities",
    "index_name": "ix_monster_abilities_spell_id",
    "index_definition": "CREATE INDEX ix_monster_abilities_spell_id ON public.monster_abilities USING btree (spell_id)"
  },
  {
    "table_name": "monster_abilities",
    "index_name": "monster_abilities_pkey",
    "index_definition": "CREATE UNIQUE INDEX monster_abilities_pkey ON public.monster_abilities USING btree (monster_ability_id)"
  },
  {
    "table_name": "monster_abilities",
    "index_name": "ux_monster_abilities_monster_spell",
    "index_definition": "CREATE UNIQUE INDEX ux_monster_abilities_monster_spell ON public.monster_abilities USING btree (monster_id, spell_id)"
  },
  {
    "table_name": "monster_ability_weights",
    "index_name": "ix_monster_ability_weights_ability_id",
    "index_definition": "CREATE INDEX ix_monster_ability_weights_ability_id ON public.monster_ability_weights USING btree (monster_ability_id)"
  },
  {
    "table_name": "monster_ability_weights",
    "index_name": "monster_ability_weights_pkey",
    "index_definition": "CREATE UNIQUE INDEX monster_ability_weights_pkey ON public.monster_ability_weights USING btree (monster_ability_weight_id)"
  },
  {
    "table_name": "monster_families",
    "index_name": "monster_families_pkey",
    "index_definition": "CREATE UNIQUE INDEX monster_families_pkey ON public.monster_families USING btree (monster_family_id)"
  },
  {
    "table_name": "monster_families",
    "index_name": "ux_monster_families_code",
    "index_definition": "CREATE UNIQUE INDEX ux_monster_families_code ON public.monster_families USING btree (code)"
  },
  {
    "table_name": "monster_families",
    "index_name": "ux_monster_families_name",
    "index_definition": "CREATE UNIQUE INDEX ux_monster_families_name ON public.monster_families USING btree (name)"
  },
  {
    "table_name": "monster_tasks",
    "index_name": "ix_monster_tasks_boss_id",
    "index_definition": "CREATE INDEX ix_monster_tasks_boss_id ON public.monster_tasks USING btree (boss_id)"
  },
  {
    "table_name": "monster_tasks",
    "index_name": "monster_tasks_pkey",
    "index_definition": "CREATE UNIQUE INDEX monster_tasks_pkey ON public.monster_tasks USING btree (monster_task_id)"
  },
  {
    "table_name": "monster_tasks",
    "index_name": "ux_monster_tasks_monster_id",
    "index_definition": "CREATE UNIQUE INDEX ux_monster_tasks_monster_id ON public.monster_tasks USING btree (monster_id)"
  },
  {
    "table_name": "monsters",
    "index_name": "ix_monsters_family_id",
    "index_definition": "CREATE INDEX ix_monsters_family_id ON public.monsters USING btree (monster_family_id)"
  },
  {
    "table_name": "monsters",
    "index_name": "ix_monsters_level",
    "index_definition": "CREATE INDEX ix_monsters_level ON public.monsters USING btree (level)"
  },
  {
    "table_name": "monsters",
    "index_name": "ix_monsters_type",
    "index_definition": "CREATE INDEX ix_monsters_type ON public.monsters USING btree (monster_type)"
  },
  {
    "table_name": "monsters",
    "index_name": "monsters_pkey",
    "index_definition": "CREATE UNIQUE INDEX monsters_pkey ON public.monsters USING btree (monster_id)"
  },
  {
    "table_name": "monsters",
    "index_name": "ux_monsters_code",
    "index_definition": "CREATE UNIQUE INDEX ux_monsters_code ON public.monsters USING btree (code)"
  },
  {
    "table_name": "monsters",
    "index_name": "ux_monsters_name",
    "index_definition": "CREATE UNIQUE INDEX ux_monsters_name ON public.monsters USING btree (name)"
  }
]

## Monster Families
[
  {
    "monster_family_id": "06b74568-d796-4882-bd54-dc0a100db3eb",
    "name": "Dev Family 9",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_09"
  },
  {
    "monster_family_id": "078b00f4-5f93-4b11-82e4-ac099ca99171",
    "name": "Dev Family 6",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_06"
  },
  {
    "monster_family_id": "08396aea-bec2-4bb2-8b3a-53d288ac8642",
    "name": "Dev Family 5",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_05"
  },
  {
    "monster_family_id": "162d7519-dbaf-4d39-9b51-df26b37caf46",
    "name": "Dev Family 10",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_10"
  },
  {
    "monster_family_id": "21bae56c-e86a-465c-80fe-a17f3bdc11de",
    "name": "Dev Family 8",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_08"
  },
  {
    "monster_family_id": "51c276cd-c176-4a1e-9a2f-fd194601ac40",
    "name": "Dev Family 1",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_01"
  },
  {
    "monster_family_id": "b1b071bd-03dc-4706-933d-f9fa35a716d2",
    "name": "Dev Family 3",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_03"
  },
  {
    "monster_family_id": "d58cb9d5-7368-4856-a66e-50ca50dacf23",
    "name": "Dev Family 7",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_07"
  },
  {
    "monster_family_id": "dcc243e9-52e9-44f1-9a8b-acb3a5d634cd",
    "name": "Dev Family 2",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_02"
  },
  {
    "monster_family_id": "f8a39722-6e91-48d2-aa62-a5a37297361f",
    "name": "Dev Family 4",
    "description": "Synthetic development monster family.",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_family_04"
  }
]

## Monsters
[
  {
    "monster_id": "23127f7f-8100-4e4b-8219-f194e38f0b50",
    "monster_family_id": "51c276cd-c176-4a1e-9a2f-fd194601ac40",
    "name": "Dev Monster 1",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_01",
    "monster_type": "Normal",
    "level": 1,
    "health": "100",
    "attack": "5.0000",
    "defense": "2.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "10",
    "gold_max": "20",
    "loot_level_modifier": 0,
    "power_score": "100",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_01"
  },
  {
    "monster_id": "f19ce986-8403-49b6-af07-d96dd1df9571",
    "monster_family_id": "dcc243e9-52e9-44f1-9a8b-acb3a5d634cd",
    "name": "Dev Monster 2",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_02",
    "monster_type": "Normal",
    "level": 2,
    "health": "200",
    "attack": "10.0000",
    "defense": "4.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "20",
    "gold_max": "40",
    "loot_level_modifier": 0,
    "power_score": "200",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_02"
  },
  {
    "monster_id": "ec82f5c0-feb5-4836-98e4-99fd022fd6a4",
    "monster_family_id": "b1b071bd-03dc-4706-933d-f9fa35a716d2",
    "name": "Dev Monster 3",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_03",
    "monster_type": "Normal",
    "level": 3,
    "health": "300",
    "attack": "15.0000",
    "defense": "6.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "30",
    "gold_max": "60",
    "loot_level_modifier": 0,
    "power_score": "300",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_03"
  },
  {
    "monster_id": "db3df402-36c9-4f04-844c-fd01af802e1b",
    "monster_family_id": "f8a39722-6e91-48d2-aa62-a5a37297361f",
    "name": "Dev Monster 4",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_04",
    "monster_type": "Normal",
    "level": 4,
    "health": "400",
    "attack": "20.0000",
    "defense": "8.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "40",
    "gold_max": "80",
    "loot_level_modifier": 0,
    "power_score": "400",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_04"
  },
  {
    "monster_id": "debbca8d-803d-4dbe-afb6-97d48ffeb07b",
    "monster_family_id": "08396aea-bec2-4bb2-8b3a-53d288ac8642",
    "name": "Dev Monster 5",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_05",
    "monster_type": "Normal",
    "level": 5,
    "health": "500",
    "attack": "25.0000",
    "defense": "10.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "50",
    "gold_max": "100",
    "loot_level_modifier": 0,
    "power_score": "500",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_05"
  },
  {
    "monster_id": "58e52fbf-574f-4e0d-abeb-e29b496ca3cd",
    "monster_family_id": "078b00f4-5f93-4b11-82e4-ac099ca99171",
    "name": "Dev Monster 6",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_06",
    "monster_type": "Normal",
    "level": 6,
    "health": "600",
    "attack": "30.0000",
    "defense": "12.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "60",
    "gold_max": "120",
    "loot_level_modifier": 0,
    "power_score": "600",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_06"
  },
  {
    "monster_id": "7f88afdc-61d5-4578-899d-b34b953a2f20",
    "monster_family_id": "d58cb9d5-7368-4856-a66e-50ca50dacf23",
    "name": "Dev Monster 7",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_07",
    "monster_type": "Normal",
    "level": 7,
    "health": "700",
    "attack": "35.0000",
    "defense": "14.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "70",
    "gold_max": "140",
    "loot_level_modifier": 0,
    "power_score": "700",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_07"
  },
  {
    "monster_id": "3794851d-533f-45a9-87ab-2a769ffa7f74",
    "monster_family_id": "21bae56c-e86a-465c-80fe-a17f3bdc11de",
    "name": "Dev Monster 8",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_08",
    "monster_type": "MiniBoss",
    "level": 8,
    "health": "800",
    "attack": "40.0000",
    "defense": "16.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "80",
    "gold_max": "160",
    "loot_level_modifier": 0,
    "power_score": "800",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_08"
  },
  {
    "monster_id": "63645953-9778-4fa8-8ae5-da7df11cf432",
    "monster_family_id": "06b74568-d796-4882-bd54-dc0a100db3eb",
    "name": "Dev Monster 9",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_09",
    "monster_type": "TaskBoss",
    "level": 9,
    "health": "900",
    "attack": "45.0000",
    "defense": "18.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "90",
    "gold_max": "180",
    "loot_level_modifier": 0,
    "power_score": "900",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_09"
  },
  {
    "monster_id": "786fbc48-90db-470e-9ca6-f74fec612aa5",
    "monster_family_id": "162d7519-dbaf-4d39-9b51-df26b37caf46",
    "name": "Dev Monster 10",
    "description": "Synthetic development monster.",
    "artwork": "monsters/dev_monster_10",
    "monster_type": "DailyBoss",
    "level": 10,
    "health": "1000",
    "attack": "50.0000",
    "defense": "20.0000",
    "spell_power_percent": "100.0000",
    "cooldown_seconds": 0,
    "ability_chance_percent": "25.0000",
    "gold_min": "100",
    "gold_max": "200",
    "loot_level_modifier": 0,
    "power_score": "1000",
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z",
    "code": "dev_monster_10"
  }
]

## Bosses
[
  {
    "boss_id": "302a0d3a-e3a7-42e0-9a56-61518335ba7a",
    "monster_id": "63645953-9778-4fa8-8ae5-da7df11cf432",
    "boss_type": "TaskBoss",
    "loot_level_bonus": 2,
    "unique_modifier": "1.0000",
    "additional_cooldown_seconds": 60,
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z"
  },
  {
    "boss_id": "4bb964d8-bbd5-49c6-9950-4981eca4ca71",
    "monster_id": "786fbc48-90db-470e-9ca6-f74fec612aa5",
    "boss_type": "DailyBoss",
    "loot_level_bonus": 3,
    "unique_modifier": "1.0000",
    "additional_cooldown_seconds": 120,
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z"
  },
  {
    "boss_id": "84df623d-ff9b-4aec-8ddc-e3e71a252530",
    "monster_id": "3794851d-533f-45a9-87ab-2a769ffa7f74",
    "boss_type": "MiniBoss",
    "loot_level_bonus": 1,
    "unique_modifier": "1.0000",
    "additional_cooldown_seconds": 0,
    "created_at": "2026-10-06T11:18:55.926Z",
    "updated_at": "2026-10-06T11:19:39.990Z"
  }
]
