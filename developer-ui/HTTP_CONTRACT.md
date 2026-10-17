# Developer UI HTTP Contract

## Status

P20.1 contract inventory for the `m7/developer-ui` branch.

## Rules

- Every gameplay endpoint requires `Authorization: Bearer <token>`.
- The Developer UI obtains a local token with `npm run dev:session`.
- The token must never be committed, printed in diagnostics or included in screenshots.
- Successful responses use `{ "data": ... }`.
- Error responses use `{ "error": { "code": string, "message": string } }`.
- Database `BIGINT` values are serialized as JSON strings.
- Dates are serialized as ISO date strings.
- The server is authoritative for resources, cooldowns, eligibility, combat, settlement and loot.

## Local browser integration

The UI will call paths prefixed with `/api`. Vite will proxy them to the backend and remove `/api`.

```text
Browser: /api/characters
Backend: /characters
Backend development URL: http://127.0.0.1:3000
```

## Authentication

Header required on all endpoints:

```text
Authorization: Bearer <session-token>
```

Create a fresh local session:

```text
npm run dev:session
```

A missing, invalid, revoked or expired session returns HTTP `401` with code `AUTHENTICATION_REQUIRED`.

---

# Character API

## POST /characters

Creates a Character for the authenticated account.

Request:

```json
{
  "name": "Developer",
  "seasonId": null
}
```

Rules:

- `name` is required.
- `seasonId` is a non-empty string or `null`.

Success: HTTP `201`.

## GET /characters

Returns Characters owned by the authenticated account.

Success: HTTP `200`.

Important summary fields:

```text
characterId
accountId
seasonId
name
status
level
experience
createdAt
updatedAt
```

`experience` is a JSON string.

## GET /characters/:characterId

Returns the full Character snapshot and triggers server-authoritative lazy regeneration for a non-archived Character.

Important fields:

```text
characterId
accountId
seasonId
name
status
progression.level
progression.experience
progression.gold
progression.craftingLevel
progression.craftingExperience
progression.gatheringLevel
progression.gatheringExperience
resources.currentHealth
resources.maximumHealth
resources.currentMana
resources.maximumMana
resources.currentEnergy
resources.maximumEnergy
resources.resourcesUpdatedAt
baseStatistics.attack
baseStatistics.defense
baseStatistics.spellPower
unlocks.spellSlots
unlocks.craftingSlots
unlocks.inventorySlots
unlocks.promoted
effectiveStatistics
createdAt
updatedAt
```

Regeneration UI rules:

- display only values returned by this endpoint,
- never increment resources locally,
- show `resourcesUpdatedAt`,
- allow manual refresh,
- optional auto-refresh may request a new snapshot every 10 seconds,
- compare consecutive server snapshots only for presentation.

## POST /characters/:characterId/archive

Archives an owned Character. This endpoint is not required for the first Developer UI version.

---

# Monster API

## GET /characters/:characterId/monsters

Returns Monster discovery data for the selected Character.

Each list item contains:

```text
code
name
level
monsterType
energyCost
eligibility.isEligible
eligibility.reasons[]
cooldown.isActive
cooldown.availableAt
bestiaryVisible
```

Known `monsterType` values:

```text
Normal
MiniBoss
TaskBoss
DailyBoss
```

Known eligibility reasons:

```text
LEVEL_TOO_LOW
COOLDOWN_ACTIVE
TASK_PROGRESS_INCOMPLETE
TASK_REUNLOCK_REQUIRED
DAILY_BOSS_UNAVAILABLE
DAILY_ATTEMPTS_EXHAUSTED
```

## GET /characters/:characterId/monsters/:monsterCode

Returns the same fields as a list item plus:

```text
description
```

Cooldown UI rules:

- `cooldown.isActive` is authoritative,
- `cooldown.availableAt` is the authoritative availability timestamp,
- a local countdown is presentation only,
- refresh the server state before starting combat,
- a server rejection overrides the local countdown.

---

# Combat API

## POST /characters/:characterId/combat

Starts combat.

Request:

```json
{
  "monsterCode": "monster-code"
}
```

Success: HTTP `201` with a combat session view.

## GET /characters/:characterId/combat

Returns the active combat session for the owned Character.

Used after:

- Character selection,
- browser reload,
- manual refresh.

## POST /characters/:characterId/combat/actions

Currently supports only Basic Attack.

Request:

```json
{
  "expectedTurn": 1,
  "action": {
    "type": "basic_attack"
  }
}
```

