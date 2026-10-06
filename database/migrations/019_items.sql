-- =====================================================
-- 019_items.sql
-- Requires: item_bases
-- =====================================================

CREATE TABLE items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_base_id UUID NOT NULL,

    item_level INTEGER NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    item_score BIGINT NOT NULL DEFAULT 0,

    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_items_item_base
        FOREIGN KEY (item_base_id)
        REFERENCES item_bases(item_base_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_items_item_level
        CHECK (item_level >= 1),

    CONSTRAINT chk_items_rarity
        CHECK (rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')),

    CONSTRAINT chk_items_item_score
        CHECK (item_score >= 0)
);

CREATE INDEX ix_items_item_base_id
    ON items(item_base_id);

CREATE INDEX ix_items_item_level
    ON items(item_level);

CREATE INDEX ix_items_rarity
    ON items(rarity);
