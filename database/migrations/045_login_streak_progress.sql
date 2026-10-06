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
