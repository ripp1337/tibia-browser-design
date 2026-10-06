-- 060_set_progress.sql
-- Requires: accounts, set_templates
CREATE TABLE set_progress (
 set_progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id UUID NOT NULL,
 set_template_id UUID NOT NULL,
 pieces_discovered INTEGER NOT NULL DEFAULT 0,
 total_pieces_required INTEGER NOT NULL,
 is_completed BOOLEAN NOT NULL DEFAULT FALSE,
 completed_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_set_progress_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
 CONSTRAINT fk_set_progress_template FOREIGN KEY (set_template_id) REFERENCES set_templates(set_template_id) ON DELETE RESTRICT,
 CONSTRAINT ux_set_progress_account_set UNIQUE (account_id,set_template_id),
 CONSTRAINT chk_set_progress_pieces CHECK (pieces_discovered >= 0 AND total_pieces_required >= 1 AND pieces_discovered <= total_pieces_required),
 CONSTRAINT chk_set_progress_completion CHECK ((is_completed=FALSE AND completed_at IS NULL) OR (is_completed=TRUE AND completed_at IS NOT NULL AND pieces_discovered=total_pieces_required))
);
CREATE INDEX ix_set_progress_account_id ON set_progress(account_id);
CREATE INDEX ix_set_progress_template_id ON set_progress(set_template_id);
CREATE INDEX ix_set_progress_is_completed ON set_progress(is_completed);
