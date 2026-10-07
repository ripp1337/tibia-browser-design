-- =====================================================
-- 088_persistent_combat_api.sql
-- Requires: combat_sessions
-- =====================================================

BEGIN;

ALTER TABLE combat_sessions
    ADD COLUMN character_maximum_health BIGINT NOT NULL,
    ADD COLUMN character_attack BIGINT NOT NULL,
    ADD COLUMN character_defense BIGINT NOT NULL,
    ADD COLUMN monster_maximum_health BIGINT NOT NULL,
    ADD COLUMN monster_attack BIGINT NOT NULL,
    ADD COLUMN monster_defense BIGINT NOT NULL,
    ADD COLUMN defeat_reason VARCHAR(32);

ALTER TABLE combat_sessions
    DROP CONSTRAINT chk_combat_sessions_turn,
    DROP CONSTRAINT chk_combat_sessions_resources,
    DROP CONSTRAINT chk_combat_sessions_end_state;

ALTER TABLE combat_sessions
    ADD CONSTRAINT chk_combat_sessions_turn
    CHECK (
        current_turn BETWEEN 1 AND 100
    ),
    ADD CONSTRAINT chk_combat_sessions_statistics
    CHECK (
        character_maximum_health > 0
        AND character_attack >= 0
        AND character_defense >= 0
        AND monster_maximum_health > 0
        AND monster_attack >= 0
        AND monster_defense >= 0
    ),
    ADD CONSTRAINT chk_combat_sessions_resources
    CHECK (
        character_health BETWEEN 0 AND character_maximum_health
        AND character_mana >= 0
        AND monster_health BETWEEN 0 AND monster_maximum_health
    ),
    ADD CONSTRAINT chk_combat_sessions_defeat_reason
    CHECK (
        defeat_reason IS NULL
        OR defeat_reason IN (
            'PlayerHealthDepleted',
            'TurnLimitExceeded'
        )
    ),
    ADD CONSTRAINT chk_combat_sessions_end_state
    CHECK (
        (
            status = 'Active'
            AND ended_at IS NULL
            AND defeat_reason IS NULL
        )
        OR (
            status = 'Victory'
            AND ended_at IS NOT NULL
            AND ended_at >= started_at
            AND defeat_reason IS NULL
        )
        OR (
            status = 'Defeat'
            AND ended_at IS NOT NULL
            AND ended_at >= started_at
            AND defeat_reason IS NOT NULL
        )
        OR (
            status = 'Abandoned'
            AND ended_at IS NOT NULL
            AND ended_at >= started_at
            AND defeat_reason IS NULL
        )
    );

CREATE TABLE combat_session_events (
    combat_session_event_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),
    combat_session_id UUID NOT NULL,
    turn_number INTEGER NOT NULL,
    event_order INTEGER NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    event_data_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_combat_session_events_session
        FOREIGN KEY (combat_session_id)
        REFERENCES combat_sessions(combat_session_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_combat_session_events_turn
        CHECK (turn_number BETWEEN 1 AND 100),

    CONSTRAINT chk_combat_session_events_order
        CHECK (event_order >= 0),

    CONSTRAINT chk_combat_session_events_type
        CHECK (length(trim(event_type)) > 0),

    CONSTRAINT ux_combat_session_events_position
        UNIQUE (
            combat_session_id,
            turn_number,
            event_order
        )
);

CREATE INDEX ix_combat_session_events_ordered_log
    ON combat_session_events (
        combat_session_id,
        turn_number,
        event_order
    );

COMMIT;