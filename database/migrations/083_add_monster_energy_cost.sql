-- =====================================================
-- 083_add_monster_energy_cost.sql
-- =====================================================

ALTER TABLE monsters
    ADD COLUMN energy_cost INTEGER NOT NULL DEFAULT 0;

ALTER TABLE monsters
    ADD CONSTRAINT chk_monsters_energy_cost
    CHECK (energy_cost >= 0);