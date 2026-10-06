-- 073_mail_templates.sql
CREATE TABLE mail_templates (
 mail_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 code VARCHAR(64) NOT NULL UNIQUE,
 subject_template TEXT NOT NULL,
 body_template TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
