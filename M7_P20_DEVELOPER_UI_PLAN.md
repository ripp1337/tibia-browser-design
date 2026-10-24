# M7 P20 Developer UI Implementation Plan

## Status

Implementation in progress on branch `m7/developer-ui`. Most UI phases are
implemented and passing typecheck/build; the milestone cannot be closed until the
remaining items in "Remaining tasks before Pull Request" are done. See that
section at the end of this document for the current open checklist.

## Baseline and safety

- Backend-only recovery point: commit `3c54977`.
- Create tag `m7-p19-backend-ready` on `3c54977` before UI work.
- Perform UI work on a separate branch: `m7/developer-ui`.
- Keep `m7/item-loot-generation` unchanged as the P19 backend baseline.
- Every P20 checkpoint must leave tests, typecheck and build passing before commit.

## Purpose

Create a minimal browser-based Developer UI whose only purpose is to verify that the existing game backend works as one complete system.

This is not the production frontend. It must prioritize:

- observable backend behavior,
- direct server responses,
- simple manual testing,
- diagnostics,
- low implementation complexity,
- easy removal or replacement later.

## Non-goals

P20 does not include:

- final visual design,
- game artwork,
- animations,
- responsive production layout,
- client-side combat calculations,
- client-side loot calculations,
- client-side resource regeneration,
- client-side Monster cooldown authority,
- spells or advanced combat controls unless already required by the current HTTP contract,
- administrative database editing,
- deterministic forcing of rare outcomes in normal gameplay mode.

## Technical approach

Create a separate application under:

```text
developer-ui/
```

Use:

- Vite,
- TypeScript,
- plain HTML and CSS,
- no React,
- no component library,
- no CSS framework,
- one-page application,
- small modules for API access, state, rendering and formatting.

The Developer UI must consume the backend HTTP API only. It must not import backend repositories, database clients or domain services.

## Core principles

1. The server is authoritative.
2. The browser never calculates combat, loot, pity, Item Score, resource regeneration or cooldown eligibility.
3. The UI may display a local countdown only as presentation derived from a server-provided timestamp.
4. Every important panel has a manual refresh action.
5. Raw HTTP request and response data remain inspectable.
6. Expected business results such as `InventoryFull` are displayed as results, not generic application failures.
7. Browser refresh must recover active state from the backend where the current API permits it.

---

# UX structure

## 1. Connection panel

Display:

- backend base URL,
- bearer session token input,
- connection status,
- last successful request time,
- `Connect / Refresh` action.

Behavior:

- store the base URL and token only in browser local storage for Developer UI convenience,
- attach `Authorization: Bearer <token>` to API requests,
- show HTTP status and backend error body on failure,
- never log or display the full token in the diagnostic history.

## 2. Character panel

Display:

- existing active Characters,
- selected Character,
- new Character name input,
- create and refresh actions,
- level, Experience and Gold,
- current and maximum Health,
- current and maximum Mana,
- current and maximum Energy,
- `resourcesUpdatedAt`,
- effective Character statistics returned by the backend.

### Resource regeneration verification

The UI must:

- request a fresh Character snapshot manually,
- support optional automatic snapshot refresh every 10 seconds,
- show the last server snapshot time,
- show `resourcesUpdatedAt`,
- show changes between the previous and current server snapshots,
- never increment Health, Mana or Energy locally,
- label values as server-confirmed.

Manual verification scenario:

1. Select a Character with at least one resource below maximum.
2. Record the current values and `resourcesUpdatedAt`.
3. Wait beyond one complete regeneration interval.
4. Refresh the Character snapshot.
5. Confirm that the backend returns increased resources without exceeding effective maximums.
6. Confirm that another immediate refresh does not apply the same elapsed interval again.

## 3. Monster panel

Display:

- eligible Monster list for the selected Character,
- Monster code and name,
- Monster type and level,
- Energy cost,
- eligibility state,
- cooldown state,
- server-provided `availableAt` when present,
- details action,
- start-combat action.

### Monster cooldown verification

The backend remains authoritative for `isActive` and `availableAt`.

The UI must:

- disable start-combat while the server reports an active cooldown,
- show the exact `availableAt` timestamp,
- optionally show a local visual countdown derived from `availableAt`,
- clearly label the countdown as approximate presentation,
- refresh the Monster list automatically every 10 seconds and manually on demand,
- re-check the server before starting combat,
- enable combat only after a refreshed server response reports availability,
- handle a server rejection correctly even if the visual countdown reached zero first.

Manual verification scenario:

1. Complete a Victory against a Monster that receives a cooldown.
2. Refresh the Monster list.
3. Confirm that the Monster is unavailable and `availableAt` is visible.
4. Wait until the displayed time passes.
5. Refresh the Monster list.
6. Confirm that the backend now reports the Monster as available.

## 4. Combat panel

Display:

- active combat session ID,
- status,
- current turn,
- Character Health and Mana in combat,
- Monster Health,
- selected Monster,
- `Basic Attack` action,
- events returned by the latest action,
- action loading state,
- stale-turn and terminal-session errors.

