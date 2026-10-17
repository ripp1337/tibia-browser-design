import "./style.css";
import { ApiClient, ApiError, type DiagnosticEntry } from "./api-client";

type CharacterSummary = {
  characterId: string;
  name: string;
  status: string;
  level: number;
  experience: string;
};

type MonsterListItem = {
  code: string;
  name: string;
  level: number;
  monsterType: "Normal" | "MiniBoss" | "TaskBoss" | "DailyBoss";
  energyCost: number;
  eligibility: {
    isEligible: boolean;
    reasons: readonly string[];
  };
  cooldown: {
    isActive: boolean;
    availableAt: string | null;
  };
  bestiaryVisible: boolean;
};

type MonsterDetails = MonsterListItem & {
  description: string;
};

type CombatEvent = {
  type: string;
  actor?: string;
  target?: string;
  hit?: boolean;
  damage?: number;
  status?: string;
  defeatReason?: string | null;
  turn?: number;
};

type CombatSettlement = {
  outcome: "Victory" | "Defeat";
  experience: { before: string; awarded: string; lost: string; after: string };
  gold: { before: string; baseRolled: string; awarded: string; after: string };
  level: { before: number; after: number; levelsChanged: number };
  blessingConsumed: boolean;
  bestiary: { discovered: boolean; killCount: string | null };
  taskBoss: { progressed: boolean; status: string | null };
  cooldown: { applied: boolean; availableAt: string | null };
  dailyBoss: { updated: boolean; victoryRecorded: boolean };
  statistics: { damageDealt: string; damageTaken: string; highestPhysicalHit: string };
  finalSummary: {
    combatSessionId: string;
    outcome: "Victory" | "Defeat";
    turnCount: number;
    startedAt: string;
    endedAt: string;
  };
};

type EquipmentSettlement = {
  generated: Record<string, unknown> | null;
  persisted: Record<string, unknown> | null;
  lossReason: string | null;
};

type LootSettlement = {
  regularEquipment: EquipmentSettlement;
  specialEquipment: EquipmentSettlement;
  specialRollOutcome: string;
  otherLoot: Record<string, unknown> | null;
  pity: { eligibleKillCount: number; chancePerMille: number };
};
type CombatSession = {
  combatSessionId: string;
  characterId: string;
  monsterId: string;
  monsterCode: string;
  status: "Active" | "Victory" | "Defeat";
  defeatReason: string | null;
  currentTurn: number;
  player: {
    currentHealth: number;
    maximumHealth: number;
    attack: number;
    defense: number;
  };
  monster: {
    currentHealth: number;
    maximumHealth: number;
    attack: number;
    defense: number;
  };
  startedAt: string;
  endedAt: string | null;
  settledAt: string | null;
  events: readonly CombatEvent[];
  settlement: CombatSettlement | null;
  loot: LootSettlement | null;
};
type Resources = {
  currentHealth: number;
  maximumHealth: number;
  currentMana: number;
  maximumMana: number;
  currentEnergy: number;
  maximumEnergy: number;
  resourcesUpdatedAt: string;
};

type CharacterSnapshot = {
  characterId: string;
  name: string;
  status: string;
  progression: {
    level: number;
    experience: string;
    gold: string;
  };
  resources: Resources;
  effectiveStatistics: {
    attack: number;
    defense: number;
    spellPower: number;
    maximumHealth: number;
    maximumMana: number;
    maximumEnergy: number;
    goldBonusPercent: number;
    experienceBonusPercent: number;
  };
};

const TOKEN_KEY = "developer-ui-token";
const CHARACTER_KEY = "developer-ui-character";
const diagnostics: DiagnosticEntry[] = [];
let client: ApiClient | null = null;
let summaries: readonly CharacterSummary[] = [];
let selectedId = localStorage.getItem(CHARACTER_KEY);
let previousSnapshot: CharacterSnapshot | null = null;
let autoRefreshId: number | null = null;
let monsters: readonly MonsterListItem[] = [];
let selectedMonsterCode: string | null = null;
let monsterServerRefreshId: number | null = null;
let cooldownDisplayId: number | null = null;
let activeCombat: CombatSession | null = null;
let combatActionPending = false;

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing #app element.");

