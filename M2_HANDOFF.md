# M2 HANDOFF

## Status dokumentu

Ten plik jest autorytatywnym podsumowaniem ustaleń dla etapu **M2: Effective Character Statistics**.

W nowym czacie nie należy ponownie otwierać decyzji oznaczonych jako zamknięte, chyba że aktualny kod lub schemat bazy zawiera bezpośredni konflikt uniemożliwiający implementację.

## 1. Cel M2

Celem M2 jest wdrożenie jednego, autorytatywnego systemu obliczania efektywnych statystyk postaci na podstawie:

- bazowych statystyk postaci,
- poziomu postaci,
- aktualnie założonych przedmiotów,
- bazowych statystyk przedmiotów,
- affixów założonych przedmiotów,
- aktywnego bonusu zestawu,
- ukończonych achievementów konta,
- Spell Mastery,
- aktywnych progression boosts,
- aktywnych buffów i debuffów istniejących podczas walki.

System ma zwracać spójny wynik używany przez profil postaci, walkę, nagrody oraz operacje zmiany wyposażenia.

## 2. Efektywne statystyki

M2 obejmuje:

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy
- Gold Bonus
- Experience Bonus

## 3. Bazowe wartości

```text
Base Attack: 7
Base Defense: 7
Base Spell Power: 100
Base Maximum Health: 180
Base Maximum Mana: 35
Base Maximum Energy: 100
Base Gold Bonus: 0%
Base Experience Bonus: 0%
```

Spell Power jest przechowywany jako liczba całkowita lub płaska wartość numeryczna:

```text
100 = 100%
101 = 101%
150 = 150%
```

Spell Power jest mnożnikiem bazowej wartości zaklęcia:

```text
finalSpellValue = floor(baseSpellValue * effectiveSpellPower / 100)
```

Przykład:

```text
Base Spell Value: 100
Effective Spell Power: 101
Final Spell Value: 101
```

## 4. Typy modyfikatorów

System używa dokładnie dwóch kategorii.

### 4.1. Statystyki płaskie

Płaskie są:

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy

Wszystkie źródła dotyczące tej samej statystyki są dodawane bezpośrednio.

```text
Effective Attack =
    Base Attack
  + Equipment Attack
  + Affix Attack
  + Active Set Attack
  + Achievement Attack
  + Combat Buff Attack
  + Combat Debuff Attack
```

Nie istnieją procentowe modyfikatory Attack, Defense, Spell Power, Maximum Health, Maximum Mana ani Maximum Energy.

### 4.2. Bonusy procentowe

Procentowe są wyłącznie:

- Gold Bonus
- Experience Bonus

Wartości reprezentują punkty procentowe. Wszystkie źródła tej samej statystyki sumują się addytywnie.

```text
20% + 5% = 25%
```

Nie mnożymy procentowych bonusów przez siebie.

```text
finalReward = floor(baseReward * (100 + effectiveBonusPercent) / 100)
```

Przykład:

```text
Base Gold: 100
Gold Bonus: 20% + 5% = 25%
Final Gold: floor(100 * 125 / 100) = 125
```

Gold Bonus i Experience Bonus są wyłącznie nieujemne. Nie istnieją debuffy zmniejszające Gold ani Experience.

## 5. Zaokrąglanie

Końcowe wyniki wymagające pełnej liczby są zawsze zaokrąglane w dół.

```text
floor(value)
```

Nie należy zaokrąglać wartości pośrednich, jeśli obliczenie zawiera dzielenie lub mnożenie.

## 6. Minima efektywnych statystyk

Po zastosowaniu wszystkich modyfikatorów:

```text
Effective Attack >= 0
Effective Defense >= 0
Effective Spell Power >= 0
Effective Maximum Health >= 1
Effective Maximum Mana >= 0
Effective Maximum Energy >= 1
```

Dla statystyk bojowych:

```text
Effective Attack = max(0, Calculated Attack)
Effective Defense = max(0, Calculated Defense)
Effective Spell Power = max(0, Calculated Spell Power)
```

Clamp jest wykonywany po połączeniu wszystkich właściwych modyfikatorów, a nie osobno po każdym modyfikatorze.

## 7. Poziom postaci

Każdy poziom przyznaje:

```text
+30 Maximum Health
+15 Maximum Mana
```

Należy korzystać z uzgodnionej reguły poziomów projektu. Przy implementacji trzeba potwierdzić istniejącą konwencję, czy bazowe wartości odpowiadają poziomowi 1 i przyrost jest liczony przez `(level - 1)`, aby nie naliczyć bonusu za pierwszy poziom podwójnie.

