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
  [void]$Builder.AppendLine(
    "# ============================================================"
  )

  if (-not (Test-Path $FilePath)) {
    [void]$Builder.AppendLine(
      "# MISSING SOURCE: $FilePath"
    )
    [void]$Builder.AppendLine(
      "# ============================================================"
    )
    return
  }

  [void]$Builder.AppendLine(
    "# SOURCE: $FilePath"
  )
  [void]$Builder.AppendLine(
    "# ============================================================"
  )
  [void]$Builder.AppendLine("")
  [void]$Builder.AppendLine(
    ('```' + $Language)
  )
  [void]$Builder.AppendLine(
    (Get-Content $FilePath -Raw)
  )
  [void]$Builder.AppendLine('```')
}

$technicalFiles = @(
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
  "src/app.ts",
  "src/application/ports/clock.ts",
  "src/infrastructure/clock/system-clock.ts",
  "src/modules/characters/domain/character.types.ts",
  "src/modules/characters/domain/effective-character-statistics.ts",
  "src/modules/monsters/domain/monster.types.ts",
  "src/modules/monsters/domain/monster-cooldown.ts",
  "src/modules/monsters/domain/monster-eligibility.ts",
  "src/modules/monsters/application/monster-discovery.models.ts",
  "src/modules/monsters/application/monster-discovery.repository.ts",
  "src/modules/monsters/application/get-monster-list.service.ts",
  "src/modules/monsters/application/get-monster-details.service.ts",
  "documentation/game-design/CURRENT_MILESTONE.md",
  "documentation/game-design/MASTER_PROJECT_PLAN.md",
  "documentation/database-design/combat-design.md",
  "documentation/database-design/combat-effect-definition.md",
  "documentation/database-design/monster-definition.md",
  "documentation/database-design/spell-definition.md"
)

$technicalBuilder =
  [System.Text.StringBuilder]::new()

