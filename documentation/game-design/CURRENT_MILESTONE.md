## Current Milestone

### Milestone

M6: Victory, Death, and Progression

### Status

Completed.

### Objective

Convert terminal combat results into authoritative Character progression, rewards, penalties, statistics, discovery progress, cooldown state, and final combat summaries.

Settlement occurs exactly once inside the same PostgreSQL transaction as the combat-ending action.

### Implemented scope

- Transactional Victory settlement.
- Transactional Defeat settlement.
- Experience and Gold rewards.
- Canonical Experience curve and level lookup.
- Multiple-level gains and losses.
- Level-dependent resource recalculation.
- Promotion and Blessing death modifiers.
- Active Blessing consumption after Defeat.
- Character lifetime statistics.
- Bestiary kill progression.
- Task progress and Task Boss transitions.
- Daily Boss attempt consumption at combat start.
- Daily Boss Victory progression.
- Normal Monster and Mini Boss cooldown recording.
- Fight-based boost consumption.
- Compact final combat logs.
- Per-character retention of the ten newest final logs.
- Settlement data in the authenticated combat-action response.
- Exactly-once concurrency protection.
- Transaction rollback protection.
- Persistent active-combat recovery after reconnecting.

### Settlement rules

Victory may update:

- Experience,
- level,
- Gold,
- Health, Mana, and Energy state,
- Character statistics,
- Bestiary statistics,
- Task progress,
- Task Boss state,
- Daily Boss Victory progress,
- monster cooldown,
- fight-based boosts,
- final combat log,
- terminal combat-session state.

Defeat may update:

- Experience loss,
- level,
- Health, Mana, and Energy state,
- Character statistics,
- Blessing state,
- monster cooldown,
- fight-based boosts,
- final combat log,
- terminal combat-session state.

M6 does not generate loot. Item and loot generation belongs to M7.

### Combat-session contract

Supported persistent statuses:

- `Active`
- `Victory`
- `Defeat`

Combat cannot be abandoned.

Closing the client does not end combat. An unfinished session remains active, can be retrieved after reconnecting, and prevents the Character from starting another fight.

Base Experience and Gold ranges are snapshotted when combat starts. Current authoritative reward bonuses are loaded during settlement.

Normal Monsters and Mini Bosses receive their configured cooldown after Victory and Defeat. Task Bosses and Daily Bosses do not use that standard cooldown.

Daily Boss attempts are consumed when combat starts. Victory fields are updated only after Daily Boss Victory settlement.

### Final verification

M6 was completed and verified with:

- PostgreSQL connection: PASS
- development database migrations: 89 applied, 0 pending
- clean-database migrations: 001 through 089 applied successfully
- public database tables: 81
- workbook validation: 29 worksheets and 248 rows
- game-data dry run: PASS with rollback
- full regression: 68 test files and 470 tests passed
- focused M6 unit tests: 18 files and 169 tests passed
- PostgreSQL integration: 14 files and 78 tests passed
- authenticated HTTP integration: 2 files and 9 tests passed
- concurrency verification: 3 tests passed
- rollback verification: 8 tests passed
- TypeScript typecheck: PASS
- production build: PASS
- stale active `Abandoned` contract: none
- mandatory verification gates V1 through V25: PASS

### Completion

M6 Victory, Death, and Progression is complete.

Final completion commit:

`8a83b30 complete M6 victory death and progression`

### Next milestone

M7: Item and Loot Generation

M7 will introduce the canonical item-generation and loot-generation pipeline without weakening M6 settlement, transaction, exactly-once, ownership, and rollback guarantees.
