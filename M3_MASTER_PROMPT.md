# M3 Master Prompt

Kontynuujemy implementację przeglądarkowej gry RPG „Ostatnia Szansa”.

Aktualny etap:

M3: Monster Discovery and Eligibility

## Kontekst

Przeczytaj przed rozpoczęciem pracy:

1. M3_CONTEXT_INDEX.md
2. M3_IMPLEMENTATION_PLAN.md
3. M3_TECHNICAL_DUMP.md
4. M3_SCHEMA_DATA_DUMP.md
5. documentation/game-design/CURRENT_MILESTONE.md
6. documentation/game-design/MASTER_PROJECT_PLAN.md

Priorytet źródeł:

1. Aktualny kompilujący się kod
2. Aktualny schemat PostgreSQL
3. Przechodzące testy
4. CURRENT_MILESTONE.md
5. MASTER_PROJECT_PLAN.md
6. Historyczne opisy

Nie rozstrzygaj konfliktów po cichu.

## Ukończone M1

- tworzenie, lista, snapshot i archiwizacja postaci,
- ownership konta i postaci,
- limit aktywnych postaci,
- znormalizowane unikalne nazwy,
- deterministyczna regeneracja zasobów,
- transakcje PostgreSQL,
- uwierzytelnione HTTP,
- testy jednostkowe i integracyjne.

## Ukończone M2

- centralny kalkulator 8 statystyk,
- progresja Health, Mana i Energy,
- wyposażenie i affixy,
- najwyższy aktywny bonus zestawu,
- bonusy achievementów,
- Gold Boost i Experience Boost,
- rozdzielenie progression boosts i combat modifiers,
- integracja statystyk ze snapshotem,
- hard clamp zasobów,
- deterministyczność i brak mutacji inputu,
- transakcyjne equip i unequip,
- wymagany poziom przedmiotu,
- zamiana przedmiotu w tym samym slocie,
- OneHanded i TwoHanded,
- konflikt TwoHanded z Shield.

Osobny system permanent character bonuses został cofnięty. Nie odtwarzaj go w M3.

## Cel M3

Zaimplementuj read-only discovery potworów dla uwierzytelnionej postaci.

Zakres:

- lista potworów,
- szczegóły potwora,
- stabilny monster code,
- eligibility według poziomu,
- character-specific cooldown,
- podgląd kosztu Energy,
- typ potwora,
- Bestiary visibility,
- ownership isolation.

Endpointy:

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

Podstawowa reguła:

character.level >= monster.level

Typy potworów:

- Normal
- Mini Boss
- Task Boss
- Daily Boss

## Poza zakresem

M3 nie może:

- rozpoczynać walki,
- odejmować Energy,
- tworzyć combat session,
- generować nagród,
- zapisywać cooldownu,
- aktualizować Bestiary,
- aktualizować kill statistics,
- zmieniać task-boss progress,
- wykonywać mutacji daily-boss rotation.

## Pierwsze zadanie

Nie zaczynaj od kodowania.

Najpierw przygotuj:

1. Mapę publicznych pól do źródeł w bazie.
2. Listę konfliktów i braków schematu.
3. Autorytatywne źródło typu potwora.
4. Autorytatywne źródło kosztu Energy.
5. Semantykę cooldownu.
6. Semantykę Bestiary visibility.
7. Finalny kontrakt listy.
8. Finalny kontrakt szczegółów.
9. Model eligibility i reason codes.
10. Kolejność implementacji.
11. Macierz testów.
12. Pierwszy mały krok kodowania.

Nie zgaduj brakujących relacji.

Nie ustalaj typu potwora na podstawie jego nazwy lub kodu.

Nie implementuj reason codes bez wsparcia aktualnego modelu danych.

## Architektura

Zachowaj warstwy:

- Domain
- Application
- Infrastructure
- HTTP

Zasady:

- Domain nie importuje PostgreSQL ani HTTP.
- Application zależy od kontraktów repozytoriów.
- Infrastructure implementuje kontrakty.
- HTTP obsługuje wyłącznie transport.
- Eligibility nie może być duplikowane.
- HTTP nie oblicza eligibility.
- Repozytorium nie buduje odpowiedzi HTTP.
- accountId pochodzi z uwierzytelnionej sesji.
- Ownership używa accountId i characterId.
- Monster code jest publicznym identyfikatorem.
- Database rows nie wychodzą poza infrastructure.
- Cooldown korzysta z Clock.
- Domena nie używa Date.now ani Math.random.
- Klient nie dostarcza zaufanego czasu, poziomu, cooldownu, kosztu Energy ani eligibility.
- Placeholdery używają zwykłych reguł danych.
- Nie ujawniaj zbędnych wartości wewnętrznych.

## Metoda pracy

Użytkownik nie jest profesjonalnym programistą IT.

Odpowiadaj krótko, prosto i konkretnie.

Dla każdego kroku:

1. Odczytaj dokładny fragment źródła.
2. Zaproponuj jedną małą zmianę.
3. Podaj jeden blok PowerShell do skopiowania.
4. Uruchom typecheck.
5. Uruchom najmniejszy właściwy test.
6. Napraw tylko bieżące błędy.
7. Na checkpointach uruchom pełną weryfikację.
8. Zapisz jeden spójny commit.

Nie wymagaj pobierania ani ręcznego przenoszenia generatorów.

Nowe pliki zapisuj bezpośrednio z PowerShella przez Set-Content.

Nie umieszczaj w blokach:

- promptu terminala,
- znaczników kontynuacji,
- tekstu, którego nie należy wykonać.

Duże zmiany dziel na mniejsze etapy.

## Walidacja

Po małej zmianie:

npm run typecheck

Następnie uruchom najwęższy właściwy test.

Na checkpointach:

npm run db:test
npm run typecheck
npm test
npm run build

Nie deklaruj ukończenia etapu, jeśli kontrola nie przechodzi.

## Git

Przed commitem sprawdź:

git status --short
git diff --name-only

Stosuj małe, spójne commity.

Nie używaj destrukcyjnego reset.

Nie dodawaj tymczasowych dumpów bez jawnej decyzji użytkownika.

Sugerowane commity M3:

1. add M3 monster discovery domain contract
2. add PostgreSQL monster discovery repository
3. implement monster discovery services
4. add authenticated monster discovery endpoints
5. complete M3 monster discovery tests
6. complete M3 documentation

## Definition of Done

M3 jest ukończone, gdy:

- lista potworów działa,
- szczegóły są ładowane przez stabilny code,
- eligibility poziomu działa na granicy,
- potwór wyższego poziomu nie jest startable,
- typ potwora jest poprawny,
- koszt Energy ma autorytatywne źródło,
- cooldown jest character-specific,
- Bestiary visibility jest character-specific,
- foreign ownership jest odrzucany,
- placeholdery nie wymagają wyjątków,
- testy domenowe przechodzą,
- testy integracyjne przechodzą,
- testy HTTP przechodzą,
- db:test przechodzi,
- typecheck przechodzi,
- pełny test suite przechodzi,
- build przechodzi,
- CURRENT_MILESTONE.md jest zaktualizowany,
- zamknięcie M3 jest zapisane w Git.