Behavior:

- recover active combat when the selected Character changes or the page reloads,
- send the current server-provided turn as `expectedTurn`,
- disable duplicate action submission while a request is pending,
- update the screen only from the response,
- refresh Character and Monster snapshots after terminal combat.

## 5. Terminal settlement panel

Display Victory or Defeat and all available server-returned data:

- outcome and defeat reason,
- Experience before, awarded, lost and after,
- Gold before, rolled, awarded and after,
- level before and after,
- combat statistics,
- Bestiary or progression data,
- final timestamps,
- regular Equipment outcome,
- Other Loot outcome,
- Unique/Set outcome,
- committed pity state,
- persisted and lost Items,
- `InventoryFull` reason.

### Generated Item view

For every generated Item, display when present:

- persisted or lost status,
- Item identity when persisted,
- Item Base,
- Item Level,
- Required Level,
- rarity or special category,
- Item Score,
- Inventory position,
- regular Affixes with position, type, tier and rolled value,
- Unique/Set fixed-stat rolls,
- loss reason.

No field is recalculated by the UI.

## 6. Combat history and log panel

Display:

- current or last combat session,
- final combat log,
- ordered events,
- ability to reload a session and its log by known session ID.

## 7. Diagnostics panel

Provide a collapsible panel containing:

- request method and path,
- request timestamp,
- response HTTP status,
- response duration,
- sanitized request body,
- raw response JSON,
- last backend error body.

The bearer token must never appear in diagnostics.

---

# Implementation phases

## P20.0: Safety checkpoint

Work:

- verify clean working tree,
- create and push tag `m7-p19-backend-ready` at `3c54977`,
- create and push branch `m7/developer-ui`,
- record branch and HEAD.

Gate:

- backend branch remains at the P19 recovery point,
- UI branch starts from the same commit,
- both local and remote references exist.

## P20.1: HTTP contract inventory

Work:

- document actual request and response shapes for Character, Monster and Combat endpoints,
- identify authentication requirements,
- identify every timestamp and BIGINT string field,
- identify which M7 settlement fields are present in the current HTTP response,
- identify missing fields required by the P20 and V23 plans,
- add backend fields only when necessary for observation, without introducing new gameplay behavior.

Deliverable:

```text
developer-ui/HTTP_CONTRACT.md
```

Gate:

- every UI field maps to an actual backend response field or is explicitly marked unavailable.

## P20.2: UI foundation

Work:

- initialize Vite + TypeScript under `developer-ui/`,
- add root scripts for UI dev, typecheck and build,
- implement base layout and plain CSS,
- implement API client and typed transport errors,
- implement connection and authentication panel,
- implement sanitized diagnostics history.

Gate:

- UI starts in a browser,
- production UI build passes,
- backend build and tests remain unaffected.

## P20.3: Character and objective-time resources

Work:

- list Characters,
- create Character,
- select Character,
- load Character snapshot,
- display progression, resources and effective statistics,
- implement manual and optional 10-second auto-refresh,
- display server-confirmed resource changes and `resourcesUpdatedAt`.

Gate:

- resource regeneration can be observed through repeated backend snapshots,
- no resource value is calculated locally.

## P20.4: Monster discovery and cooldowns

Work:

- list eligible Monsters,
- load Monster details,
- display eligibility, Energy cost and cooldown,
- display server `availableAt`,
- add optional approximate visual countdown,
- refresh server Monster state every 10 seconds,
- prevent obvious invalid start attempts while preserving server authority.

Gate:

- cooldown activation and expiry can be observed through refreshed backend responses,
- start-combat availability follows the latest server response.

## P20.5: Combat loop

Work:

- start combat,
- recover active combat,
- submit Basic Attack with `expectedTurn`,
- display events and current state,
- handle Victory, Defeat, stale turn and active-session errors,
- refresh Character and Monster state after terminal settlement.

Gate:

- complete browser flow from Character selection to terminal combat works without direct database access.

## P20.6: M6 and M7 settlement inspection

Work:

- display Experience, Gold, level and statistics,
- display regular Equipment,
- display Other Loot,
- display Unique/Set and pity,
- display Affixes and fixed stats,
- display persisted and lost Items,
- display `InventoryFull` clearly,
- display raw settlement JSON as fallback for any newly added server field.

Gate:

- ordinary random reward results are visible and match raw server responses,
- Defeat displays no loot when the backend returns none.

## P20.7: Recovery and diagnostics

Work:

- recover selected Character from local storage,
- reload active combat after browser refresh,
- allow manual session/log reload,
- improve error visibility,
- guarantee duplicate button submissions are blocked,
- preserve raw evidence for manual verification.

Gate:

- page refresh does not lose an active server combat,
- expected backend errors remain understandable.

## P20.8: Automated verification

Run:

- Developer UI typecheck,
- Developer UI production build,
- focused API-client and formatter tests where valuable,
- backend typecheck,
- backend production build,
- full backend regression,
- `git diff --check`.

Gate:

- all checks pass,
- no backend regression is introduced.

