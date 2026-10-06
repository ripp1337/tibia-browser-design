-- =====================================================
-- 062_punishments.sql
-- Requires: accounts
-- =====================================================

CREATE TABLE punishments (
    punishment_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL,

    punishment_type VARCHAR(32) NOT NULL,

    reason TEXT NOT NULL,
    issued_by VARCHAR(100) NOT NULL,

    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    removed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_punishments_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_punishments_type
        CHECK (
            punishment_type IN (
                'Warning',
                'Mute',
                'TemporaryBan',
                'PermanentBan'
            )
        ),

    CONSTRAINT chk_punishments_expiration_order
        CHECK (
            expires_at IS NULL
            OR expires_at > issued_at
        ),

    CONSTRAINT chk_punishments_expiration_type
        CHECK (
            (
                punishment_type = 'TemporaryBan'
                AND expires_at IS NOT NULL
            )
            OR
            (
                punishment_type = 'PermanentBan'
                AND expires_at IS NULL
            )
            OR
            punishment_type IN (
                'Warning',
                'Mute'
            )
        ),

    CONSTRAINT chk_punishments_removed_at
        CHECK (
            removed_at IS NULL
            OR removed_at >= issued_at
        ),

    CONSTRAINT chk_punishments_active_state
        CHECK (
            is_active = TRUE
            OR removed_at IS NOT NULL
            OR (
                expires_at IS NOT NULL
                AND expires_at <= NOW()
            )
        )
);

CREATE INDEX ix_punishments_account_id
    ON punishments(account_id);

CREATE INDEX ix_punishments_type
    ON punishments(punishment_type);

CREATE INDEX ix_punishments_is_active
    ON punishments(is_active);

CREATE INDEX ix_punishments_expires_at
    ON punishments(expires_at);