-- =====================================================
-- 001_accounts.sql
-- =====================================================

CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(32) NOT NULL,
    email VARCHAR(255) NULL,
    password_hash TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NULL,

    CONSTRAINT ux_accounts_username UNIQUE (username),
    CONSTRAINT ux_accounts_email UNIQUE (email),

    CONSTRAINT chk_accounts_status
        CHECK (status IN ('Active', 'Suspended', 'Banned', 'Deleted'))
);

CREATE INDEX ix_accounts_status
    ON accounts(status);

CREATE INDEX ix_accounts_created_at
    ON accounts(created_at);
