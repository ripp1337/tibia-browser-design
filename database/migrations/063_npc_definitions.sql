-- 063_npc_definitions.sql
CREATE TABLE npc_definitions (
 npc_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(100) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 artwork TEXT NULL,
 npc_type VARCHAR(32) NOT NULL,
 level_min INTEGER NULL,
 level_max INTEGER NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT chk_npc_definitions_type CHECK (npc_type IN ('Vendor','Healer','BlessingMerchant','PromotionTrainer')),
 CONSTRAINT chk_npc_definitions_levels CHECK ((level_min IS NULL AND level_max IS NULL) OR (level_min IS NOT NULL AND level_min>=1 AND (level_max IS NULL OR level_max>=level_min)))
);
CREATE INDEX ix_npc_definitions_type ON npc_definitions(npc_type);
CREATE INDEX ix_npc_definitions_is_active ON npc_definitions(is_active);
