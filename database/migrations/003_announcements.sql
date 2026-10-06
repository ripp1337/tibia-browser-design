-- =====================================================
-- 003_announcements.sql
-- =====================================================

CREATE TABLE announcements (
    announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    published_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_announcements_priority
        CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),

    CONSTRAINT chk_announcements_expiration
        CHECK (
            expires_at IS NULL
            OR published_at IS NULL
            OR expires_at > published_at
        )
);

CREATE INDEX ix_announcements_is_active
    ON announcements(is_active);

CREATE INDEX ix_announcements_published_at
    ON announcements(published_at);

CREATE INDEX ix_announcements_expires_at
    ON announcements(expires_at);