app.innerHTML = `
  <header class="page-header">
    <div><p class="eyebrow">M7 Developer UI</p><h1>Ostatnia Szansa</h1><p>Techniczny panel do sprawdzania backendu gry.</p></div>
    <span id="connection-status" class="status status-idle">Niepolaczony</span>
  </header>
  <section class="grid">
    <article class="card full-width">
      <h2>Polaczenie</h2>
      <label for="token">Bearer token</label>
      <div class="input-row">
        <input id="token" type="password" autocomplete="off" placeholder="Wklej token z npm run dev:session" />
        <button id="connect" type="button">Polacz</button>
        <button id="clear-token" type="button" class="secondary">Usun token</button>
      </div>
      <p id="connection-message" class="muted">Backend przez proxy: <code>/api</code></p>
    </article>

    <article class="card">
      <h2>Postacie</h2>
      <form id="create-character" class="input-row compact">
        <input id="character-name" minlength="3" maxlength="24" placeholder="Nazwa nowej postaci" />
        <button type="submit">Utworz</button>
      </form>
      <div id="characters" class="empty">Najpierw polacz sie z backendem.</div>
    </article>

    <article class="card">
      <h2>Snapshot postaci</h2>
      <div class="toolbar">
        <button id="refresh-character" type="button" disabled>Odswiez</button>
        <label class="checkbox"><input id="auto-refresh" type="checkbox" disabled /> Co 10 sekund</label>
      </div>
      <div id="snapshot" class="empty">Wybierz postac.</div>
    </article>

    <article class="card full-width">
      <div class="monster-heading">
        <div>
          <h2>Potwory i cooldowny</h2>
          <p class="muted">Dostepnosc i cooldown sa potwierdzane przez backend.</p>
        </div>
        <button id="refresh-monsters" type="button" disabled>Odswiez potwory</button>
      </div>
      <div id="monsters" class="empty">Wybierz postac.</div>
      <div id="monster-details" class="monster-details empty">Wybierz potwora.</div>
    </article>

    <article class="card full-width">
      <div class="combat-heading">
        <div>
          <h2>Aktywna walka</h2>
          <p class="muted">Sesja jest odzyskiwana z backendu po polaczeniu i odswiezeniu strony.</p>
        </div>
        <button id="refresh-combat" type="button" disabled>Odswiez walke</button>
      </div>
      <div id="combat" class="empty">Brak wczytanej walki.</div>
      <div id="settlement" class="settlement empty">Wynik pojawi sie po zakonczeniu walki.</div>
    </article>

    <article class="card full-width">
      <details><summary>Diagnostyka HTTP</summary><pre id="diagnostics">Brak requestow.</pre></details>
    </article>
  </section>
`;

const tokenInput = requireElement<HTMLInputElement>("#token");
const connectButton = requireElement<HTMLButtonElement>("#connect");
const clearButton = requireElement<HTMLButtonElement>("#clear-token");
const createForm = requireElement<HTMLFormElement>("#create-character");
const nameInput = requireElement<HTMLInputElement>("#character-name");
const charactersElement = requireElement<HTMLElement>("#characters");
const snapshotElement = requireElement<HTMLElement>("#snapshot");
const refreshButton = requireElement<HTMLButtonElement>("#refresh-character");
const autoRefresh = requireElement<HTMLInputElement>("#auto-refresh");
const statusElement = requireElement<HTMLElement>("#connection-status");
const messageElement = requireElement<HTMLElement>("#connection-message");
const diagnosticsElement = requireElement<HTMLElement>("#diagnostics");
const monstersElement = requireElement<HTMLElement>("#monsters");
const monsterDetailsElement = requireElement<HTMLElement>("#monster-details");
const refreshMonstersButton = requireElement<HTMLButtonElement>("#refresh-monsters");
const combatElement = requireElement<HTMLElement>("#combat");
const refreshCombatButton = requireElement<HTMLButtonElement>("#refresh-combat");
const settlementElement = requireElement<HTMLElement>("#settlement");

