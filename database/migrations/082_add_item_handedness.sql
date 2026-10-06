BEGIN;

ALTER TABLE item_bases
    ADD COLUMN handedness VARCHAR(10);

UPDATE item_bases
SET handedness = 'OneHanded'
WHERE slot = 'Weapon';

ALTER TABLE item_bases
    ADD CONSTRAINT chk_item_bases_handedness_value
        CHECK (
            handedness IS NULL
            OR handedness IN (
                'OneHanded',
                'TwoHanded'
            )
        ),

    ADD CONSTRAINT chk_item_bases_handedness_slot
        CHECK (
            (
                slot = 'Weapon'
                AND handedness IS NOT NULL
            )
            OR
            (
                slot <> 'Weapon'
                AND handedness IS NULL
            )
        );

COMMIT;
