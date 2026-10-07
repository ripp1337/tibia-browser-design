-- =====================================================
-- 084_task_status_refactor.sql
-- Requires: 083
-- =====================================================

ALTER TABLE bestiary_statistics
ADD COLUMN task_status VARCHAR(32);

UPDATE bestiary_statistics
SET task_status =
    CASE
        WHEN task_unlocked = TRUE
            THEN 'UNLOCKED'
        ELSE 'ACTIVE'
    END;

ALTER TABLE bestiary_statistics
ALTER COLUMN task_status SET NOT NULL;

ALTER TABLE bestiary_statistics
ADD CONSTRAINT chk_bestiary_statistics_task_status
CHECK (
    task_status IN (
        'ACTIVE',
        'UNLOCKED',
        'WAITING_FOR_REUNLOCK'
    )
);

ALTER TABLE bestiary_statistics
DROP COLUMN task_unlocked;