tokenInput.value = localStorage.getItem(TOKEN_KEY) ?? "";
connectButton.addEventListener("click", () => void connect());
clearButton.addEventListener("click", disconnect);
createForm.addEventListener("submit", (event) => { event.preventDefault(); void createCharacter(); });
refreshButton.addEventListener("click", () => void loadSnapshot());
autoRefresh.addEventListener("change", configureAutoRefresh);
refreshMonstersButton.addEventListener("click", () => void loadMonsters());
refreshCombatButton.addEventListener("click", () => void recoverActiveCombat());

async function connect(): Promise<void> {
  const token = tokenInput.value.trim();
  if (!token) { setStatus("error", "Brak tokenu", "Wklej token z npm run dev:session."); return; }
  client = new ApiClient(token);
  connectButton.disabled = true;
  setStatus("loading", "Laczenie", "Pobieram postacie...");
  try {
    await loadCharacters();
    localStorage.setItem(TOKEN_KEY, token);
    setStatus("success", "Polaczono", `Backend odpowiedzial poprawnie. Postacie: ${summaries.length}.`);
    if (selectedId && summaries.some((item) => item.characterId === selectedId)) {
      await loadSnapshot();
      await loadMonsters();
      await recoverActiveCombat();
      startMonsterRefreshTimers();
    }
  } catch (error) { handleError(error); }
  finally { connectButton.disabled = false; renderDiagnostics(); }
}

async function loadCharacters(): Promise<void> {
  if (!client) throw new Error("Brak klienta API.");
  const result = await client.request<readonly CharacterSummary[]>("GET", "/characters");
  diagnostics.push(result.diagnostic);
  summaries = result.data;
  renderCharacters();
}

async function createCharacter(): Promise<void> {
  if (!client) { setStatus("error", "Brak polaczenia", "Najpierw polacz sie z backendem."); return; }
  const name = nameInput.value.trim();
  if (name.length < 3 || name.length > 24) { setStatus("error", "Bledna nazwa", "Nazwa musi miec od 3 do 24 znakow."); return; }
  try {
    const result = await client.request<CharacterSummary>("POST", "/characters", { name, seasonId: null });
    diagnostics.push(result.diagnostic);
    nameInput.value = "";
    selectedId = result.data.characterId;
    localStorage.setItem(CHARACTER_KEY, selectedId);
    previousSnapshot = null;
    await loadCharacters();
    await loadSnapshot();
    await loadMonsters();
    startMonsterRefreshTimers();
    setStatus("success", "Utworzono", `Postac ${result.data.name} zostala utworzona.`);
  } catch (error) { handleError(error); }
  finally { renderDiagnostics(); }
}

function renderCharacters(): void {
  if (summaries.length === 0) { charactersElement.className = "empty"; charactersElement.textContent = "Konto nie ma jeszcze postaci."; return; }
  charactersElement.className = "character-list";
  charactersElement.replaceChildren(...summaries.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `character-row ${item.characterId === selectedId ? "selected" : ""}`;
    button.textContent = `${item.name} | Level ${item.level} | ${item.status}`;
    button.addEventListener("click", () => {
      selectedId = item.characterId;
      localStorage.setItem(CHARACTER_KEY, item.characterId);
      previousSnapshot = null;
      renderCharacters();
      void loadSnapshot();
      void loadMonsters();
      void recoverActiveCombat();
      startMonsterRefreshTimers();
    });
    return button;
  }));
}

