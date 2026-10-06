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
