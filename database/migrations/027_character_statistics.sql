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
