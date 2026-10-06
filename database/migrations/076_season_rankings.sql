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