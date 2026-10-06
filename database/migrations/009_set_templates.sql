-- =====================================================
-- 009_set_templates.sql
-- =====================================================

CREATE TABLE set_templates (
    set_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    required_pieces INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_set_templates_name UNIQUE (name),

    CONSTRAINT chk_set_templates_required_pieces
        CHECK (required_pieces >= 2)
);
