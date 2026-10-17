import "./style.css";

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
    <span class="status">Fundament gotowy</span>
  </header>

  <section class="grid">
    <article class="card">
      <h2>Polaczenie</h2>
      <p>Backend: <code>http://127.0.0.1:3000</code></p>
      <p>Proxy UI: <code>/api</code></p>
      <p class="muted">Autoryzacja i test polaczenia pojawia sie w nastepnym kroku.</p>
    </article>

    <article class="card">
      <h2>Zakres</h2>
      <ul>
        <li>Postac i regeneracja zasobow</li>
        <li>Potwory i cooldowny</li>
        <li>Walka i settlement</li>
        <li>Loot, pity i InventoryFull</li>
      </ul>
    </article>

    <article class="card full-width">
      <h2>Stan</h2>
      <p>Vite i TypeScript dzialaja. UI nie wykonuje jeszcze zapytan do backendu.</p>
    </article>
  </section>
`;
