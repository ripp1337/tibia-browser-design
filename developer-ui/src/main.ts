import "./style.css";
import { ApiClient, ApiError, type DiagnosticEntry } from "./api-client";

type CharacterSummary = {
  characterId: string;
  name: string;
  status: string;
  level: number;
  experience: string;
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

tokenInput.value = localStorage.getItem(TOKEN_KEY) ?? "";
connectButton.addEventListener("click", () => void connect());
clearButton.addEventListener("click", disconnect);
createForm.addEventListener("submit", (event) => { event.preventDefault(); void createCharacter(); });
refreshButton.addEventListener("click", () => void loadSnapshot());
autoRefresh.addEventListener("change", configureAutoRefresh);

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
    if (selectedId && summaries.some((item) => item.characterId === selectedId)) await loadSnapshot();
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

function configureAutoRefresh(): void {
  if (autoRefreshId !== null) { window.clearInterval(autoRefreshId); autoRefreshId = null; }
  if (autoRefresh.checked) autoRefreshId = window.setInterval(() => void loadSnapshot(), 10_000);
}

function disconnect(): void {
  localStorage.removeItem(TOKEN_KEY); tokenInput.value = ""; client = null; summaries = []; selectedId = null; previousSnapshot = null;
  localStorage.removeItem(CHARACTER_KEY); autoRefresh.checked = false; configureAutoRefresh(); autoRefresh.disabled = true; refreshButton.disabled = true;
  charactersElement.className = "empty"; charactersElement.textContent = "Najpierw polacz sie z backendem.";
  snapshotElement.className = "empty"; snapshotElement.textContent = "Wybierz postac.";
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
