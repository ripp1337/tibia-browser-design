-- 066_account_outfits.sql
-- Requires: accounts, outfit_definitions
CREATE TABLE account_outfits (
 account_outfit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 outfit_definition_id UUID NOT NULL,
 unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_account_outfits_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_account_outfits_outfit FOREIGN KEY (outfit_definition_id) REFERENCES outfit_definitions(outfit_definition_id) ON DELETE RESTRICT,
 CONSTRAINT ux_account_outfits_account_outfit UNIQUE (account_id,outfit_definition_id)
);
CREATE INDEX ix_account_outfits_account_id ON account_outfits(account_id);
CREATE INDEX ix_account_outfits_outfit_id ON account_outfits(outfit_definition_id);