To jest punkt do zweryfikowania w istniejącym kodzie i testach, nie ponownie otwierana decyzja o wysokości bonusów.

## 8. Energy progression

Uzgodniona reguła:

```text
if level < 20:
    levelMaximumEnergy = 100
else:
    levelMaximumEnergy = min(
        200,
        110 + floor((level - 20) / 10) * 5
    )
```

Przykłady:

```text
Level 1:   100
Level 19:  100
Level 20:  110
Level 30:  115
Level 40:  120
Level 50:  125
Level 100: 150
Level 150: 175
Level 200: 200
Level 201+: 200
```

Limit 200 dotyczy przyrostu Energy z poziomu. Płaskie bonusy z założonego wyposażenia mogą zwiększać efektywne Maximum Energy zgodnie z ogólną regułą statystyk płaskich, o ile implementacja i dokumentacja źródłowa nie ustanawiają osobnego globalnego limitu efektywnego Energy.

## 9. Wyposażenie

### 9.1. Autorytatywne źródło

`InventoryItems.IsEquipped` jest jedynym autorytatywnym źródłem aktualnie założonych przedmiotów.

```text
IsEquipped = true  -> przedmiot wpływa na postać
IsEquipped = false -> przedmiot nie wpływa na postać
```

Tylko aktualnie założone przedmioty modyfikują statystyki postaci.

Przedmioty:

- w inventory,
- w magazynie,
- na marketplace,
- zapisane wyłącznie w nieaktywnym loadoucie

nie wpływają na statystyki.

### 9.2. Equipment loadouts

`EquipmentLoadouts` przechowuje zapisane presety i nie jest źródłem aktualnego wyposażenia.

`EquipmentLoadouts.IsDefault` oznacza domyślny zapisany preset. Nie oznacza aktywnego wyposażenia.

Zastosowanie loadoutu aktualizuje `InventoryItems.IsEquipped` w jednej transakcji.

### 9.3. Operacje wyposażenia

Equip, unequip, swap i zastosowanie loadoutu muszą:

1. zweryfikować ownership,
2. zweryfikować slot,
3. zweryfikować Required Level,
4. zweryfikować zgodność broni dwuręcznej i tarczy,
5. zaktualizować `IsEquipped`,
6. ponownie policzyć efektywne statystyki,
7. zaktualizować maksymalne zasoby,
8. wykonać hard clamp aktualnych zasobów,
9. zatwierdzić wszystko w jednej transakcji.

Niepowodzenie dowolnego kroku wycofuje całą operację.

## 10. Item bases i affixy

Założony przedmiot wnosi:

- płaskie statystyki z `ItemBases`,
- wartości affixów z `ItemAffixes` i `AffixTemplates`.

Duplikaty affixów są dozwolone i sumują się.

```text
Attack +20
Attack +15
Total Attack from affixes: +35
```

Procentowe affixy także sumują się addytywnie.

```text
Gold +8%
Gold +5%
Total Gold Bonus from affixes: +13%
```

Unique i Set Items nie używają affixów zgodnie z aktualnym modelem projektu.

## 11. Set bonuses

Dla danego zestawu działa wyłącznie najwyższy osiągnięty próg.

Przykład:

```text
Equipped pieces: 4
Available thresholds: 2, 3, 4
Active threshold: 4 only
```

Bonusy za 2 i 3 elementy nie działają dodatkowo, gdy aktywny jest próg 4.

Każdy aktywny bonus wnosi wartość zgodnie z typem:

- Attack, Defense, Spell Power, Health, Mana, Energy jako flat,
- GoldPercent i ExperiencePercent jako percentage points.

## 12. Achievement bonuses

Achievementy są account-wide.

Bonusy wszystkich ukończonych achievementów dotyczą:

- wszystkich istniejących postaci konta,
- przyszłych postaci utworzonych na koncie,
- postaci sezonowych,
- postaci Non-Ladder,
- zarchiwizowanych postaci podczas wyświetlania ich statystyk.

Kalkulator:

1. ustala `AccountId` postaci,
2. pobiera `AchievementProgress` dla konta,
3. uwzględnia wyłącznie rekordy z `IsCompleted = true`,
4. pobiera reward values z `Achievements`,
5. sumuje rewardy.

Bonusy achievementów nie są kopiowane do rekordu postaci.

Obsługiwane rewardy:

