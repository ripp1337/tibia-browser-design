BEGIN;

ALTER TABLE characters
ADD COLUMN resources_updated_at timestamptz;

UPDATE characters
SET resources_updated_at = COALESCE(last_active_at, updated_at, created_at, now())
WHERE resources_updated_at IS NULL;

ALTER TABLE characters
ALTER COLUMN resources_updated_at SET DEFAULT now();

ALTER TABLE characters
ALTER COLUMN resources_updated_at SET NOT NULL;

CREATE UNIQUE INDEX ux_characters_normalized_name
ON characters (lower(btrim(name)));

COMMIT;
