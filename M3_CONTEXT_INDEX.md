# M3 Context Index

## Purpose

Ten pakiet pozwala rozpocząć M3 w nowej rozmowie bez ponownego analizowania M1 i M2.

## Files

### M3_MASTER_PROMPT.md

Główny prompt startowy. Zawiera:

- ukończony zakres M1 i M2,
- zakres M3,
- zasady architektury,
- sposób pracy przez PowerShell,
- strategię testów i commitów,
- pierwsze zadanie nowej rozmowy.

### M3_IMPLEMENTATION_PLAN.md

Plan wykonania M3:

- analiza źródeł danych,
- kontrakty domenowe,
- repozytorium PostgreSQL,
- serwisy aplikacyjne,
- endpointy HTTP,
- testy,
- zamknięcie milestone.

### M3_TECHNICAL_DUMP.md

Wybrane pliki projektu związane z:

- potworami i bossami,
- cooldownami,
- Bestiary,
- ownership postaci,
- HTTP,
- testami i architekturą.

### M3_SCHEMA_DATA_DUMP.md

Aktualny stan PostgreSQL:

- kolumny,
- constrainty,
- klucze obce,
- indeksy,
- rodziny potworów,
- potwory,
- bossowie.

## Reading order

1. M3_MASTER_PROMPT.md
2. M3_CONTEXT_INDEX.md
3. M3_IMPLEMENTATION_PLAN.md
4. M3_TECHNICAL_DUMP.md
5. M3_SCHEMA_DATA_DUMP.md
6. documentation/game-design/CURRENT_MILESTONE.md
7. documentation/game-design/MASTER_PROJECT_PLAN.md

## Source priority

W przypadku konfliktu obowiązuje kolejność:

1. Aktualny, kompilujący się kod
2. Aktualny schemat PostgreSQL
3. Przechodzące testy
4. CURRENT_MILESTONE.md
5. MASTER_PROJECT_PLAN.md
6. Historyczne dumpy i opisy

Konfliktów nie należy rozstrzygać po cichu. Trzeba je wskazać przed rozpoczęciem implementacji.

## Working method

- Jedna mała zmiana naraz.
- Najpierw odczyt dokładnego fragmentu kodu.
- Potem jeden blok PowerShell gotowy do skopiowania.
- Po zmianie typecheck i najmniejszy właściwy test.
- Pełny zestaw testów na checkpointach.
- Jeden spójny commit na etap.
- Bez ręcznego przenoszenia generatorów skryptów.
- Bez destrukcyjnych poleceń Git.
- Bez dodawania dumpów do Git, jeśli nie zostanie to wyraźnie uzgodnione.

## Tomorrow startup checklist

1. Otwórz PowerShell w katalogu repozytorium.
2. Uruchom `git status --short`.
3. Sprawdź aktywną gałąź przez `git branch --show-current`.
4. Uruchom `npm run db:test`.
5. Uruchom `npm run typecheck`.
6. Otwórz nową rozmowę.
7. Wklej zawartość M3_MASTER_PROMPT.md.
8. Dołącz pozostałe cztery pliki M3 jako kontekst.
9. Rozpocznij od mapy źródeł pól i analizy konfliktów schematu.
10. Nie rozpoczynaj implementacji przed zatwierdzeniem tej analizy.

## Temporary file policy

Pliki `M3_*.md` w katalogu głównym są tymczasowym pakietem roboczym.

Po zakończeniu M3:

- finalne decyzje należy zachować w normalnej dokumentacji projektu,
- CURRENT_MILESTONE.md musi opisywać ukończone M3,
- tymczasowe dumpy można usunąć.
