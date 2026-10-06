-- 055_gathering_results.sql
-- Requires: gathering_sessions, materials
CREATE TABLE gathering_results (
 gathering_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 gathering_session_id UUID NOT NULL,
 material_id UUID NOT NULL,
 quantity BIGINT NOT NULL,
 successful_rolls INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_gathering_results_session FOREIGN KEY (gathering_session_id) REFERENCES gathering_sessions(gathering_session_id) ON DELETE CASCADE,
 CONSTRAINT fk_gathering_results_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT ux_gathering_results_session_material UNIQUE (gathering_session_id,material_id),
 CONSTRAINT chk_gathering_results_quantity CHECK (quantity > 0),
 CONSTRAINT chk_gathering_results_rolls CHECK (successful_rolls > 0)
);
CREATE INDEX ix_gathering_results_session_id ON gathering_results(gathering_session_id);
CREATE INDEX ix_gathering_results_material_id ON gathering_results(material_id);
