-- 077_hall_of_fame.sql
-- Requires: seasons, characters
CREATE TABLE hall_of_fame (
 hall_of_fame_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 season_id UUID NOT NULL,
 character_id UUID NULL,
 character_name VARCHAR(32) NOT NULL,
 rank_position INTEGER NOT NULL,
 final_level INTEGER NOT NULL,
 final_experience BIGINT NOT NULL,
 achievement_score BIGINT NOT NULL DEFAULT 0,
 holy_grail_percent NUMERIC(7,4) NOT NULL DEFAULT 0,
 total_playtime_seconds BIGINT NOT NULL DEFAULT 0,
 total_deaths BIGINT NOT NULL DEFAULT 0,
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_hall_of_fame_season FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE RESTRICT,
 CONSTRAINT fk_hall_of_fame_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE SET NULL,
 CONSTRAINT ux_hall_of_fame_season_rank UNIQUE (season_id,rank_position),
 CONSTRAINT chk_hall_of_fame_rank CHECK (rank_position>=1),
 CONSTRAINT chk_hall_of_fame_level CHECK (final_level>=1),
 CONSTRAINT chk_hall_of_fame_experience CHECK (final_experience>=0),
 CONSTRAINT chk_hall_of_fame_score CHECK (achievement_score>=0),
 CONSTRAINT chk_hall_of_fame_grail CHECK (holy_grail_percent>=0 AND holy_grail_percent<=100),
 CONSTRAINT chk_hall_of_fame_playtime CHECK (total_playtime_seconds>=0),
 CONSTRAINT chk_hall_of_fame_deaths CHECK (total_deaths>=0)
);
CREATE INDEX ix_hall_of_fame_season_id ON hall_of_fame(season_id);
CREATE INDEX ix_hall_of_fame_character_id ON hall_of_fame(character_id);
CREATE INDEX ix_hall_of_fame_rank_position ON hall_of_fame(rank_position);
