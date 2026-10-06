-- 068_account_friends.sql
-- Requires: accounts
CREATE TABLE account_friends (
 account_friend_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 friend_account_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_account_friends_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_account_friends_friend FOREIGN KEY (friend_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT ux_account_friends_pair UNIQUE (account_id,friend_account_id),
 CONSTRAINT chk_account_friends_not_self CHECK (account_id<>friend_account_id)
);
CREATE INDEX ix_account_friends_account_id ON account_friends(account_id);
CREATE INDEX ix_account_friends_friend_account_id ON account_friends(friend_account_id);
