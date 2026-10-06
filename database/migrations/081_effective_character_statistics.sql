BEGIN;

ALTER TABLE character_spell_mastery
RENAME COLUMN current_spell_power_percent
TO current_spell_power;

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'character_spell_mastery'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%current_spell_power%'
    LOOP
        EXECUTE format(
            'ALTER TABLE character_spell_mastery DROP CONSTRAINT %I',
            constraint_record.conname
        );
    END LOOP;
END
$$;

ALTER TABLE character_spell_mastery
ADD CONSTRAINT chk_character_spell_mastery_spell_power
CHECK (current_spell_power >= 0);

COMMIT;