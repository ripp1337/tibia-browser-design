# Developer UI HTTP Contract

## Status

P20.1 contract inventory for the `m7/developer-ui` branch. Updated for Milestone 7
closure: the M7 loot settlement section now documents the full
`regularEquipment` / `specialEquipment` / `otherLoot` / `pity` structure, and a
new "Serialization and rendering standards" section records the BIGINT-as-string
and `escapeHtml` rules.

## Rules

- Every gameplay endpoint requires `Authorization: Bearer <token>`.
- The Developer UI obtains a local token with `npm run dev:session`.
- The token must never be committed, printed in diagnostics or included in screenshots.
- Successful responses use `{ "data": ... }`.
- Error responses use `{ "error": { "code": string, "message": string } }`.
- Database `BIGINT` values are serialized as JSON strings (see "Serialization and
  rendering standards" for the precision rationale).
- All server-authored strings rendered by the UI pass through `escapeHtml` (see
  "Serialization and rendering standards").
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
loot.regularEquipment
loot.specialEquipment
loot.specialRollOutcome
loot.otherLoot
loot.pity
```

The five fields are always present on a Victory `loot` object. The type is defined
in `src/modules/items/application/loot-settlement.service.ts`
(`LootSettlementResult`) and mirrored in the UI in `developer-ui/src/api-contract.ts`
(`LootSettlement`).

## `regularEquipment` — regular Equipment outcome

`regularEquipment` is an `EquipmentSettlementResult<GeneratedRegularItem>`. It is
the result of the independent regular Equipment roll, resolved before Other Loot
and Unique/Set and persisted (after any Unique/Set Item) in the same Victory
transaction.

Structure:

```text
regularEquipment.generated    GeneratedRegularItem | null
regularEquipment.persisted    { itemId, inventoryPosition } | null
regularEquipment.lossReason   "InventoryFull" | null
```

`GeneratedRegularItem` fields:

```text
kind          "Regular"
itemBaseId    string
itemLevel     number
requiredLevel number
rarity        "Common" | "Magic" | "Rare" | "Epic" | "Legendary"
affixes[]     { affixTemplateId, affixPosition, statType, rollValue }
fixedStats[]  always [] for a regular Item
itemScore     BIGINT string
```

`affixes[]` carries one entry per Affix slot. Each occurrence has its own
`affixPosition` (1..4, unique within the Item) and its own `rollValue`. Identical
`affixTemplateId` values may repeat across positions.

## `specialEquipment` — Unique/Set outcome

`specialEquipment` is an `EquipmentSettlementResult<GeneratedSpecialItem>`. It is
the result of the shared Unique/Set roll and is persisted first in the Victory
transaction (before a regular Item) when Inventory space exists.

Structure:

```text
specialEquipment.generated    GeneratedSpecialItem | null
specialEquipment.persisted    { itemId, inventoryPosition } | null
specialEquipment.lossReason   "InventoryFull" | null
```

`GeneratedSpecialItem` fields:

```text
kind          "Special"
itemBaseId    string
itemLevel     number
requiredLevel number
rarity        null
affixes[]     always [] for a special Item
fixedStats[]  { statPosition, statType, rollValue }
itemScore     BIGINT string
```

`fixedStats[]` carries the actual rolled Unique/Set fixed-stat values. Special
Items never create regular `item_affixes`. The special category (Unique vs Set)
is not repeated on the Item itself; it is conveyed by `specialRollOutcome`.

### Equipment result state matrix

```text
No generated Item:
  generated = null
  persisted = null
  lossReason = null

Persisted Item:
  generated = complete generated Item
  persisted = { itemId, inventoryPosition }
  lossReason = null

Lost Item (full Inventory):
  generated = complete generated Item
  persisted = null
  lossReason = "InventoryFull"
```

The UI must display `InventoryFull` as an expected loot result, not as a failed
Victory: the Victory still commits, Gold/Experience/Other Loot are still granted,
and the complete generated Item is returned so it can be inspected.

## `specialRollOutcome` — Unique/Set roll classification

Exact server-returned classification of the shared special roll:

```text
"Ineligible"  source had no eligible Unique/Set candidate pool
"Failed"      an eligible roll was made but did not succeed (pity may increase)
"Generated"   a Unique/Set Item was generated (see specialEquipment)
```

Display the exact value. Do not infer a different label from
`specialEquipment.generated`.

## `otherLoot` — Material or Consumable outcome

`otherLoot` is either `null` (no Other Loot this kill) or one typed reward.
Other Loot is independent of Equipment and is not affected by Inventory
capacity (Materials and Consumables use separate storage).

```text
Material:
  otherLoot.kind                  "Material"
  otherLoot.otherLootTableId      string
  otherLoot.materialId            string
  otherLoot.quantity              BIGINT string

Consumable:
  otherLoot.kind                  "Consumable"
  otherLoot.otherLootTableId      string
  otherLoot.consumableDefinitionId string
  otherLoot.quantity              BIGINT string
```

The UI renders known fields and always retains the raw JSON fallback.

## `pity` — committed Unique/Set pity state

The committed pity state after settlement (unchanged for a lost Item):

```text
pity.eligibleKillCount   number
pity.chancePerMille      number
```

`chancePerMille` is the current success chance in per-mille units (e.g. `1` =
0.1%, `100` = 10%). The UI must not calculate the next pity state; it only
displays the committed value.

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

The UI does not calculate Item Score, rarity, Affixes, fixed stats, persistence
priority or pity.

---

# Serialization and rendering standards

## BIGINT values are serialized as JSON strings

PostgreSQL `BIGINT` columns are read as JavaScript `bigint`, and the HTTP layer
serializes every `bigint` as a decimal **string**. This is implemented by the
`JSON.stringify` replacer in `src/http/http-json.ts` (`stringifyJson`):

```ts
JSON.stringify(value, (_key, nestedValue) =>
  typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue
);
```

Reason: JavaScript `number` is an IEEE-754 double and is only exact up to
`Number.MAX_SAFE_INTEGER` (`2^53 - 1`). Game values such as lifetime
`experience`, `gold`, combat statistics, `itemScore`, Affix/fixed-stat
`rollValue` and Other Loot `quantity` can exceed that bound. Coercing a `BIGINT`
to `number` (via `Number()`, `parseInt()` or unary `+`) would silently lose
precision, so any code that touches a large value could display or compare a
wrong number.

Client rules:

- Treat every field typed `BigIntString` as an opaque decimal string.
- Never run `Number()`, `parseInt()`, `parseFloat()` or unary `+` on a
  `BigIntString`.
- Use string comparison or `BigInt(value)` only where numeric comparison is
  genuinely required; render the original string for display.
- The typed contract in `developer-ui/src/api-contract.ts` (`BigIntString`)
  encodes this rule at the type level; the renderer escapes these strings like
  any other untrusted text.

## HTML sanitization in views (`escapeHtml`)

All dynamic values are inserted into the DOM through `escapeHtml`, defined in
`developer-ui/src/main.ts`:

```ts
function escapeHtml(value: unknown): string {
  const element = document.createElement("span");
  element.textContent = typeof value === "string" ? value : String(value ?? "");
  return element.innerHTML;
}
```

Standard:

- Every server-provided string interpolated into a rendered template must pass
  through `escapeHtml` — Character names, Monster names/descriptions, loot
  identities, Affix/fixed-stat labels and raw JSON dumps included.
- `escapeHtml` escapes text via `textContent` then reads `innerHTML`, so `<`,
  `>`, `&`, `"` and `'` become inert entities and cannot break out of markup or
  inject scripts into the Developer UI.
- Numeric fields returned as JSON numbers may be interpolated directly; string
  fields and `BigIntString` fields must be escaped.
- Raw settlement/loot JSON fallbacks are rendered inside `<pre>` via
  `escapeHtml(JSON.stringify(...))`, never as live HTML.
- Do not introduce `innerHTML` assignments that bypass `escapeHtml` for any
  server-authored value (XSS protection for the developer surface).

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
