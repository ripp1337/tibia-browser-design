-- =====================================================
-- 091_allow_special_item_null_rarity.sql
-- Allow Unique and Set Items to persist without regular rarity
-- Requires: migration 090
-- =====================================================

BEGIN;

ALTER TABLE items
    DROP CONSTRAINT chk_items_rarity,
    ALTER COLUMN rarity DROP NOT NULL,
    ADD CONSTRAINT chk_items_rarity
        CHECK (
            rarity IS NULL
            OR rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')
        );

COMMIT;