## P20.9: Manual V23 verification

Record:

- date, branch and commit,
- backend and UI start commands,
- authentication result,
- Character creation or selection,
- resource regeneration observation,
- Monster discovery,
- Monster cooldown activation and expiry,
- at least one Victory,
- at least one Defeat,
- at least one regular Equipment result,
- at least one Other Loot result,
- controlled or naturally observed Unique/Set display,
- at least one `InventoryFull` warning,
- confirmation that visible values match raw server responses,
- confirmation that active combat survives browser refresh.

Deliverable:

```text
developer-ui/V23_MANUAL_EVIDENCE.md
```

Gate:

- mandatory V23 flow is recorded,
- known limitations are explicit.

---

# Backend changes permitted during P20

Only minimal observability or browser-integration changes are allowed, for example:

- CORS or same-origin hosting required for local UI access,
- exposing already-authoritative fields that exist internally but are absent from HTTP responses,
- development-only session bootstrap if no safe Developer UI authentication path exists,
- additional HTTP contract tests,
- timestamps needed to observe server-authoritative regeneration or cooldowns.

Every backend change must:

- preserve authentication and ownership isolation,
- avoid client authority,
- include tests,
- remain on the UI branch until reviewed,
- not change approved gameplay rules.

# Test coverage matrix

## Directly testable through Developer UI

- authentication,
- Character creation and selection,
- Character snapshot,
- objective-time resource regeneration,
- Monster discovery and details,
- objective-time Monster cooldown visibility,
- combat start,
- active combat recovery,
- Basic Attack turns,
- Victory and Defeat,
- Experience, Gold and level settlement,
- ordinary loot outcomes,
- pity display,
- `InventoryFull` display when prepared,
- final session and combat log,
- backend errors and stale-turn handling.

## Requires automated or prepared-state tests

- exact rarity boundaries,
- exact RNG outcomes,
- four duplicate Affixes,
- pity cap,
- deterministic Unique/Set success,
- zero, one and two free Inventory position matrix,
- rollback injection,
- same-turn concurrency,
- lock contention,
- exactly-once mutation guarantees.

The UI complements these tests but does not replace them.

# Definition of done

P20 is complete when:

- the P19 backend recovery tag and separate UI branch exist,
- the minimal Developer UI runs in a browser,
- the complete authenticated Character â†’ Monster â†’ Combat â†’ Settlement flow works,
- server-authoritative resource regeneration is observable,
- server-authoritative Monster cooldown activation and expiry are observable,
- active combat survives browser refresh,
- M6 progression and M7 reward results are inspectable,
- raw request and response diagnostics are available without exposing the bearer token,
- Developer UI typecheck and build pass,
- complete backend regression, typecheck and build pass,
- `git diff --check` passes,
- V23 manual evidence is recorded,
- the UI branch is committed, pushed and clean.

---

# Remaining tasks before Pull Request

State as of the `m7/developer-ui` branch checkpoint. Re-run the canonical scripts
before opening the PR.

Implemented and passing:

- [x] `developer-ui/` Vite + TypeScript app (P20.2).
- [x] Connection panel, local token store, typed API client, sanitized
      diagnostics history.
- [x] Character list/creation/selection, snapshot resources and progression,
      optional 10s auto-refresh (P20.3).
- [x] Monster list/details, eligibility, Energy cost, cooldown `availableAt`,
      10s server refresh (P20.4).
- [x] Combat start, active-combat recovery, Basic Attack with `expectedTurn`
      (P20.5).
- [x] Settlement panel: Experience, Gold, level, statistics, regular Equipment,
      Other Loot, Unique/Set and pity, Affixes/fixed stats, persisted/lost status,
      `InventoryFull`, raw JSON fallback (P20.6).
- [x] Session history/cache, manual session reload, duplicate-submission blocking
      (P20.7).
- [x] `escapeHtml` sanitization for all server-authored strings.
- [x] BIGINT-as-string handling in the typed contract and renderer.
- [x] Loot HTTP contract + serialization/sanitization documented in
      `developer-ui/HTTP_CONTRACT.md`.
- [x] `npm run ui:typecheck`, `npm run ui:build`, `npm run typecheck` pass.

Open before the Pull Request:

- [ ] P20.9 manual V23 verification recorded in
      `developer-ui/V23_MANUAL_EVIDENCE.md` (file not created yet). Gate V23
      cannot close without it, and M7 cannot close without V23.
- [ ] P20.8 focused API-client / formatter tests (optional per plan, "where
      valuable" â€” no UI test files exist yet).
- [ ] Full backend regression (`npm test`) and `npm run build` before commit.
- [ ] `git diff --check` clean.
- [ ] Update `documentation/game-design/MASTER_PROJECT_PLAN.md` current-status
      block (still lists M6 as the latest completed milestone).
- [ ] Confirm no `dist/` build output is accidentally committed (currently
      present under `developer-ui/dist/`; ensure `.gitignore` covers it).
- [ ] Commit, push `m7/developer-ui`, verify clean synchronized tree.
