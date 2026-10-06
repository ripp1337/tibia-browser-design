-- =====================================================
-- 074_mail_messages.sql
-- Requires: characters
-- =====================================================

CREATE TABLE mail_messages (
    mail_message_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,

    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,

    message_type VARCHAR(32) NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    expires_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_mail_messages_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_mail_messages_type
        CHECK (
            message_type IN (
                'MarketplaceSale',
                'MarketplacePurchase',
                'AchievementReward',
                'DailyBossReward',
                'SeasonReward',
                'CraftingReward',
                'AdminMessage',
                'SystemMessage'
            )
        ),

    CONSTRAINT chk_mail_messages_read_state
        CHECK (
            (
                is_read = FALSE
                AND read_at IS NULL
            )
            OR
            (
                is_read = TRUE
                AND read_at IS NOT NULL
                AND read_at >= created_at
            )
        ),

    CONSTRAINT chk_mail_messages_expiration
        CHECK (
            expires_at IS NULL
            OR expires_at > created_at
        )
);

CREATE INDEX ix_mail_messages_character_id
    ON mail_messages(character_id);

CREATE INDEX ix_mail_messages_is_read
    ON mail_messages(is_read);

CREATE INDEX ix_mail_messages_type
    ON mail_messages(message_type);

CREATE INDEX ix_mail_messages_expires_at
    ON mail_messages(expires_at);