# TASK SYSTEM

## Overview

The Task System tracks monster kill progress and unlocks Task Boss encounters.

Task progression is tied to monster families and is fully database-driven.

Task progression is tracked per character.

---

# Monster Family Tasks

Task progression is based on killing monsters belonging to specific families.

Examples:

Rat Family

Kill 100 Rats

↓

Unlock Rat King

---

Wolf Family

Kill 250 Wolves

↓

Unlock Wolf Alpha

---

Vampire Family

Kill 500 Vampires

↓

Unlock Vampire Lord

---

Task requirements are defined individually for each monster family.

Requirements are fully database-driven.

---

# Progress Tracking

Task progress is tracked through monster kill counts.

Examples:

Rat

83 / 100

Task Boss:

Rat King

Status:

Locked

---

Rat

100 / 100

Task Boss:

Rat King

Status:

Unlocked

---

# Unlock Conditions

Each monster may define:

- Task Boss ID
- Required Kills

Example:

Rat

→ Rat King

Required Kills:

100

Values are fully database-driven.

---

# Bestiary Integration

Task progress is displayed directly in the Bestiary.

Displayed Information:

- Current Kill Count
- Required Kill Count
- Assigned Task Boss
- Unlock Status

Example:

Rat

Kills:

83 / 100

Task Boss:

Rat King

Status:

Locked

---

Rat

Kills:

100 / 100

Task Boss:

Rat King

Status:

Unlocked

---

# Character Tracking

Monster kill counts are tracked per character.

Examples:

Rat:

500

Wolf:

120

Dragon:

7

Kill count tracking is used for:

- Achievements
- Task Bosses
- Statistics
- Bestiary

---

# Monster Family Integration

Monster Families are used for:

- Task Bosses
- Unique Items
- Set Items
- Content Theming

Examples:

Rats

- Rat
- Plague Rat
- Giant Rat

---

Dragons

- Dragon
- Dragon Lord
- Ancient Dragon

---

Vampires

- Vampire
- Vampire Bride
- Vampire Lord

---

# Task Boss Integration

Task progression unlocks Task Bosses.

Examples:

Rat

↓

Rat King

Wolf

↓

Wolf Alpha

Vampire

↓

Vampire Lord

Task Boss unlocking requirements are defined per monster family.

---

# Database

## CharacterMonsterKills

Stores:

- Character
- Monster
- Kill Count

---

## MonsterTasks

Stores:

- Task Boss Assignment
- Required Kills

---

# Design Philosophy

Task progression follows:

Kill Monsters

↓

Accumulate Kill Count

↓

Reach Requirement

↓

Unlock Task Boss

↓

Fight Task Boss

The system provides long-term monster family progression and supports Task Boss content.
``