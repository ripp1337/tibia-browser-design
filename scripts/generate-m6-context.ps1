$ErrorActionPreference = "Stop"

$generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$repositoryRoot = (Get-Location).Path

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
  "src/application/ports/clock.ts",
  "src/infrastructure/clock/system-clock.ts",

  "src/modules/combat/application/combat-session.errors.ts",
  "src/modules/combat/application/combat-session.models.ts",
  "src/modules/combat/application/combat-session.repository.ts",
  "src/modules/combat/application/get-active-combat.service.ts",
  "src/modules/combat/application/get-combat-log.service.ts",
  "src/modules/combat/application/get-combat-session.service.ts",
  "src/modules/combat/application/resolve-combat-action.service.ts",
  "src/modules/combat/application/start-combat.service.ts",

  "src/modules/combat/domain/combat.constants.ts",
  "src/modules/combat/domain/combat.errors.ts",
  "src/modules/combat/domain/combat.types.ts",
  "src/modules/combat/domain/combat-attack.ts",
  "src/modules/combat/domain/combat-effects.ts",
  "src/modules/combat/domain/combat-engine.ts",
  "src/modules/combat/domain/combat-validation.ts",

  "src/modules/combat/http/combat-http.handler.ts",
  "src/modules/combat/http/combat-http.request.ts",

  "src/modules/combat/infrastructure/crypto-random-source.ts",
  "src/modules/combat/infrastructure/postgres-combat.mapper.ts",
  "src/modules/combat/infrastructure/postgres-combat-session.repository.ts",
  "src/modules/combat/ports/random-source.ts",

  "src/modules/characters/application/calculate-character-stats.service.ts",
  "src/modules/characters/application/character.repository.ts",
  "src/modules/characters/application/character-statistics.repository.ts",
  "src/modules/characters/application/get-character-snapshot.service.ts",
  "src/modules/characters/domain/character.constants.ts",
  "src/modules/characters/domain/character.errors.ts",
  "src/modules/characters/domain/character.types.ts",
  "src/modules/characters/domain/effective-character-statistics.ts",
  "src/modules/characters/domain/resource-regeneration.ts",
  "src/modules/characters/infrastructure/postgres-character.mapper.ts",
  "src/modules/characters/infrastructure/postgres-character.repository.ts",
  "src/modules/characters/infrastructure/postgres-character-statistics.repository.ts",

  "src/modules/monsters/application/get-monster-details.service.ts",
  "src/modules/monsters/application/get-monster-list.service.ts",
  "src/modules/monsters/application/monster-discovery.models.ts",
  "src/modules/monsters/application/monster-discovery.repository.ts",
  "src/modules/monsters/domain/monster.errors.ts",
  "src/modules/monsters/domain/monster.types.ts",
  "src/modules/monsters/domain/monster-cooldown.ts",
  "src/modules/monsters/domain/monster-eligibility.ts",
  "src/modules/monsters/infrastructure/postgres-monster.mapper.ts",
  "src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts",

  "tests/unit/combat/combat-engine.test.ts",
  "tests/unit/combat/resolve-combat-action.service.test.ts",
  "tests/unit/combat/start-combat.service.test.ts",
  "tests/unit/combat/postgres-combat-session.repository.test.ts",
  "tests/unit/combat/postgres-combat.mapper.test.ts",
  "tests/unit/characters/effective-character-statistics.test.ts",
  "tests/unit/monsters/monster-cooldown.test.ts",
  "tests/unit/monsters/task-boss-discovery.service.test.ts",

  "tests/integration/combat/combat-retrieval.integration.test.ts",
  "tests/integration/combat/persistent-combat-schema.test.ts",
  "tests/integration/combat/resolve-combat-action.integration.test.ts",
  "tests/integration/combat/start-combat.integration.test.ts",
  "tests/integration/characters/postgres-character-statistics.repository.test.ts",
  "tests/integration/http/combat.http.test.ts",

  "documentation/game-design/CURRENT_MILESTONE.md",
  "documentation/game-design/MASTER_PROJECT_PLAN.md",
  "documentation/database-design/combat-design.md",
  "documentation/database-design/monster-definition.md",
  "database-design/combat/combat-sessions.md",
  "database-design/combat/combat-session-events.md",
  "database-design/combat/combat-logs.md",
  "database-design/characters/character-cooldowns.md"
)

