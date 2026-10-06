-- 061_admin_actions.sql
-- Requires: accounts
CREATE TABLE admin_actions (
 admin_action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 admin_user VARCHAR(100) NOT NULL,
 action_type VARCHAR(64) NOT NULL,
 account_id UUID NULL,
 target_entity_type VARCHAR(64) NULL,
 target_entity_id UUID NULL,
 reason TEXT NULL,
 action_data JSONB NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_admin_actions_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
 CONSTRAINT chk_admin_actions_target CHECK ((target_entity_type IS NULL AND target_entity_id IS NULL) OR (target_entity_type IS NOT NULL AND target_entity_id IS NOT NULL))
);
CREATE INDEX ix_admin_actions_account_id ON admin_actions(account_id);
CREATE INDEX ix_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX ix_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX ix_admin_actions_target ON admin_actions(target_entity_type,target_entity_id);