async function loadSnapshot(): Promise<void> {
  if (!client || !selectedId) return;
  refreshButton.disabled = true;
  try {
    const result = await client.request<CharacterSnapshot>("GET", `/characters/${encodeURIComponent(selectedId)}`);
    diagnostics.push(result.diagnostic);
    renderSnapshot(result.data, previousSnapshot);
    previousSnapshot = result.data;
    refreshButton.disabled = false;
    autoRefresh.disabled = false;
  } catch (error) { handleError(error); }
  finally { refreshButton.disabled = false; renderDiagnostics(); }
}

function renderSnapshot(current: CharacterSnapshot, previous: CharacterSnapshot | null): void {
  const change = (key: "currentHealth" | "currentMana" | "currentEnergy") => previous ? current.resources[key] - previous.resources[key] : 0;
  const resource = (label: string, key: "currentHealth" | "currentMana" | "currentEnergy", maximum: "maximumHealth" | "maximumMana" | "maximumEnergy") => {
    const delta = change(key);
    return `<div class="resource"><strong>${label}</strong><span>${current.resources[key]} / ${current.resources[maximum]}</span><span class="delta">${delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : "bez zmiany"}</span></div>`;
  };
  snapshotElement.className = "snapshot";
  snapshotElement.innerHTML = `
    <div class="snapshot-heading"><strong>${escapeHtml(current.name)}</strong><span>Level ${current.progression.level}</span></div>
    <div class="stat-grid"><span>Experience: ${current.progression.experience}</span><span>Gold: ${current.progression.gold}</span><span>Attack: ${current.effectiveStatistics.attack}</span><span>Defense: ${current.effectiveStatistics.defense}</span></div>
    <div class="resources">${resource("Health", "currentHealth", "maximumHealth")}${resource("Mana", "currentMana", "maximumMana")}${resource("Energy", "currentEnergy", "maximumEnergy")}</div>
    <p class="timestamp">resourcesUpdatedAt: <code>${escapeHtml(current.resources.resourcesUpdatedAt)}</code></p>
    <p class="muted">Wartosci sa potwierdzone przez serwer. UI niczego lokalnie nie regeneruje.</p>`;
}

async function loadMonsters(): Promise<void> {
  if (!client || !selectedId) return;
  refreshMonstersButton.disabled = true;

  try {
    const result = await client.request<readonly MonsterListItem[]>(
      "GET",
      `/characters/${encodeURIComponent(selectedId)}/monsters`
    );
    diagnostics.push(result.diagnostic);
    monsters = result.data;
    renderMonsters();
    refreshMonstersButton.disabled = false;

    if (
      selectedMonsterCode &&
      monsters.some((monster) => monster.code === selectedMonsterCode)
    ) {
      await loadMonsterDetails(selectedMonsterCode);
    }
  } catch (error) {
    handleError(error);
  } finally {
    refreshMonstersButton.disabled = false;
    renderDiagnostics();
  }
}

function renderMonsters(): void {
  if (monsters.length === 0) {
    monstersElement.className = "empty";
    monstersElement.textContent = "Backend nie zwrocil potworow dla tej postaci.";
    return;
  }

  monstersElement.className = "monster-list";
  monstersElement.replaceChildren(...monsters.map((monster) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `monster-row ${monster.code === selectedMonsterCode ? "selected" : ""}`;

    const availability = monster.eligibility.isEligible
      ? "Dostepny"
      : `Zablokowany: ${monster.eligibility.reasons.join(", ") || "brak powodu"}`;

    const cooldown = formatCooldown(monster.cooldown);
    card.innerHTML = `
      <span><strong>${escapeHtml(monster.name)}</strong> | ${escapeHtml(monster.monsterType)} | Level ${monster.level}</span>
      <span>Energy: ${monster.energyCost}</span>
      <span class="${monster.eligibility.isEligible ? "eligible" : "blocked"}">${escapeHtml(availability)}</span>
      <span>${escapeHtml(cooldown)}</span>`;

    card.addEventListener("click", () => {
      selectedMonsterCode = monster.code;
      renderMonsters();
      void loadMonsterDetails(monster.code);
    });

    return card;
  }));
}