```text
RewardAttack              -> flat
RewardDefense             -> flat
RewardGoldPercent         -> percentage points
RewardExperiencePercent   -> percentage points
```

W kontekście M2 określenie „permanent bonuses” oznacza bonusy z ukończonych achievementów. Nie planujemy osobnego ogólnego systemu permanentnych statystyk.

## 13. Spell Mastery

Spell Mastery jest charakter-specific i wnosi Spell Power.

Terminologia musi być spójna z uzgodnionym modelem:

```text
CurrentSpellPower
```

zamiast:

```text
CurrentspellPower
```

Wartość nadal jest wyświetlana jako procent, ale przechowywana i sumowana jako płaska liczba, np. `100`, `101`, `150`.

Przed migracją nazwy trzeba sprawdzić rzeczywistą kolumnę w migracji `023_character_spell_mastery.sql` i aktualnym schemacie.

## 14. Buffy, boosty i debuffy

### 14.1. Progression boosts

Gold Boost i Experience Boost:

- są procentowymi punktami,
- są fight-based,
- ten sam typ nie stackuje się z samym sobą,
- jeden Gold Boost i jeden Experience Boost mogą działać jednocześnie,
- aktywna wartość sumuje się addytywnie z equipment, affixami, setem i achievementami.

### 14.2. Combat buffs i debuffs

Combat buffs i debuffs:

- istnieją tylko podczas walki,
- dotyczą Attack, Defense i Spell Power,
- używają płaskich wartości,
- wpływają na obliczenia podczas walki,
- są usuwane po zakończeniu walki.

Nie ma potrzeby uwzględniania combat debuffów poza walką.

Efekty tego samego typu nie stackują się. Ponowne zastosowanie odświeża lub zastępuje istniejący efekt zgodnie z regułą efektu.

## 15. Zasoby i hard clamp

Rekord `Characters` przechowuje:

```text
CurrentHealth
CurrentMana
CurrentEnergy
MaxHealth
MaxMana
MaxEnergy
```

`MaxHealth`, `MaxMana` i `MaxEnergy` reprezentują aktualne efektywne maksima postaci.

Po zmianie, która zmniejsza maksimum:

```text
CurrentHealth = min(CurrentHealth, MaxHealth)
CurrentMana   = min(CurrentMana, MaxMana)
CurrentEnergy = min(CurrentEnergy, MaxEnergy)
```

Constrainty bazy pozostają finalną ochroną:

```text
0 <= CurrentHealth <= MaxHealth
0 <= CurrentMana <= MaxMana
0 <= CurrentEnergy <= MaxEnergy

MaxHealth >= 1
MaxMana >= 0
MaxEnergy >= 1
```

## 16. Czyste obliczenie i zmiana stanu

Zamknięta zasada biznesowa:

- tylko założone przedmioty wpływają na rzeczywiste statystyki postaci,
- podgląd lub porównanie przedmiotu może jedynie symulować potencjalny wynik,
- symulacja nie zakłada przedmiotu i nie zmienia rekordu postaci.

Rekomendacja implementacyjna:

- kalkulator efektywnych statystyk powinien zwracać wynik bez niejawnego zapisywania,
- operacja zmieniająca wyposażenie używa kalkulatora, a następnie zapisuje `Max*` i wykonuje clamp w tej samej transakcji.

To jest zasada bezpieczeństwa implementacyjnego, nie osobna mechanika gry.

## 17. Odrzucone pozorne konflikty

Nie należy ponownie otwierać poniższych tematów jako konfliktów:

1. `MaxHealth`, `MaxMana`, `MaxEnergy` naturalnie zwiększają się przez itemy i pozostałe źródła.
2. Tylko założone przedmioty modyfikują postać.
3. Equipment loadout nie jest aktywnym stanem wyposażenia.
4. Debuffy bojowe mają zastosowanie podczas walki i nigdzie indziej.
5. Buff lub debuff powstały podczas walki jest używany w obliczeniach tej walki.
6. Achievement bonuses dotyczą wszystkich postaci konta.
7. Permanent bonuses w M2 to achievement bonuses.
8. Dla setu działa wyłącznie najwyższy osiągnięty próg.
9. Energy progression została ustalona.
10. Nie potrzebujemy wspólnej kolejności flat-vs-percentage dla jednej statystyki, ponieważ dana statystyka należy tylko do jednej kategorii.
11. Nie istnieją ujemne bonusy Gold ani Experience.
12. Porównanie przedmiotów nie zmienia rzeczywistych statystyk postaci.

