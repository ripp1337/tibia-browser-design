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

export const AFFIX_COUNT_BY_RARITY = {
  Common: 0,
  Magic: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
} as const;

export const POSTGRES_BIGINT_MAXIMUM = 9223372036854775807n;
