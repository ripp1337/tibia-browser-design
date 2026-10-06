-- =====================================================
-- 010_monster_families.sql
-- =====================================================

CREATE TABLE monster_families (
    monster_family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_monster_families_name UNIQUE (name)
);
