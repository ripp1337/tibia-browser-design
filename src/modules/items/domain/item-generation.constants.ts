export const ITEM_RARITY = {
  common: "Common",
  magic: "Magic",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
} as const;

export const ITEM_STAT_TYPE = {
  attack: "Attack",
  defense: "Defense",
  spellPower: "SpellPower",
  health: "Health",
  mana: "Mana",
  energy: "Energy",
  goldPercent: "GoldPercent",
  experiencePercent: "ExperiencePercent",
} as const;

export const ITEM_SCORE_COMPONENT = {
  itemLevel: "ItemLevel",
  ...ITEM_STAT_TYPE,
} as const;

export const EQUIPMENT_SLOT = {
  weapon: "Weapon",
  helmet: "Helmet",
  armor: "Armor",
  shield: "Shield",
  legs: "Legs",
  boots: "Boots",
  ring: "Ring",
  amulet: "Amulet",
} as const;

export const AFFIX_COUNT_BY_RARITY = {
  Common: 0,
  Magic: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
} as const;

export const CANONICAL_SLOT_WEIGHTS = {
  Weapon: 1n,
  Helmet: 1n,
  Armor: 1n,
  Shield: 1n,
  Legs: 1n,
  Boots: 1n,
  Ring: 1n,
  Amulet: 1n,
} as const;

export const PROBABILITY_SCALE = 1000;
export const REGULAR_MONSTER_EQUIPMENT_THRESHOLD = 300;
export const BOSS_EQUIPMENT_THRESHOLD = 800;

export const POSTGRES_BIGINT_MAXIMUM = 9223372036854775807n;