# M7 Developer UI — Manual V23 Verification Evidence

Template for Gate V23 of `M7_VERIFICATION_PLAN.md`.

> Gate V23 (and therefore Milestone 7) cannot be closed until this file is filled
> in from a real manual browser run. Replace every `TODO`/`[ ]` placeholder with
> recorded evidence. Keep the raw server responses (Diagnostics panel) as the
> source of truth — the UI must only display what the server returns.

---

## 1. Session metadata

Fill in before starting the click-through.

```text
Date:                    TODO (YYYY-MM-DD)
Branch:                  TODO (e.g. m7/developer-ui)
Commit (HEAD):           TODO (git rev-parse --short HEAD)
Backend start command:   npm run dev  (http://127.0.0.1:3000)
UI start command:        npm run ui:dev
Session token created:   npm run dev:session
Database migrations:     TODO (applied / pending)
Browser + version:       TODO (e.g. Chrome 141)
Operator:                TODO
```

Preconditions:

- [ ] Backend reachable and responding on `http://127.0.0.1:3000`.
- [ ] Vite dev server proxies `/api` to the backend.
- [ ] Session token entered in the "Bearer token" field and connected.
- [ ] At least one Character available (created in UI or existing).
- [ ] Imported development content provides Monsters, Item Bases, Affixes and
      Other Loot so that loot drops are reachable.

---

## 2. Click-through checklist

Run these steps in order in the browser. Tick each item only after the UI shows
the expected result **and** the Diagnostics raw response agrees.

### 2.1 Connection and Character

- [ ] Paste token, click **Połącz** → status shows `Połączono`.
- [ ] `GET /characters` appears in Diagnostics with a raw JSON body.
- [ ] A Character is selected (or created via **Utwórz**).
- [ ] `GET /characters/:id` snapshot renders name, Level, Experience, Gold,
      Attack, Defense and Health/Mana/Energy with `resourcesUpdatedAt`.

### 2.2 Monster discovery and combat start

- [ ] `GET /characters/:id/monsters` lists Monsters with type, level, Energy
      cost, eligibility and cooldown text.
- [ ] Selecting a Monster loads details and enables **Rozpocznij walkę** when
      eligible.
- [ ] `POST /characters/:id/combat` returns a session; the combat panel shows
      status `Active`, current turn and HP bars.
- [ ] Repeated **Basic Attack** clicks send `expectedTurn` and disable while
      pending; turn advances only on server response.

### 2.3 Victory screen

- [ ] Combat reaches `Victory`; the settlement panel renders.
- [ ] Outcome shows `Victory` and a turn count.
- [ ] Experience row shows `before -> after` with awarded amount.
- [ ] Gold row shows `before -> after` with awarded amount.
- [ ] Level row shows `before -> after` and levels changed.
- [ ] Statistics row (damage dealt/taken, highest hit) is populated.
- [ ] Refresh Character snapshot reflects new Experience/Gold and resources.

Record: `Combat Session ID = TODO`, `Outcome = TODO`.

### 2.4 Regular Equipment rendering