[void]$technicalBuilder.AppendLine(
  "# M4 Technical Dump"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "Generated: $generatedAt"
)
[void]$technicalBuilder.AppendLine(
  "Repository root: $repositoryRoot"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "## Purpose"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "Fresh source dump for planning M4: Pure Combat Engine."
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "## Source priority"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "1. Current compiling code"
)
[void]$technicalBuilder.AppendLine(
  "2. Current PostgreSQL schema"
)
[void]$technicalBuilder.AppendLine(
  "3. Passing automated tests"
)
[void]$technicalBuilder.AppendLine(
  "4. CURRENT_MILESTONE.md"
)
[void]$technicalBuilder.AppendLine(
  "5. MASTER_PROJECT_PLAN.md"
)
[void]$technicalBuilder.AppendLine(
  "6. Historical milestone dumps"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "## Repository state"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine('```text')

$branch = git branch --show-current
$status = git status --short
$recentCommits = git log --oneline -10

[void]$technicalBuilder.AppendLine(
  "Branch: $branch"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "Working tree:"
)

if ($status) {
  [void]$technicalBuilder.AppendLine(
    ($status -join "`n")
  )
}
else {
  [void]$technicalBuilder.AppendLine(
    "clean"
  )
}

[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "Recent commits:"
)
[void]$technicalBuilder.AppendLine(
  ($recentCommits -join "`n")
)
[void]$technicalBuilder.AppendLine('```')

foreach ($file in $technicalFiles) {
  Add-SourceFile `
    -Builder $technicalBuilder `
    -FilePath $file `
    -Language "text"
}

[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "# ============================================================"
)
[void]$technicalBuilder.AppendLine(
  "# RELEVANT FILE INVENTORY"
)
[void]$technicalBuilder.AppendLine(
  "# ============================================================"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine('```text')

$fileInventory =
  Get-ChildItem src,tests,database,documentation `
    -Recurse `
    -File |
  Where-Object {
    $_.FullName -notmatch
      "\\node_modules\\|\\dist\\|\\.git\\" -and
    $_.FullName -match
      "combat|spell|monster|effect|random|clock|statistics"
  } |
  Sort-Object FullName |
  ForEach-Object {
    $_.FullName.Replace(
      $repositoryRoot + "\",
      ""
    )
  }

[void]$technicalBuilder.AppendLine(
  ($fileInventory -join "`n")
)
[void]$technicalBuilder.AppendLine('```')

[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine(
  "# ============================================================"
)
[void]$technicalBuilder.AppendLine(
  "# RANDOMNESS AUDIT"
)
[void]$technicalBuilder.AppendLine(
  "# ============================================================"
)
[void]$technicalBuilder.AppendLine("")
[void]$technicalBuilder.AppendLine('```text')

$randomAudit = git grep `
  -n `
  -i `
  -E `
  "RandomSource|Math\.random|randomUUID|rng" `
  -- `
  src `
  tests

if ($randomAudit) {
  [void]$technicalBuilder.AppendLine(
    ($randomAudit -join "`n")
  )
}
else {
  [void]$technicalBuilder.AppendLine(
    "No randomness references found."
  )
}

[void]$technicalBuilder.AppendLine('```')

Set-Content `
  M4_TECHNICAL_DUMP.md `
  $technicalBuilder.ToString()

$schemaFiles = @(
  "database/migrations/005_spells.sql",
  "database/migrations/010_monster_families.sql",
  "database/migrations/011_monsters.sql",
  "database/migrations/020_characters.sql",
  "database/migrations/023_character_spell_mastery.sql",
  "database/migrations/024_character_spells.sql",
  "database/migrations/027_character_statistics.sql",
  "database/migrations/028_character_buffs.sql",
  "database/migrations/039_monster_abilities.sql",
  "database/migrations/040_monster_ability_weights.sql",
  "database/migrations/046_combat_sessions.sql",
  "database/migrations/047_combat_effects.sql",
  "database/migrations/048_combat_spell_cooldowns.sql",
  "database/migrations/049_combat_logs.sql",
  "database/migrations/081_effective_character_statistics.sql"
)

$schemaBuilder =
  [System.Text.StringBuilder]::new()

[void]$schemaBuilder.AppendLine(
  "# M4 Schema Data Dump"
)
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine(
  "Generated: $generatedAt"
)
[void]$schemaBuilder.AppendLine(
  "Repository root: $repositoryRoot"
)
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine(
  "## Purpose"
)
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine(
  "Authoritative schema evidence relevant to M4: Pure Combat Engine."
)
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine(
  "## Architectural boundary"
)
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine(
  "M4 is a pure TypeScript domain milestone."
)
[void]$schemaBuilder.AppendLine(
  "The schema is context for terminology and future integration."
)
[void]$schemaBuilder.AppendLine(
  "The M4 engine must not import PostgreSQL, HTTP, repositories, or environment configuration."
)

foreach ($file in $schemaFiles) {
  Add-SourceFile `
    -Builder $schemaBuilder `
    -FilePath $file `
    -Language "sql"
}

if (Test-Path "database/metadata/table-columns.csv") {
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine(
    "# ============================================================"
  )
  [void]$schemaBuilder.AppendLine(
    "# RELEVANT TABLE COLUMNS"
  )
  [void]$schemaBuilder.AppendLine(
    "# ============================================================"
  )
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine('```text')

  $columns =
    Get-Content `
      database/metadata/table-columns.csv |
    Select-String `
      -Pattern `
      "combat|spell|monster|character_statistics|character_buffs" |
    ForEach-Object {
      $_.Line
    }

  [void]$schemaBuilder.AppendLine(
    ($columns -join "`n")
  )
  [void]$schemaBuilder.AppendLine('```')
}

if (Test-Path "database/metadata/table-constraints.csv") {
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine(
    "# ============================================================"
  )
  [void]$schemaBuilder.AppendLine(
    "# RELEVANT TABLE CONSTRAINTS"
  )
  [void]$schemaBuilder.AppendLine(
    "# ============================================================"
  )
  [void]$schemaBuilder.AppendLine("")
  [void]$schemaBuilder.AppendLine('```text')

  $constraints =
    Get-Content `
      database/metadata/table-constraints.csv |
    Select-String `
      -Pattern `
      "combat|spell|monster|character_statistics|character_buffs" |
    ForEach-Object {
      $_.Line
    }

  [void]$schemaBuilder.AppendLine(
    ($constraints -join "`n")
  )
  [void]$schemaBuilder.AppendLine('```')
}

[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine(
  "# ============================================================"
)
[void]$schemaBuilder.AppendLine(
  "# MIGRATION STATUS"
)
[void]$schemaBuilder.AppendLine(
  "# ============================================================"
)
[void]$schemaBuilder.AppendLine("")
[void]$schemaBuilder.AppendLine('```text')

$migrationStatus =
  npm run db:migrate:status 2>&1

[void]$schemaBuilder.AppendLine(
  ($migrationStatus -join "`n")
)
[void]$schemaBuilder.AppendLine('```')

Set-Content `
  M4_SCHEMA_DATA_DUMP.md `
  $schemaBuilder.ToString()

Write-Host ""
Write-Host "Generated:"
Write-Host "  M4_TECHNICAL_DUMP.md"
Write-Host "  M4_SCHEMA_DATA_DUMP.md"
Write-Host ""

Get-Item `
  M4_TECHNICAL_DUMP.md, `
  M4_SCHEMA_DATA_DUMP.md |
  Select-Object `
    Name, `
    Length, `
    LastWriteTime