Rules:

- `expectedTurn` must be a positive safe integer,
- `action` may contain only `type`,
- the UI sends the last server-returned turn,
- the action button is disabled while the request is pending.

## GET /characters/:characterId/combat/:combatSessionId

Returns an owned known combat session.

## GET /characters/:characterId/combat/:combatSessionId/log

Returns:

```text
combatSessionId
events[]
```

Each persisted event includes:

```text
combatSessionEventId
combatSessionId
turnNumber
eventOrder
eventType
event
createdAt
```

---

# Combat session view

Important fields:

```text
combatSessionId
characterId
monsterId
monsterCode
status
defeatReason
currentTurn
player.currentHealth
player.maximumHealth
player.attack
player.defense
monster.currentHealth
monster.maximumHealth
monster.attack
monster.defense
rewards.monsterExperienceReward
rewards.monsterGoldMinimum
rewards.monsterGoldMaximum
startedAt
endedAt
settledAt
events[]
settlement
loot
```

Known statuses:

```text
Active
Victory
Defeat
```

Known defeat reasons:

```text
PlayerHealthDepleted
TurnLimitExceeded
```

Combat events may include:

```text
attackResolved: actor, target, hit, damage
combatEnded: status, defeatReason
turnAdvanced: turn
```

Reward amount fields are JSON strings.

---

# Progression settlement

A terminal combat response contains `settlement`.

Fields:

```text
outcome
experience.before
experience.awarded
experience.lost
experience.after
gold.before
gold.baseRolled
gold.awarded
gold.after
level.before
level.after
level.levelsChanged
blessingConsumed
bestiary.discovered
bestiary.killCount
taskBoss.progressed
taskBoss.status
cooldown.applied
cooldown.availableAt
dailyBoss.updated
dailyBoss.victoryRecorded
statistics.damageDealt
statistics.damageTaken
statistics.highestPhysicalHit
finalSummary.combatSessionId
finalSummary.outcome
finalSummary.turnCount
finalSummary.startedAt
finalSummary.endedAt
```

The UI refreshes Character and Monster data after a terminal response.

---

# M7 loot settlement

`loot` is present for Victory and `null` for Defeat.

Top-level fields:

```text
regularEquipment
specialEquipment
specialRollOutcome
otherLoot
pity
```

## Equipment settlement result

Each of `regularEquipment` and `specialEquipment` has:

```text
generated
persisted
lossReason
```

Possible states:

```text
No generated Item:
  generated = null
  persisted = null
  lossReason = null

Persisted Item:
  generated = complete generated Item
  persisted = persisted identity and inventory information
  lossReason = null

Lost Item:
  generated = complete generated Item
  persisted = null
  lossReason = "InventoryFull"
```

The UI must display `InventoryFull` as an expected loot result, not as a failed Victory.

## Special roll outcome

Display the exact server-returned `specialRollOutcome` value. Do not infer a different label.

## Other Loot

`otherLoot` is either `null` or the complete server-returned Material or Consumable reward. The first UI version may render known fields and always retain the raw JSON fallback.

## Pity

Display:

```text
pity.eligibleKillCount
pity.chancePerMille
```

The UI must not calculate the next pity state.

## Generated Item presentation

Render fields returned by the server, including when present:

```text
Item Base identity
Item Level
Required Level
rarity or special category
Item Score
regular Affix positions, templates and roll values
special fixed-stat definitions and roll values
persisted Item identity
Inventory position
lossReason
```

The UI does not calculate Item Score, rarity, Affixes, fixed stats or persistence priority.

---

# Diagnostics contract

For every request store in memory:

```text
timestamp
method
path
sanitized request body
HTTP status
duration
raw response JSON
```

Never store or display:

```text
Authorization header
Bearer token
database credentials
```

The raw response is the fallback when the UI does not yet have a dedicated renderer for a new field.

---

# Known implementation prerequisites

Before normal UI gameplay works:

1. backend runs on `http://127.0.0.1:3000`,
2. a local token exists from `npm run dev:session`,
3. Vite proxies `/api` to the backend,
4. the token is entered into the local Developer UI,
5. imported development data provides Characters or enough data to create one and discover Monsters.

# P20.1 conclusion

The existing HTTP surface is sufficient for the basic Character to Monster to Combat to Settlement browser flow. P20.2 may now create the Vite foundation and typed browser API client without changing gameplay rules.