- [ ] When `loot.regularEquipment.generated` is not null, the "Regular
      Equipment" card shows state `Wylosowano i zapisano` or `Wygenerowano,
      nie zapisano`.
- [ ] Item body shows: Item Base id, Item Level, Required Level, Rarity,
      Item Score.
- [ ] Affix list shows each Affix with `statType +rollValue (poz. N)`; a
      Legendary item can show up to 4 entries, duplicates allowed with distinct
      positions.
- [ ] When persisted, card shows `Zapisano jako <itemId> w slocie <n>`.
- [ ] Raw JSON `<details>` for the slot matches the diagnostics response exactly.

Record: `Regular Item Base = TODO`, `Rarity = TODO`, `Item Score = TODO`,
`Persisted slot = TODO or N/A`.

### 2.5 Special (Unique/Set) Equipment rendering

- [ ] `specialRollOutcome` is displayed with the exact server value
      (`Ineligible` / `Failed` / `Generated`).
- [ ] When `Generated`, the "Special Equipment" card shows the Special item body
      with a `(Special)` marker, and fixed stats as
      `statType +rollValue (poz. N)`.
- [ ] Special items show **no** regular Affixes (affix list absent / "Brak
      affiksów" equivalent) and `rarity` is not shown as a normal rarity.
- [ ] Pity card shows `eligibleKillCount` and `chancePerMille` (with the
      %-equivalent derived value). UI does not compute the next pity value.

Record: `specialRollOutcome = TODO`, `Fixed stats seen = TODO`,
`pity.eligibleKillCount = TODO`, `pity.chancePerMille = TODO`.

### 2.6 Other Loot rendering

- [ ] When `loot.otherLoot` is not null, the "Other Loot" card shows
      `kind x quantity` and the Material or Consumable id.
- [ ] When `loot.otherLoot` is null, the card shows `Brak`.
- [ ] Raw JSON `<details>` matches `GET .../combat/actions` response.

Record: `otherLoot = TODO (kind x quantity) or null`.

### 2.7 Defeat — no loot

- [ ] Complete a fight ending in `Defeat`.
- [ ] Settlement shows `Defeat` and defeat reason (`PlayerHealthDepleted` or
      `TurnLimitExceeded`).
- [ ] Loot section shows the "brak lootu" message: `loot === null`, no Equipment,
      no Other Loot, no Unique/Set.
- [ ] Experience shows `lost` amount and level may drop; Gold shows no award.
- [ ] Pity is unchanged versus the previous Victory.

Record: `Combat Session ID (Defeat) = TODO`, `defeatReason = TODO`.

### 2.8 `InventoryFull` warning (expected business result)

- [ ] Prepare a Character whose Inventory is full (or otherwise no free
      position) before the fight.
- [ ] On Victory, an Equipment card shows `UTRACONO: InventoryFull (ekwipunek
      pełny)` / `loot-lost` styling.
- [ ] The complete generated Item is still rendered (Item Base, Level, Rarity or
      Special, Score, Affixes/fixed stats).
- [ ] Victory remains successful; Experience, Gold and Other Loot still granted.
- [ ] No error/exception is shown — this is an expected result, not a failure.
- [ ] Pity is **not** reset when a Special item is lost to `InventoryFull`.

Record: `InventoryFull case = TODO (which slot, what was lost, pity before/after)`.

### 2.9 No-drop / continuing outcomes

- [ ] After a no-drop Victory (regular and special both `generated === null`),
      UI shows `Nie wylosowano` for both and remains fully usable.
- [ ] Subsequent fights can be started without a page reload.
- [ ] A continuing (non-terminal) action shows no settlement block.

---

## 3. BIGINT formatting check

Verify large values are displayed as the exact decimal string from the server and
are **not** coerced through `Number()`/`parseInt()`.

- [ ] Experience and Gold values match the raw JSON strings byte-for-byte
      (Spot-check one large value, e.g. compare rendered text with the value in
      the Diagnostics raw response).
- [ ] `itemScore`, Affix/fixed-stat `rollValue`, and Other Loot `quantity` render
      exactly as returned in raw JSON.
- [ ] No value is truncated, rounded, shown in scientific notation (e.g.
      `1.23457e+21`) or otherwise altered.
- [ ] Items with large Item Score or roll values display without precision loss.

Record one comparison:

```text
Field:      TODO (e.g. itemScore)
UI render:  TODO (string as shown)
Raw JSON:   TODO (value from Diagnostics)
Match:      TODO (yes/no)
```

---

## 4. Browser console check (no errors)

- [ ] Open DevTools → Console before starting.
- [ ] Perform the full flow (Victory, Defeat, regular + special loot,
      `InventoryFull`).
- [ ] Console has **zero** uncaught errors and zero unhandled promise rejections.
- [ ] Any intentional `4xx` backend responses appear only as handled UI status
      messages, not console stack traces.
- [ ] No CSP / mixed-content / CORS errors in the console.
- [ ] The bearer token never appears in the console or Diagnostics output
      (screenshots must not include the token field).

Record:

```text
Console errors:  0 (expected) — actual: TODO
Unhandled rejections: 0 (expected) — actual: TODO
Notes: TODO
```

---

## 5. Evidence summary

| Gate V23 requirement              | Result | Evidence / note                     |
|-----------------------------------|--------|-------------------------------------|
| Character created/selected        | [ ]    | TODO                                |
| Monster discovery                 | [ ]    | TODO                                |
| Combat start                      | [ ]    | TODO                                |
| Basic Attack turns                | [ ]    | TODO                                |
| Victory observed                  | [ ]    | Session TODO                        |
| Defeat observed                   | [ ]    | Session TODO                        |
| Regular Equipment visible         | [ ]    | TODO                                |
| Special (Unique/Set) visible      | [ ]    | TODO (controlled or natural)        |
| Other Loot visible                | [ ]    | TODO                                |
| `InventoryFull` warning           | [ ]    | TODO                                |
| BIGINT values exact               | [ ]    | TODO                                |
| No console errors                 | [ ]    | TODO                                |
| Values match raw server response  | [ ]    | TODO                                |

---

## 6. Known limitations / notes

List any deviations, environment quirks, or follow-ups discovered during the run.

```text
TODO: e.g. Unique/Set observed only via controlled/prepared state, not natural roll.
TODO: any console warning that is environmental (e.g. Vite HMR) and not a UI error.
```

---

## 7. Sign-off

```text
Manual V23 verification completed:  [ ] Yes  (required to close M7)
Verified by:                        TODO
Date/time:                          TODO
Branch/commit verified:             TODO
```
