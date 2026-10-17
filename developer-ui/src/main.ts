import "./style.css";
import {
  ApiClient,
  ApiError,
  type DiagnosticEntry,
} from "./api-client";

type CharacterSummary = {
  characterId: string;
  name: string;
  status: string;
  level: number;
  experience: string;
};

const TOKEN_STORAGE_KEY = "developer-ui-token";
const diagnostics: DiagnosticEntry[] = [];
const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Missing #app element.");
}

app.innerHTML = `
  <header class="page-header">
    <div>
      <p class="eyebrow">M7 Developer UI</p>
      <h1>Ostatnia Szansa</h1>
      <p>Techniczny panel do sprawdzania backendu gry.</p>
    </div>
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
      <div id="characters" class="empty">Najpierw polacz sie z backendem.</div>
    </article>

    <article class="card">
      <h2>Stan P20.3A</h2>
      <ul>
        <li>Token jest przechowywany tylko w localStorage.</li>
        <li>Token nie trafia do diagnostyki.</li>
        <li>Test polaczenia uzywa GET /characters.</li>
      </ul>
    </article>

    <article class="card full-width">
      <details>
        <summary>Diagnostyka HTTP</summary>
        <pre id="diagnostics">Brak requestow.</pre>
      </details>
    </article>
  </section>
`;

const tokenInput = requireElement<HTMLInputElement>("#token");
const connectButton = requireElement<HTMLButtonElement>("#connect");
const clearButton = requireElement<HTMLButtonElement>("#clear-token");
const status = requireElement<HTMLElement>("#connection-status");
const message = requireElement<HTMLElement>("#connection-message");
const characters = requireElement<HTMLElement>("#characters");
const diagnosticsElement = requireElement<HTMLElement>("#diagnostics");

tokenInput.value = localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";

connectButton.addEventListener("click", () => {
  void connect();
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  tokenInput.value = "";
  setConnectionState("idle", "Niepolaczony", "Token zostal usuniety.");
  characters.textContent = "Najpierw polacz sie z backendem.";
  characters.className = "empty";
});

async function connect(): Promise<void> {
  const token = tokenInput.value.trim();

  if (!token) {
    setConnectionState("error", "Brak tokenu", "Wklej token z npm run dev:session.");
    return;
  }

  connectButton.disabled = true;
  setConnectionState("loading", "Laczenie", "Wysylam GET /characters...");

  try {
    const client = new ApiClient(token);
    const result = await client.request<readonly CharacterSummary[]>("GET", "/characters");
    diagnostics.push(result.diagnostic);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    renderCharacters(result.data);
    setConnectionState(
      "success",
      "Polaczono",
      `Backend odpowiedzial poprawnie. Postacie: ${result.data.length}.`
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      diagnostics.push(error.diagnostic);
      setConnectionState("error", "Blad", error.message);
    } else {
      setConnectionState("error", "Blad", "Nieznany blad.");
    }
  } finally {
    connectButton.disabled = false;
    renderDiagnostics();
  }
}

function renderCharacters(items: readonly CharacterSummary[]): void {
  if (items.length === 0) {
    characters.textContent = "Konto nie ma jeszcze postaci.";
    characters.className = "empty";
    return;
  }

  characters.className = "character-list";
  characters.replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("div");
      row.className = "character-row";
      row.textContent = `${item.name} | Level ${item.level} | ${item.status}`;
      return row;
    })
  );
}

function renderDiagnostics(): void {
  diagnosticsElement.textContent = diagnostics.length === 0
    ? "Brak requestow."
    : JSON.stringify(diagnostics.slice(-10).reverse(), null, 2);
}

function setConnectionState(
  state: "idle" | "loading" | "success" | "error",
  label: string,
  detail: string
): void {
  status.textContent = label;
  status.className = `status status-${state}`;
  message.textContent = detail;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}