## 18. Stan schematu potwierdzony przez M2_SCHEMA_DUMP

Potwierdzono:

- `characters` zawiera aktualne i maksymalne zasoby,
- `characters.account_id` wiąże postać z kontem,
- `achievement_progress` jest account-wide,
- tylko ukończony achievement ma `IsCompleted = true` i `CompletedAt`,
- rewardy achievementów są nieujemne,
- `reward_attack` i `reward_defense` są płaskie,
- `reward_gold_percent` i `reward_experience_percent` są procentowe,
- constrainty zasobów odpowiadają uzgodnionym minimom.

Dotychczasowy schema dump był częściowy i obejmował głównie:

- accounts,
- characters,
- achievements,
- achievement_progress.

Pełna implementacja wymaga inspekcji migracji wymienionych w sekcji 20.

## 19. Stan repozytorium potwierdzony przez technical dump

Repozytorium jest projektem TypeScript z podziałem modułowym.

Istnieją między innymi:

```text
src/modules/characters/application
src/modules/characters/domain
src/modules/characters/http
src/modules/characters/infrastructure
tests/unit/characters
tests/integration/characters
database/migrations
```

Aktualna implementacja koncentruje się na fundamencie postaci. Technical dump wykrył 80 migracji, w tym migracje bezpośrednio związane z M2.

`M2_TECHNICAL_DUMP_V3.md` nie jest kompletnym dumpem treści kodu. Wiele plików zawiera wpis:

```text
[READ ERROR: Unable to find type [string\].]
```

Nie wolno traktować braku treści w tym dumpie jako dowodu, że dana logika nie istnieje.

## 20. Migracje wymagające inspekcji dla M2

Minimalny zestaw:

```text
database/migrations/002_achievements.sql
database/migrations/017_item_bases.sql
database/migrations/018_affix_templates.sql
database/migrations/019_items.sql
database/migrations/020_characters.sql
database/migrations/021_achievement_progress.sql
database/migrations/023_character_spell_mastery.sql
database/migrations/028_character_buffs.sql
database/migrations/029_inventory_items.sql
database/migrations/032_equipment_loadouts.sql
database/migrations/033_item_affixes.sql
database/migrations/034_set_bonuses.sql
database/migrations/046_combat_sessions.sql
database/migrations/047_combat_effects.sql
database/migrations/080_character_foundation_support.sql
```

Dodatkowo należy sprawdzić `database/schema-v1.sql`, ale migracje pozostają ważne do ustalenia kolejności i historii zmian.

## 21. Pliki kodu wymagające inspekcji

Najpierw:

```text
src/modules/characters/domain/character.constants.ts
src/modules/characters/domain/character.types.ts
src/modules/characters/domain/resource-regeneration.ts
src/modules/characters/application/character.repository.ts
src/modules/characters/application/get-character-snapshot.service.ts
src/modules/characters/infrastructure/postgres-character.mapper.ts
src/modules/characters/infrastructure/postgres-character.repository.ts
src/infrastructure/database/transaction.ts
```

Następnie należy ustalić, czy powstaną nowe moduły lub katalogi dla:

```text
effective statistics
equipment
achievements
combat effects
```

Nie należy wymyślać docelowych nazw plików przed przeczytaniem istniejących konwencji repozytorium.

## 22. Testy wymagające inspekcji

Minimalny zestaw istniejących testów:

```text
tests/unit/characters/character-foundation.test.ts
tests/unit/characters/get-character-snapshot.service.test.ts
tests/unit/characters/character-repository-contract.test.ts
tests/unit/characters/postgres-character.mapper.test.ts
tests/integration/characters/postgres-character.repository.test.ts
tests/unit/infrastructure/transaction.test.ts
tests/integration/infrastructure/transaction.test.ts
```

Docelowy plan M2 powinien przewidywać co najmniej:

- testy kalkulatora dla każdej statystyki,
- testy sumowania duplikatów affixów,
- test tylko najwyższego set threshold,
- test tylko założonych itemów,
- test account-wide achievementów,
- test przyszłej postaci korzystającej z ukończonych achievementów,
- test progression boostów,
- test combat buffów i debuffów,
- test minimów statystyk,
- test floor dla Spell Power oraz Gold/EXP,
- test Energy progression,
- test hard clampu,
- test atomowego zastosowania loadoutu,
- test rollbacku przy błędzie operacji wyposażenia.

## 23. Znane korekty dokumentacji

1. `database-design/characters/character-spell-mastery.md`

```text
CurrentspellPower
```

