-- 069_friend_requests.sql
-- Requires: accounts
CREATE TABLE friend_requests (
 friend_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_account_id UUID NOT NULL,
 recipient_account_id UUID NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Pending',
 sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 responded_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_friend_requests_sender FOREIGN KEY (sender_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_friend_requests_recipient FOREIGN KEY (recipient_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT chk_friend_requests_not_self CHECK (sender_account_id<>recipient_account_id),
 CONSTRAINT chk_friend_requests_status CHECK (status IN ('Pending','Accepted','Rejected','Cancelled')),
 CONSTRAINT chk_friend_requests_response CHECK ((status='Pending' AND responded_at IS NULL) OR (status<>'Pending' AND responded_at IS NOT NULL AND responded_at>=sent_at))
);
CREATE UNIQUE INDEX ux_friend_requests_pending_pair ON friend_requests(sender_account_id,recipient_account_id) WHERE status='Pending';
CREATE INDEX ix_friend_requests_sender_id ON friend_requests(sender_account_id);
CREATE INDEX ix_friend_requests_recipient_id ON friend_requests(recipient_account_id);
CREATE INDEX ix_friend_requests_status ON friend_requests(status);