$schemaFiles = @(
  "database/migrations/010_monster_families.sql",
  "database/migrations/011_monsters.sql",
  "database/migrations/012_bosses.sql",
  "database/migrations/020_characters.sql",
  "database/migrations/022_character_unlocks.sql",
  "database/migrations/026_character_cooldowns.sql",
  "database/migrations/027_character_statistics.sql",
  "database/migrations/028_character_buffs.sql",
  "database/migrations/035_bestiary_entries.sql",
  "database/migrations/036_bestiary_statistics.sql",
  "database/migrations/037_character_daily_boss_progress.sql",
  "database/migrations/038_monster_tasks.sql",
  "database/migrations/046_combat_sessions.sql",
  "database/migrations/049_combat_logs.sql",
  "database/migrations/080_character_foundation_support.sql",
  "database/migrations/081_effective_character_statistics.sql",
  "database/migrations/083_add_monster_energy_cost.sql",
  "database/migrations/084_task_status_refactor.sql",
  "database/migrations/085_unique_monster_task_boss.sql",
  "database/migrations/086_daily_boss_rotation_window.sql",
  "database/migrations/087_daily_boss_attempt_rotation.sql",
  "database/migrations/088_persistent_combat_api.sql"
)

$allReferencedFiles = @($technicalFiles + $schemaFiles | Sort-Object -Unique)
$missingFiles = @($allReferencedFiles | Where-Object { -not (Test-Path $_) })

if ($missingFiles.Count -gt 0) {
  Write-Host ""
  Write-Host ">>> MISSING REFERENCED FILES" -ForegroundColor Red
  $missingFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  throw "M6 context generation stopped because referenced files are missing."
}

Write-Host ">>> BUILD M6 TECHNICAL DUMP" -ForegroundColor Cyan

$technicalBuilder = [System.Text.StringBuilder]::new()

[void]$technicalBuilder.AppendLine("# M6 Technical Dump")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("Generated: $generatedAt")
[void]$technicalBuilder.AppendLine("Repository root: $repositoryRoot")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("## Purpose")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("Fresh source dump for planning M6: Victory, Death, and Progression.")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("## Source priority")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("1. Current compiling code")
[void]$technicalBuilder.AppendLine("2. Current PostgreSQL schema")
[void]$technicalBuilder.AppendLine("3. Passing automated tests")
[void]$technicalBuilder.AppendLine("4. CURRENT_MILESTONE.md")
[void]$technicalBuilder.AppendLine("5. MASTER_PROJECT_PLAN.md")
[void]$technicalBuilder.AppendLine("6. Historical milestone dumps")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("## Repository state")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine('```text')

$branch = git branch --show-current
$status = git status --short
$recentCommits = git log --oneline -10

[void]$technicalBuilder.AppendLine("Branch: $branch")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("Working tree:")

if ($status) {
  [void]$technicalBuilder.AppendLine(($status -join "`n"))
}
else {
  [void]$technicalBuilder.AppendLine("clean")
}

