param(
  [ValidateSet("Technical", "Schema", "All")]
  [string]$Mode = "Technical"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repositoryRoot = "C:\Projects\ostatnia-szansa-game"
Set-Location $repositoryRoot

$generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"

function Add-SourceFile {
  param(
    [System.Text.StringBuilder]$Builder,
    [string]$FilePath,
    [string]$Language
  )

  [void]$Builder.AppendLine("")
  [void]$Builder.AppendLine("# ============================================================")

  if (-not (Test-Path $FilePath)) {
    [void]$Builder.AppendLine("# MISSING SOURCE: $FilePath")
    [void]$Builder.AppendLine("# ============================================================")
    return
  }

  [void]$Builder.AppendLine("# SOURCE: $FilePath")
  [void]$Builder.AppendLine("# ============================================================")
  [void]$Builder.AppendLine("")
  [void]$Builder.AppendLine(('```' + $Language))
  [void]$Builder.AppendLine((Get-Content $FilePath -Raw))
  [void]$Builder.AppendLine('```')
}

$technicalFiles = @(
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
  "src/app.ts",
  "scripts/import-game-data.ts",
  "tests/unit/import-game-data.test.ts",

  "src/modules/combat/application/combat-session.models.ts",
  "src/modules/combat/application/combat-session.repository.ts",
  "src/modules/combat/application/resolve-combat-action.service.ts",
  "src/modules/combat/application/start-combat.service.ts",
  "src/modules/combat/domain/combat.constants.ts",
  "src/modules/combat/domain/combat.types.ts",
  "src/modules/combat/http/combat-http.handler.ts",
  "src/modules/combat/http/combat-http.request.ts",
  "src/modules/combat/infrastructure/crypto-random-source.ts",
  "src/modules/combat/infrastructure/postgres-combat.mapper.ts",
  "src/modules/combat/infrastructure/postgres-combat-session.repository.ts",
  "src/modules/combat/ports/random-source.ts",

  "src/modules/characters/application/calculate-character-stats.service.ts",
  "src/modules/characters/application/equipment.repository.ts",
  "src/modules/characters/domain/character.constants.ts",
  "src/modules/characters/domain/character.errors.ts",
  "src/modules/characters/domain/character.types.ts",
  "src/modules/characters/domain/effective-character-statistics.ts",
  "src/modules/characters/infrastructure/postgres-character-statistics.repository.ts",
  "src/modules/characters/infrastructure/postgres-equipment.repository.ts",

  "src/modules/monsters/application/get-monster-details.service.ts",
  "src/modules/monsters/application/get-monster-list.service.ts",
  "src/modules/monsters/application/monster-discovery.models.ts",
  "src/modules/monsters/application/monster-discovery.repository.ts",
  "src/modules/monsters/domain/monster.types.ts",
  "src/modules/monsters/infrastructure/postgres-monster.mapper.ts",
  "src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts",

  "src/modules/progression/domain/victory-settlement.ts",
  "src/modules/progression/domain/victory-rewards.ts",

  "tests/unit/combat/resolve-combat-action.service.test.ts",
  "tests/unit/combat/start-combat.service.test.ts",
  "tests/unit/combat/postgres-combat-session.repository.test.ts",
  "tests/unit/combat/postgres-combat.mapper.test.ts",
  "tests/unit/characters/effective-character-statistics.test.ts",
  "tests/unit/progression/victory-settlement.test.ts",
  "tests/unit/progression/victory-rewards.test.ts",
  "tests/integration/combat/resolve-combat-action.integration.test.ts",
  "tests/integration/combat/start-combat.integration.test.ts",
  "tests/integration/characters/postgres-equipment.repository.test.ts",
  "tests/integration/characters/postgres-character-statistics.repository.test.ts",
  "tests/integration/http/combat.http.test.ts",

  "M7_APPROVED_DECISIONS.md",
  "M7_SOURCE_AUDIT.md",
  "M7_VERIFICATION_PLAN.md",
  "M7_IMPLEMENTATION_PLAN.md",
  "M7_MASTER_PROMPT.md",
  "documentation/game-design/CURRENT_MILESTONE.md",
  "documentation/game-design/MASTER_PROJECT_PLAN.md",
  "documentation/database-design/affix-definition.md",
  "documentation/database-design/equipment-design.md",
  "documentation/database-design/item-definition.md",
  "documentation/database-design/loot-design.md",
  "database-design/loot/unique-pity-tracking.md"
)

$schemaFiles = @(
  "database/migrations/008_unique_templates.sql",
  "database/migrations/009_set_templates.sql",
  "database/migrations/010_monster_families.sql",
  "database/migrations/011_monsters.sql",
  "database/migrations/012_bosses.sql",
  "database/migrations/017_item_bases.sql",
  "database/migrations/018_affix_templates.sql",
  "database/migrations/019_items.sql",
  "database/migrations/020_characters.sql",
  "database/migrations/029_inventory_items.sql",
  "database/migrations/030_material_storage.sql",
  "database/migrations/031_consumable_storage.sql",
  "database/migrations/032_equipment_loadouts.sql",
  "database/migrations/033_item_affixes.sql",
  "database/migrations/034_set_bonuses.sql",
  "database/migrations/056_loot_tables.sql",
  "database/migrations/057_other_loot_tables.sql",
  "database/migrations/058_unique_pity_tracking.sql",
  "database/migrations/060_set_progress.sql",
  "database/migrations/082_add_item_handedness.sql",
  "database/migrations/088_persistent_combat_api.sql",
  "database/migrations/089_victory_death_progression.sql"
)

$requiredPlanningFiles = @(
  "M7_APPROVED_DECISIONS.md",
  "M7_SOURCE_AUDIT.md",
  "M7_VERIFICATION_PLAN.md",
  "M7_IMPLEMENTATION_PLAN.md",
  "M7_MASTER_PROMPT.md"
)

$missingRequired = @($requiredPlanningFiles | Where-Object { -not (Test-Path $_) })
if ($missingRequired.Count -gt 0) {
  Write-Host ""
  Write-Host "MISSING REQUIRED M7 FILES" -ForegroundColor Red
  $missingRequired | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  throw "M7 context generation stopped because required planning files are missing."
}

function Build-TechnicalDump {
  Write-Host ""
  Write-Host ("=" * 80) -ForegroundColor Cyan
  Write-Host " START: BUILD M7 TECHNICAL DUMP " -ForegroundColor Cyan
  Write-Host ("=" * 80) -ForegroundColor Cyan

  $builder = [System.Text.StringBuilder]::new()
  [void]$builder.AppendLine("# M7 Technical Dump")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("Generated: $generatedAt")
  [void]$builder.AppendLine("Repository root: $repositoryRoot")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("## Purpose")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("Fresh source dump for planning M7: Item and Loot Generation.")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("## Source priority")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("1. M7 approved decisions D1-D24")
  [void]$builder.AppendLine("2. Current compiling code")
  [void]$builder.AppendLine("3. Current PostgreSQL schema")
  [void]$builder.AppendLine("4. Passing automated tests")
  [void]$builder.AppendLine("5. CURRENT_MILESTONE.md")
  [void]$builder.AppendLine("6. MASTER_PROJECT_PLAN.md")
  [void]$builder.AppendLine("7. Historical milestone dumps")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("## Repository state")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine('```text')

  $branch = git branch --show-current
  if ($LASTEXITCODE -ne 0) { throw "git branch failed." }
  $status = git status --short
  if ($LASTEXITCODE -ne 0) { throw "git status failed." }
  $recentCommits = git log --oneline -15
  if ($LASTEXITCODE -ne 0) { throw "git log failed." }

  [void]$builder.AppendLine("Branch: $branch")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("Working tree:")
  if ($status) { [void]$builder.AppendLine(($status -join "`n")) }
  else { [void]$builder.AppendLine("clean") }
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("Recent commits:")
  [void]$builder.AppendLine(($recentCommits -join "`n"))
  [void]$builder.AppendLine('```')

  foreach ($file in $technicalFiles) {
    Add-SourceFile -Builder $builder -FilePath $file -Language "text"
  }

  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("# ============================================================")
  [void]$builder.AppendLine("# RELEVANT FILE INVENTORY")
  [void]$builder.AppendLine("# ============================================================")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine('```text')

  $inventory = Get-ChildItem src,tests,database,documentation,database-design,scripts,game-data -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
      $_.FullName -notmatch "\\node_modules\\|\\dist\\|\\.git\\" -and
      $_.FullName -match "loot|item|affix|inventory|equipment|unique|set|pity|reward|victory|settlement|material|consumable|monster|boss|workbook|import"
    } |
    Sort-Object FullName |
    ForEach-Object { $_.FullName.Replace($repositoryRoot + "\", "") }

  [void]$builder.AppendLine(($inventory -join "`n"))
  [void]$builder.AppendLine('```')

  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("# ============================================================")
  [void]$builder.AppendLine("# M7 REFERENCE AUDIT")
  [void]$builder.AppendLine("# ============================================================")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine('```text')

  $audit = git grep -n -i -E "loot|item_affix|affix_position|item_base|inventory_items|unique_pity|other_loot|rarity|item_score|InventoryFull|RandomSource|settlement" -- src tests database documentation database-design scripts 2>$null
  if ($LASTEXITCODE -gt 1) { throw "git grep failed." }
  if ($audit) { [void]$builder.AppendLine(($audit -join "`n")) }
  else { [void]$builder.AppendLine("No M7 references found.") }
  [void]$builder.AppendLine('```')

  Set-Content -Path "M7_TECHNICAL_DUMP.md" -Value $builder.ToString() -Encoding UTF8

  Write-Host ""
  Write-Host "WYNIK: M7_TECHNICAL_DUMP.md" -ForegroundColor Green
  Get-Item "M7_TECHNICAL_DUMP.md" | Select-Object Name, Length, LastWriteTime
}

function Build-SchemaDump {
  Write-Host ""
  Write-Host ("=" * 80) -ForegroundColor Cyan
  Write-Host " START: BUILD M7 SCHEMA DATA DUMP " -ForegroundColor Cyan
  Write-Host ("=" * 80) -ForegroundColor Cyan

  $builder = [System.Text.StringBuilder]::new()
  [void]$builder.AppendLine("# M7 Schema Data Dump")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("Generated: $generatedAt")
  [void]$builder.AppendLine("Repository root: $repositoryRoot")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("## Purpose")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("Authoritative pre-implementation schema evidence relevant to M7: Item and Loot Generation.")

  foreach ($file in $schemaFiles) {
    Add-SourceFile -Builder $builder -FilePath $file -Language "sql"
  }

  foreach ($metadataFile in @("database/metadata/table-columns.csv", "database/metadata/table-constraints.csv")) {
    if (Test-Path $metadataFile) {
      Add-SourceFile -Builder $builder -FilePath $metadataFile -Language "text"
    }
  }

  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("# ============================================================")
  [void]$builder.AppendLine("# MIGRATION STATUS")
  [void]$builder.AppendLine("# ============================================================")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine('```text')

  $migrationStatus = npm run db:migrate:status 2>&1
  if ($LASTEXITCODE -ne 0) {
    [void]$builder.AppendLine(($migrationStatus -join "`n"))
    [void]$builder.AppendLine('```')
    Set-Content -Path "M7_SCHEMA_DATA_DUMP.md" -Value $builder.ToString() -Encoding UTF8
    throw "Migration status command failed."
  }

  [void]$builder.AppendLine(($migrationStatus -join "`n"))
  [void]$builder.AppendLine('```')
  Set-Content -Path "M7_SCHEMA_DATA_DUMP.md" -Value $builder.ToString() -Encoding UTF8

  Write-Host ""
  Write-Host "WYNIK: M7_SCHEMA_DATA_DUMP.md" -ForegroundColor Green
  Get-Item "M7_SCHEMA_DATA_DUMP.md" | Select-Object Name, Length, LastWriteTime
}

if ($Mode -eq "Technical" -or $Mode -eq "All") { Build-TechnicalDump }
if ($Mode -eq "Schema" -or $Mode -eq "All") { Build-SchemaDump }

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host " SUKCES: GENEROWANIE CONTEXT DUMP ZAKONCZONE " -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Green
Write-Host ""
Write-Host "Git status:" -ForegroundColor Cyan
git status --short
