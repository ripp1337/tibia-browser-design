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