[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("Recent commits:")
[void]$technicalBuilder.AppendLine(($recentCommits -join "`n"))
[void]$technicalBuilder.AppendLine('```')

foreach ($file in $technicalFiles) {
  Add-SourceFile -Builder $technicalBuilder -FilePath $file -Language "text"
}

[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("# ============================================================")
[void]$technicalBuilder.AppendLine("# RELEVANT FILE INVENTORY")
[void]$technicalBuilder.AppendLine("# ============================================================")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine('```text')

$fileInventory =
  Get-ChildItem src,tests,database,documentation,database-design -Recurse -File |
  Where-Object {
    $_.FullName -notmatch "\\node_modules\\|\\dist\\|\\.git\\" -and
    $_.FullName -match "combat|monster|character|experience|level|progress|reward|gold|bestiary|blessing|promotion|cooldown|task|statistics|log"
  } |
  Sort-Object FullName |
  ForEach-Object {
    $_.FullName.Replace($repositoryRoot + "\", "")
  }

[void]$technicalBuilder.AppendLine(($fileInventory -join "`n"))
[void]$technicalBuilder.AppendLine('```')

[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine("# ============================================================")
[void]$technicalBuilder.AppendLine("# M6 SETTLEMENT REFERENCE AUDIT")
[void]$technicalBuilder.AppendLine("# ============================================================")
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine('```text')

$settlementAudit = git grep -n -i -E "combat_logs|combat_statistics|kill_statistics|bestiary|blessing|promoted|promotion|experience|gold_reward|experience_reward|cooldown|task_status|settle|settlement" -- src tests database documentation database-design

if ($settlementAudit) {
  [void]$technicalBuilder.AppendLine(($settlementAudit -join "`n"))
}
else {
  [void]$technicalBuilder.AppendLine("No settlement references found.")
}

[void]$technicalBuilder.AppendLine('```')

Set-Content -Path "M6_TECHNICAL_DUMP.md" -Value $technicalBuilder.ToString() -Encoding UTF8

Write-Host ">>> BUILD M6 SCHEMA DATA DUMP" -ForegroundColor Cyan

$schemaBuilder = [System.Text.StringBuilder]::new()

[void]$schemaBuilder.AppendLine("# M6 Schema Data Dump")
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine("Generated: $generatedAt")
[void]$schemaBuilder.AppendLine("Repository root: $repositoryRoot")
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine("## Purpose")
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine("Authoritative schema evidence relevant to M6: Victory, Death, and Progression.")
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine("M6 settles completed combat outcomes transactionally and exactly once.")
[void]$schemaBuilder.AppendLine("M6 may update character progression, rewards, statistics, cooldowns, Bestiary, Task Boss progress, and final combat summaries, while the M4 combat engine remains infrastructure-independent.")
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine("The schema is evidence for current terminology, constraints, relationships, and M6 migration planning.")

foreach ($file in $schemaFiles) {
  Add-SourceFile -Builder $schemaBuilder -FilePath $file -Language "sql"
}

if (Test-Path "database/metadata/table-columns.csv") {
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine("# ============================================================")
  [void]$schemaBuilder.AppendLine("# RELEVANT TABLE COLUMNS")
  [void]$schemaBuilder.AppendLine("# ============================================================")
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine('```text')

  $columns =
    Get-Content "database/metadata/table-columns.csv" |
    Select-String -Pattern "combat|monster|character|bestiary|cooldown|task|statistics" |
    ForEach-Object { $_.Line }

  [void]$schemaBuilder.AppendLine(($columns -join "`n"))
  [void]$schemaBuilder.AppendLine('```')
}

if (Test-Path "database/metadata/table-constraints.csv") {
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine("# ============================================================")
  [void]$schemaBuilder.AppendLine("# RELEVANT TABLE CONSTRAINTS")
  [void]$schemaBuilder.AppendLine("# ============================================================")
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine('```text')

  $constraints =
    Get-Content "database/metadata/table-constraints.csv" |
    Select-String -Pattern "combat|monster|character|bestiary|cooldown|task|statistics" |
    ForEach-Object { $_.Line }

  [void]$schemaBuilder.AppendLine(($constraints -join "`n"))
  [void]$schemaBuilder.AppendLine('```')
}

[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine("# ============================================================")
[void]$schemaBuilder.AppendLine("# MIGRATION STATUS")
[void]$schemaBuilder.AppendLine("# ============================================================")
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine('```text')

$migrationStatus = npm run db:migrate:status 2>&1

[void]$schemaBuilder.AppendLine(($migrationStatus -join "`n"))
[void]$schemaBuilder.AppendLine('```')

Set-Content -Path "M6_SCHEMA_DATA_DUMP.md" -Value $schemaBuilder.ToString() -Encoding UTF8

Write-Host ""
Write-Host ">>> GENERATED FILES" -ForegroundColor Green

Get-Item "M6_TECHNICAL_DUMP.md", "M6_SCHEMA_DATA_DUMP.md" |
  Select-Object Name, Length, LastWriteTime

Write-Host ""
Write-Host ">>> STATUS" -ForegroundColor Cyan
git status --short