async function loadMonsterDetails(code: string): Promise<void> {
  if (!client || !selectedId) return;

  try {
    const result = await client.request<MonsterDetails>(
      "GET",
      `/characters/${encodeURIComponent(selectedId)}/monsters/${encodeURIComponent(code)}`
    );
    diagnostics.push(result.diagnostic);
    renderMonsterDetails(result.data);
  } catch (error) {
    handleError(error);
  } finally {
    renderDiagnostics();
  }
}

function renderMonsterDetails(monster: MonsterDetails): void {
  monsterDetailsElement.className = "monster-details";
  monsterDetailsElement.innerHTML = `
    <div>
      <h3>${escapeHtml(monster.name)}</h3>
      <p>${escapeHtml(monster.description)}</p>
      <p><strong>Code:</strong> ${escapeHtml(monster.code)}</p>
      <p><strong>Cooldown:</strong> ${escapeHtml(formatCooldown(monster.cooldown))}</p>
      <p><strong>availableAt:</strong> <code>${escapeHtml(monster.cooldown.availableAt ?? "null")}</code></p>
    </div>
    <button id="start-combat" type="button" ${monster.eligibility.isEligible ? "" : "disabled"}>
      Rozpocznij walke (${monster.energyCost} Energy)
    </button>`;

  const startButton = requireElement<HTMLButtonElement>("#start-combat");
  startButton.addEventListener("click", () => void startCombat(monster));
}

async function startCombat(monster: MonsterDetails): Promise<void> {
  if (!client || !selectedId) return;

  try {
    await loadMonsters();
    const current = monsters.find((item) => item.code === monster.code);

    if (!current?.eligibility.isEligible) {
      setStatus("error", "Potwor niedostepny", "Backend nie potwierdza mozliwosci rozpoczecia walki.");
      return;
    }

    const result = await client.request<CombatSession>(
      "POST",
      `/characters/${encodeURIComponent(selectedId)}/combat`,
      { monsterCode: monster.code }
    );
    diagnostics.push(result.diagnostic);
    activeCombat = result.data;
    renderCombat();
    setStatus(
      "success",
      "Walka rozpoczeta",
      `${monster.name}, sesja ${result.data.combatSessionId}, tura ${result.data.currentTurn}.`
    );
    await loadSnapshot();
    await loadMonsters();
  } catch (error) {
    handleError(error);
  } finally {
    renderDiagnostics();
  }
}

async function recoverActiveCombat(): Promise<void> {
  if (!client || !selectedId) return;
  refreshCombatButton.disabled = true;

  try {
    const result = await client.request<CombatSession>(
      "GET",
      `/characters/${encodeURIComponent(selectedId)}/combat`
    );
    diagnostics.push(result.diagnostic);
    activeCombat = result.data;
    renderCombat();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.diagnostic.status === 404
    ) {
      diagnostics.push(error.diagnostic);
      activeCombat = null;
      renderCombat();
    } else {
      handleError(error);
    }
  } finally {
    refreshCombatButton.disabled = false;
    renderDiagnostics();
  }
}

function renderCombat(): void {
  if (activeCombat === null) {
    combatElement.className = "empty";
    combatElement.textContent = "Brak aktywnej walki.";
    refreshCombatButton.disabled = selectedId === null;
    return;
  }

  const terminal = activeCombat.status !== "Active";
  combatElement.className = "combat-panel";
  combatElement.innerHTML = `
    <div class="combat-meta">
      <strong>${escapeHtml(activeCombat.monsterCode)}</strong>
      <span>Status: ${escapeHtml(activeCombat.status)}</span>
      <span>Tura: ${activeCombat.currentTurn}</span>
      <code>${escapeHtml(activeCombat.combatSessionId)}</code>
    </div>
    <div class="combatants">
      ${combatantHtml("Postac", activeCombat.player)}
      ${combatantHtml("Potwor", activeCombat.monster)}
    </div>
    <div class="combat-actions">
      <button id="basic-attack" type="button" ${terminal || combatActionPending ? "disabled" : ""}>Basic Attack</button>
      <span>${terminal ? `Walka zakonczona: ${escapeHtml(activeCombat.defeatReason ?? activeCombat.status)}` : "expectedTurn pochodzi z serwera"}</span>
    </div>
    <div class="combat-events">
      <h3>Zdarzenia ostatniej akcji</h3>
      ${renderEvents(activeCombat.events)}
    </div>`;

  const attackButton = document.querySelector<HTMLButtonElement>("#basic-attack");
  attackButton?.addEventListener("click", () => void submitBasicAttack());
  renderSettlement(activeCombat);
  refreshCombatButton.disabled = false;
}

