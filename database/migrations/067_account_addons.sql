-- 067_account_addons.sql
-- Requires: accounts, addon_definitions
CREATE TABLE account_addons (
 account_addon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 addon_definition_id UUID NOT NULL,
 unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_account_addons_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_account_addons_addon FOREIGN KEY (addon_definition_id) REFERENCES addon_definitions(addon_definition_id) ON DELETE RESTRICT,
 CONSTRAINT ux_account_addons_account_addon UNIQUE (account_id,addon_definition_id)
);
CREATE INDEX ix_account_addons_account_id ON account_addons(account_id);
CREATE INDEX ix_account_addons_addon_id ON account_addons(addon_definition_id);
