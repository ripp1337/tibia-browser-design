-- =====================================================
-- 033_item_affixes.sql
-- Requires: items, affix_templates
-- =====================================================

CREATE TABLE item_affixes (
    item_affix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    affix_template_id UUID NOT NULL,
    roll_value NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_item_affixes_item
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_affixes_template
        FOREIGN KEY (affix_template_id) REFERENCES affix_templates(affix_template_id) ON DELETE RESTRICT,
    CONSTRAINT ux_item_affixes_item_template UNIQUE (item_id, affix_template_id),
    CONSTRAINT chk_item_affixes_roll_value CHECK (roll_value >= 0)
);

CREATE INDEX ix_item_affixes_item_id ON item_affixes(item_id);
CREATE INDEX ix_item_affixes_template_id ON item_affixes(affix_template_id);
