-- 070_private_messages.sql
-- Requires: accounts
CREATE TABLE private_messages (
 private_message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_account_id UUID NOT NULL,
 recipient_account_id UUID NOT NULL,
 subject VARCHAR(200) NOT NULL,
 message_body TEXT NOT NULL,
 is_read BOOLEAN NOT NULL DEFAULT FALSE,
 sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 read_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_private_messages_sender FOREIGN KEY (sender_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_private_messages_recipient FOREIGN KEY (recipient_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT chk_private_messages_not_self CHECK (sender_account_id<>recipient_account_id),
 CONSTRAINT chk_private_messages_read_state CHECK ((is_read=FALSE AND read_at IS NULL) OR (is_read=TRUE AND read_at IS NOT NULL AND read_at>=sent_at))
);
CREATE INDEX ix_private_messages_sender_id ON private_messages(sender_account_id);
CREATE INDEX ix_private_messages_recipient_id ON private_messages(recipient_account_id);
CREATE INDEX ix_private_messages_is_read ON private_messages(is_read);
CREATE INDEX ix_private_messages_sent_at ON private_messages(sent_at);