function renderSettlement(combat: CombatSession): void {
  if (combat.status === "Active" || combat.settlement === null) {
    settlementElement.className = "settlement empty";
    settlementElement.textContent = "Wynik pojawi sie po zakonczeniu walki.";
    return;
  }

  const settlement = combat.settlement;
  settlementElement.className = `settlement settlement-${settlement.outcome.toLowerCase()}`;
  settlementElement.innerHTML = `
    <div class="settlement-title">
      <h3>${escapeHtml(settlement.outcome)}</h3>
      <span>${settlement.finalSummary.turnCount} tur</span>
    </div>
    <div class="settlement-grid">
      ${metricHtml("Experience", settlement.experience.before, settlement.experience.after, settlement.experience.awarded, settlement.experience.lost)}
      ${metricHtml("Gold", settlement.gold.before, settlement.gold.after, settlement.gold.awarded, "0")}
      <div><strong>Level</strong><span>${settlement.level.before} -> ${settlement.level.after}</span><small>Zmiana: ${settlement.level.levelsChanged}</small></div>
      <div><strong>Statystyki</strong><span>Damage: ${settlement.statistics.damageDealt}</span><small>Taken ${settlement.statistics.damageTaken}, max hit ${settlement.statistics.highestPhysicalHit}</small></div>
      <div><strong>Bestiary</strong><span>${settlement.bestiary.discovered ? "Odkryto" : "Bez zmiany"}</span><small>Kills: ${settlement.bestiary.killCount ?? "null"}</small></div>
      <div><strong>Task Boss</strong><span>${settlement.taskBoss.progressed ? "Postep" : "Bez postepu"}</span><small>${escapeHtml(settlement.taskBoss.status ?? "null")}</small></div>
      <div><strong>Cooldown</strong><span>${settlement.cooldown.applied ? "Zastosowany" : "Brak"}</span><small>${escapeHtml(settlement.cooldown.availableAt ?? "null")}</small></div>
      <div><strong>Daily Boss</strong><span>${settlement.dailyBoss.updated ? "Zaktualizowano" : "Bez zmiany"}</span><small>Victory: ${settlement.dailyBoss.victoryRecorded}</small></div>
    </div>
    ${renderLoot(combat.loot)}
    <details class="raw-result">
      <summary>Surowy settlement i loot</summary>
      <pre>${escapeHtml(JSON.stringify({ settlement: combat.settlement, loot: combat.loot }, null, 2))}</pre>
    </details>`;
}

function metricHtml(
  label: string,
  before: string,
  after: string,
  awarded: string,
  lost: string
): string {
  return `<div><strong>${label}</strong><span>${before} -> ${after}</span><small>+${awarded}${lost !== "0" ? `, -${lost}` : ""}</small></div>`;
}

function renderLoot(loot: LootSettlement | null): string {
  if (loot === null) {
    return '<section class="loot"><h3>Loot</h3><p class="muted">Brak lootu dla tego wyniku.</p></section>';
  }

  return `<section class="loot">
    <h3>Loot</h3>
    <div class="loot-grid">
      ${equipmentHtml("Regular Equipment", loot.regularEquipment)}
      ${equipmentHtml("Special Equipment", loot.specialEquipment)}
      <div class="loot-card"><strong>Special roll</strong><span>${escapeHtml(loot.specialRollOutcome)}</span></div>
      <div class="loot-card"><strong>Other Loot</strong>${otherLootHtml(loot.otherLoot)}</div>
      <div class="loot-card"><strong>Pity</strong><span>Eligible kills: ${loot.pity.eligibleKillCount}</span><small>Chance: ${loot.pity.chancePerMille} per mille</small></div>
    </div>
  </section>`;
}

