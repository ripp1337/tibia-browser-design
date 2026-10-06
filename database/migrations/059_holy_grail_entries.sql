-- 059_holy_grail_entries.sql
-- Requires: accounts, unique_templates, set_templates, characters, seasons
CREATE TABLE holy_grail_entries (
 holy_grail_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 unique_template_id UUID NULL,
 set_template_id UUID NULL,
 found_by_character_id UUID NULL,
 found_season_id UUID NULL,
 first_found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_holy_grail_entries_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_holy_grail_entries_unique FOREIGN KEY (unique_template_id) REFERENCES unique_templates(unique_template_id) ON DELETE RESTRICT,
 CONSTRAINT fk_holy_grail_entries_set FOREIGN KEY (set_template_id) REFERENCES set_templates(set_template_id) ON DELETE RESTRICT,
 CONSTRAINT fk_holy_grail_entries_character FOREIGN KEY (found_by_character_id) REFERENCES characters(character_id) ON DELETE SET NULL,
 CONSTRAINT fk_holy_grail_entries_season FOREIGN KEY (found_season_id) REFERENCES seasons(season_id) ON DELETE SET NULL,
 CONSTRAINT chk_holy_grail_entries_target CHECK ((unique_template_id IS NOT NULL)::integer + (set_template_id IS NOT NULL)::integer = 1)
);
CREATE UNIQUE INDEX ux_holy_grail_entries_account_unique ON holy_grail_entries(account_id,unique_template_id) WHERE unique_template_id IS NOT NULL;
CREATE UNIQUE INDEX ux_holy_grail_entries_account_set ON holy_grail_entries(account_id,set_template_id) WHERE set_template_id IS NOT NULL;
CREATE INDEX ix_holy_grail_entries_account_id ON holy_grail_entries(account_id);
CREATE INDEX ix_holy_grail_entries_unique_id ON holy_grail_entries(unique_template_id);
CREATE INDEX ix_holy_grail_entries_set_id ON holy_grail_entries(set_template_id);
