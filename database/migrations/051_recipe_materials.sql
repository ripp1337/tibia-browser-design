-- 051_recipe_materials.sql
-- Requires: recipes, materials
CREATE TABLE recipe_materials (
 recipe_material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 recipe_id UUID NOT NULL,
 material_id UUID NOT NULL,
 required_quantity BIGINT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_recipe_materials_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
 CONSTRAINT fk_recipe_materials_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT ux_recipe_materials_recipe_material UNIQUE (recipe_id,material_id),
 CONSTRAINT chk_recipe_materials_quantity CHECK (required_quantity > 0)
);
CREATE INDEX ix_recipe_materials_recipe_id ON recipe_materials(recipe_id);
CREATE INDEX ix_recipe_materials_material_id ON recipe_materials(material_id);