powinno zostać zweryfikowane i najprawdopodobniej zmienione na:

```text
CurrentSpellPower
```

2. `database-design/characters/character-statistics.md` opisuje lifetime statistics. Reguła przeliczania efektywnych statystyk nie powinna mieć tam autorytatywnej definicji. Jeżeli dopisek tam istnieje, należy go usunąć lub przenieść do właściwego dokumentu.

3. W dokumentacji mogą nadal występować sformułowania `permanent bonuses` jako osobne źródło. W M2 oznaczają one achievement bonuses, chyba że konkretny dokument opisuje inne, jawne źródło.

4. Dokumentacja setów musi jednoznacznie mówić, że działa tylko najwyższy osiągnięty próg.

## 24. Pliki wejściowe dla nowego czatu

Do nowego czatu należy załączyć:

```text
M2_HANDOFF.md
M2_DESIGN_DUMP_V3.md
M2_SCHEMA_DUMP.txt
M2_TECHNICAL_DUMP_V4.md
```

`M2_TECHNICAL_DUMP_V4.md` ma zastąpić wadliwy V3 i zawierać rzeczywistą treść wymaganych migracji, kodu oraz testów.

## 25. Następny krok

Następny krok to wygenerowanie poprawnego `M2_TECHNICAL_DUMP_V4.md`.

V4 nie powinien ponownie skanować całego repozytorium na podstawie luźnych słów kluczowych. Powinien zebrać jawnie wskazane:

- migracje z sekcji 20,
- pliki kodu z sekcji 21,
- testy z sekcji 22,
- `package.json`,
- `tsconfig.json`,
- `tsconfig.build.json`,
- `database/schema-v1.sql`,
- `documentation/game-design/CURRENT_MILESTONE.md`,
- `documentation/game-design/MASTER_PROJECT_PLAN.md`.

Po uzyskaniu V4 należy:

1. porównać zaakceptowane zasady z rzeczywistym schematem i kodem,
2. wskazać faktyczne konflikty implementacyjne,
3. przygotować plan M2 z konkretnymi plikami,
4. określić migrację lub migracje,
5. określić interfejs kalkulatora,
6. określić zapytania i repozytoria,
7. określić integracje z equip/loadout/combat/rewards,
8. rozpisać testy,
9. zdefiniować kryteria akceptacji,
10. ustalić kolejność commitów lub milestone'ów implementacyjnych.

## 26. Kryteria planu M2

Plan jest gotowy dopiero wtedy, gdy zawiera:

- dokładny zakres,
- elementy poza zakresem,
- konkretne pliki do utworzenia i zmiany,
- wymagane migracje,
- model danych wejściowych kalkulatora,
- model wyniku kalkulatora,
- reguły wszystkich ośmiu statystyk,
- źródła danych dla każdej statystyki,
- zachowanie podczas walki,
- zachowanie przy equip/unequip/loadout,
- zasady persystencji `Max*`,
- hard clamp i transakcje,
- testy jednostkowe,
- testy integracyjne,
- kryteria akceptacji,
- kolejność wdrożenia.

## 27. Prompt startowy do nowego czatu

```text
Przeczytaj w całości załączone pliki:

- M2_HANDOFF.md
- M2_DESIGN_DUMP_V3.md
- M2_SCHEMA_DUMP.txt
- M2_TECHNICAL_DUMP_V4.md

M2_HANDOFF.md jest autorytatywnym podsumowaniem podjętych decyzji.
Nie otwieraj ponownie decyzji oznaczonych jako zamknięte, chyba że kod
lub schemat zawiera bezpośredni konflikt uniemożliwiający implementację.

Najpierw sprawdź spójność handoffu z kodem i schematem. Następnie przygotuj
konkretny, implementacyjny plan M2 zgodnie z sekcjami 25 i 26 handoffu.
Nie zgaduj nazw ani ścieżek plików, jeśli nie wynikają z repozytorium.
```

## 28. Priorytet źródeł

W razie rozbieżności użyj następującej kolejności:

1. jawne decyzje zamknięte w `M2_HANDOFF.md`,
2. aktualny schemat i migracje,
3. aktualny kod i testy,
4. `M2_DESIGN_DUMP_V3.md`,
5. pozostała dokumentacja projektowa.

Jeżeli punkt 1 jest technicznie niemożliwy z powodu punktów 2 lub 3, należy zgłosić konkretny konflikt wraz z propozycją minimalnej zmiany. Nie należy po cichu zmieniać zaakceptowanej mechaniki.
