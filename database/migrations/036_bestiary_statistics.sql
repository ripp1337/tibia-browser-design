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
