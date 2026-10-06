-- =====================================================
-- 016_account_sessions.sql
-- Requires: accounts
-- =====================================================

CREATE TABLE account_sessions (
    account_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,

    session_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT NULL,

    ip_address INET NULL,
    user_agent TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_account_sessions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_account_sessions_session_token_hash
        UNIQUE (session_token_hash),

    CONSTRAINT ux_account_sessions_refresh_token_hash
        UNIQUE (refresh_token_hash),

    CONSTRAINT chk_account_sessions_expiration
        CHECK (expires_at > created_at),

    CONSTRAINT chk_account_sessions_activity
        CHECK (last_activity_at >= created_at),

    CONSTRAINT chk_account_sessions_revocation
        CHECK (
            (is_revoked = FALSE AND revoked_at IS NULL)
            OR
            (is_revoked = TRUE AND revoked_at IS NOT NULL AND revoked_at >= created_at)
        )
);

CREATE INDEX ix_account_sessions_account_id
    ON account_sessions(account_id);

CREATE INDEX ix_account_sessions_expires_at
    ON account_sessions(expires_at);

CREATE INDEX ix_account_sessions_last_activity_at
    ON account_sessions(last_activity_at);

CREATE INDEX ix_account_sessions_is_revoked
    ON account_sessions(is_revoked);