function equipmentHtml(label: string, item: EquipmentSettlement): string {
  const inventoryFull = item.lossReason === "InventoryFull";
  let state = "Nie wylosowano";

  if (item.generated !== null && item.persisted !== null) state = "Wylosowano i zapisano";
  else if (item.generated !== null && inventoryFull) state = "UTRACONO: InventoryFull";
  else if (item.generated !== null) state = `Wylosowano, nie zapisano: ${item.lossReason ?? "brak powodu"}`;

  return `<div class="loot-card ${inventoryFull ? "inventory-full" : ""}">
    <strong>${label}</strong>
    <span>${escapeHtml(state)}</span>
    ${item.generated === null ? "" : `<details><summary>Generated Item</summary><pre>${escapeHtml(JSON.stringify(item.generated, null, 2))}</pre></details>`}
    ${item.persisted === null ? "" : `<details><summary>Persisted Item</summary><pre>${escapeHtml(JSON.stringify(item.persisted, null, 2))}</pre></details>`}
  </div>`;
}

function otherLootHtml(otherLoot: Record<string, unknown> | null): string {
  if (otherLoot === null) return '<span>Brak</span>';
  const kind = typeof otherLoot.kind === "string" ? otherLoot.kind : "Unknown";
  const quantity = typeof otherLoot.quantity === "string" ? otherLoot.quantity : "?";
  return `<span>${escapeHtml(kind)} x${escapeHtml(quantity)}</span><details><summary>Szczegoly</summary><pre>${escapeHtml(JSON.stringify(otherLoot, null, 2))}</pre></details>`;
}

function combatantHtml(
  label: string,
  combatant: CombatSession["player"]
): string {
  const percent = Math.max(
    0,
    Math.min(100, (combatant.currentHealth / combatant.maximumHealth) * 100)
  );

  return `<section class="combatant">
    <div><strong>${label}</strong><span>${combatant.currentHealth} / ${combatant.maximumHealth} HP</span></div>
    <div class="health-bar"><span style="width:${percent}%"></span></div>
    <small>Attack ${combatant.attack} | Defense ${combatant.defense}</small>
  </section>`;
}

function renderEvents(events: readonly CombatEvent[]): string {
  if (events.length === 0) return '<p class="muted">Brak zdarzen.</p>';

  return `<ol>${events.map((event) => {
    if (event.type === "AttackResolved") {
      return `<li>${escapeHtml(event.actor ?? "?")} -> ${escapeHtml(event.target ?? "?")}: ${event.hit ? `${event.damage ?? 0} damage` : "miss"}</li>`;
    }
    if (event.type === "TurnAdvanced") return `<li>Nowa tura: ${event.turn ?? "?"}</li>`;
    if (event.type === "CombatEnded") return `<li>Koniec: ${escapeHtml(event.status ?? "?")} ${escapeHtml(event.defeatReason ?? "")}</li>`;
    return `<li>${escapeHtml(JSON.stringify(event))}</li>`;
  }).join("")}</ol>`;
}

async function submitBasicAttack(): Promise<void> {
  if (!client || !selectedId || !activeCombat || combatActionPending) return;
  combatActionPending = true;
  renderCombat();

  try {
    const result = await client.request<CombatSession>(
      "POST",
      `/characters/${encodeURIComponent(selectedId)}/combat/actions`,
      {
        expectedTurn: activeCombat.currentTurn,
        action: { type: "basic_attack" },
      }
    );
    diagnostics.push(result.diagnostic);
    activeCombat = result.data;
    setStatus(
      "success",
      activeCombat.status === "Active" ? "Tura wykonana" : "Walka zakonczona",
      `Status ${activeCombat.status}, tura ${activeCombat.currentTurn}.`
    );
    await loadSnapshot();

    if (activeCombat.status !== "Active") {
      await loadMonsters();
    }
  } catch (error) {
    handleError(error);
    await recoverActiveCombat();
  } finally {
    combatActionPending = false;
    renderCombat();
    renderDiagnostics();
  }
}

