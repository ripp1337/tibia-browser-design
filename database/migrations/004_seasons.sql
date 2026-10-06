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