function formatCooldown(cooldown: MonsterListItem["cooldown"]): string {
  if (!cooldown.isActive || cooldown.availableAt === null) return "Brak aktywnego cooldownu";
  const remainingMs = new Date(cooldown.availableAt).getTime() - Date.now();
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `Aktywny, ok. ${minutes}:${String(seconds).padStart(2, "0")} (do ${cooldown.availableAt})`;
}

function startMonsterRefreshTimers(): void {
  if (monsterServerRefreshId !== null) window.clearInterval(monsterServerRefreshId);
  if (cooldownDisplayId !== null) window.clearInterval(cooldownDisplayId);
  monsterServerRefreshId = window.setInterval(() => void loadMonsters(), 10_000);
  cooldownDisplayId = window.setInterval(renderMonsters, 1_000);
}

function stopMonsterRefreshTimers(): void {
  if (monsterServerRefreshId !== null) window.clearInterval(monsterServerRefreshId);
  if (cooldownDisplayId !== null) window.clearInterval(cooldownDisplayId);
  monsterServerRefreshId = null;
  cooldownDisplayId = null;
}

function configureAutoRefresh(): void {
  if (autoRefreshId !== null) { window.clearInterval(autoRefreshId); autoRefreshId = null; }
  if (autoRefresh.checked) autoRefreshId = window.setInterval(() => void loadSnapshot(), 10_000);
}

function disconnect(): void {
  localStorage.removeItem(TOKEN_KEY); tokenInput.value = ""; client = null; summaries = []; selectedId = null; previousSnapshot = null;
  localStorage.removeItem(CHARACTER_KEY); autoRefresh.checked = false; configureAutoRefresh(); stopMonsterRefreshTimers(); autoRefresh.disabled = true; refreshButton.disabled = true; refreshMonstersButton.disabled = true;
  charactersElement.className = "empty"; charactersElement.textContent = "Najpierw polacz sie z backendem.";
  snapshotElement.className = "empty"; snapshotElement.textContent = "Wybierz postac.";
  monsters = []; selectedMonsterCode = null; activeCombat = null; combatActionPending = false;
  monstersElement.className = "empty"; monstersElement.textContent = "Wybierz postac.";
  monsterDetailsElement.className = "monster-details empty"; monsterDetailsElement.textContent = "Wybierz potwora.";
  combatElement.className = "empty"; combatElement.textContent = "Brak wczytanej walki.";
  settlementElement.className = "settlement empty"; settlementElement.textContent = "Wynik pojawi sie po zakonczeniu walki.";
  refreshCombatButton.disabled = true;
  setStatus("idle", "Niepolaczony", "Token zostal usuniety.");
}

function handleError(error: unknown): void {
  if (error instanceof ApiError) { diagnostics.push(error.diagnostic); setStatus("error", "Blad", error.message); }
  else setStatus("error", "Blad", error instanceof Error ? error.message : "Nieznany blad.");
  renderDiagnostics();
}

function renderDiagnostics(): void { diagnosticsElement.textContent = diagnostics.length ? JSON.stringify(diagnostics.slice(-10).reverse(), null, 2) : "Brak requestow."; }
function setStatus(state: "idle" | "loading" | "success" | "error", label: string, detail: string): void { statusElement.textContent = label; statusElement.className = `status status-${state}`; messageElement.textContent = detail; }
function requireElement<T extends Element>(selector: string): T { const element = document.querySelector<T>(selector); if (!element) throw new Error(`Missing element: ${selector}`); return element; }
function escapeHtml(value: string): string { const element = document.createElement("span"); element.textContent = value; return element.innerHTML; }
