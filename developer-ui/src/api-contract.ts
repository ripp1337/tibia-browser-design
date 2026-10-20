/**
 * Typed view of the backend HTTP contract used by the Developer UI.
 *
 * Rules encoded here (see HTTP_CONTRACT.md):
 * - PostgreSQL BIGINT values arrive as JSON strings (`experience`, `gold`,
 *   `itemScore`, `quantity`, `statistics`, ids that are bigint-derived).
 *   They are typed as `string` and must never be coerced with `Number()`,
 *   `parseInt()` or unary `+` in the UI.
 * - Dates are ISO date strings.
 * - The server is authoritative for settlement and loot.
 */

/** A JSON string that carries a server-side BigInt value. */
export type BigIntString = string;

// ---------------------------------------------------------------------------
// Character
// ---------------------------------------------------------------------------

export type CharacterSummary = {
  characterId: string;
  name: string;
  status: string;
  level: number;
  experience: BigIntString;
};

export type CharacterResources = {
  currentHealth: number;
  maximumHealth: number;
  currentMana: number;
  maximumMana: number;
  currentEnergy: number;
  maximumEnergy: number;
  resourcesUpdatedAt: string;
};

export type CharacterSnapshot = {
  characterId: string;
  name: string;
  status: string;
  progression: {
    level: number;
    experience: BigIntString;
    gold: BigIntString;
  };
  resources: CharacterResources;
  effectiveStatistics: {
    attack: number;
    defense: number;
    spellPower: number;
    maximumHealth: number;
    maximumMana: number;
    maximumEnergy: number;
    goldBonusPercent: number;
    experienceBonusPercent: number;
  };
};

// ---------------------------------------------------------------------------
// Monsters
// ---------------------------------------------------------------------------

export type MonsterType = "Normal" | "MiniBoss" | "TaskBoss" | "DailyBoss";

export type MonsterCooldown = {
  isActive: boolean;
  availableAt: string | null;
};

export type MonsterListItem = {
  code: string;
  name: string;
  level: number;
  monsterType: MonsterType;
  energyCost: number;
  eligibility: {
    isEligible: boolean;
    reasons: readonly string[];
  };
  cooldown: MonsterCooldown;
  bestiaryVisible: boolean;
};

export type MonsterDetails = MonsterListItem & {
  description: string;
};

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

export type CombatStatus = "Active" | "Victory" | "Defeat";

export type CombatSettlementOutcome = "Victory" | "Defeat";

export type CombatEvent = {
  type: string;
  actor?: string;
  target?: string;
  hit?: boolean;
  damage?: number;
  status?: string;
  defeatReason?: string | null;
  turn?: number;
};

export type CombatSettlement = {
  outcome: CombatSettlementOutcome;
  experience: {
    before: BigIntString;
    awarded: BigIntString;
    lost: BigIntString;
    after: BigIntString;
  };
  gold: {
    before: BigIntString;
    baseRolled: BigIntString;
    awarded: BigIntString;
    after: BigIntString;
  };
  level: { before: number; after: number; levelsChanged: number };
  blessingConsumed: boolean;
  bestiary: { discovered: boolean; killCount: BigIntString | null };
  taskBoss: { progressed: boolean; status: string | null };
  cooldown: { applied: boolean; availableAt: string | null };
  dailyBoss: { updated: boolean; victoryRecorded: boolean };
  statistics: {
    damageDealt: BigIntString;
    damageTaken: BigIntString;
    highestPhysicalHit: BigIntString;
  };
  finalSummary: {
    combatSessionId: string;
    outcome: CombatSettlementOutcome;
    turnCount: number;
    startedAt: string;
    endedAt: string;
  };
};

export type CombatSession = {
  combatSessionId: string;
  characterId: string;
  monsterId: string;
  monsterCode: string;
  status: CombatStatus;
  defeatReason: string | null;
  currentTurn: number;
  player: {
    currentHealth: number;
    maximumHealth: number;
    attack: number;
    defense: number;
  };
  monster: {
    currentHealth: number;
    maximumHealth: number;
    attack: number;
    defense: number;
  };
  startedAt: string;
  endedAt: string | null;
  settledAt: string | null;
  events: readonly CombatEvent[];
  settlement: CombatSettlement | null;
  /** Present for Victory, `null` for Defeat. */
  loot: LootSettlement | null;
};

// ---------------------------------------------------------------------------
// Loot settlement (M7)
// ---------------------------------------------------------------------------

export type ItemRarity =
  | "Common"
  | "Magic"
  | "Rare"
  | "Epic"
  | "Legendary";

export type ItemStatType =
  | "Attack"
  | "Defense"
  | "SpellPower"
  | "Health"
  | "Mana"
  | "Energy"
  | "GoldPercent"
  | "ExperiencePercent";

export type SpecialItemCategory = "Unique" | "Set";

export type LootLossReason = "InventoryFull";

export type SpecialRollOutcome = "Ineligible" | "Failed" | "Generated";

/** A generated regular Affix; `rollValue` is a BigInt serialized as a string. */
export type GeneratedAffix = {
  affixTemplateId: string;
  affixPosition: number;
  statType: ItemStatType;
  rollValue: BigIntString;
};

/** A generated fixed stat for a Special Item; `rollValue` is a string. */
export type GeneratedFixedStat = {
  statPosition: number;
  statType: ItemStatType;
  rollValue: BigIntString;
};

/** Complete generated regular Item returned by the server. */
export type GeneratedRegularItem = {
  kind: "Regular";
  itemBaseId: string;
  itemLevel: number;
  requiredLevel: number;
  rarity: ItemRarity;
  affixes: readonly GeneratedAffix[];
  fixedStats: readonly [];
  itemScore: BigIntString;
};

/**
 * Complete generated Special Item. The server guarantees `rarity: null` and
 * an empty `affixes` array; `fixedStats` may legitimately be empty.
 */
export type GeneratedSpecialItem = {
  kind: "Special";
  itemBaseId: string;
  itemLevel: number;
  requiredLevel: number;
  rarity: null;
  affixes: readonly [];
  fixedStats: readonly GeneratedFixedStat[];
  itemScore: BigIntString;
};

/** Persisted identity and inventory information of a saved Item. */
export type PersistedEquipmentItem = {
  itemId: string;
  inventoryPosition: number;
};

/**
 * Equipment settlement result. `generated`, `persisted` and `lossReason` are
 * modelled loosely so the renderer tolerates every server state:
 * - no generated Item:      generated = null,  persisted = null, lossReason = null
 * - persisted Item:         generated = item,  persisted = identity, lossReason = null
 * - lost Item:              generated = item,  persisted = null, lossReason = "InventoryFull"
 */
export type EquipmentSettlementResult<TItem> = {
  generated: TItem | null;
  persisted: PersistedEquipmentItem | null;
  lossReason: string | null;
};

export type GeneratedOtherLoot =
  | {
      kind: "Material";
      otherLootTableId: string;
      materialId: string;
      quantity: BigIntString;
    }
  | {
      kind: "Consumable";
      otherLootTableId: string;
      consumableDefinitionId: string;
      quantity: BigIntString;
    };

export type UniquePityState = {
  eligibleKillCount: number;
  chancePerMille: number;
};

export type LootSettlement = {
  regularEquipment: EquipmentSettlementResult<GeneratedRegularItem>;
  specialEquipment: EquipmentSettlementResult<GeneratedSpecialItem>;
  specialRollOutcome: SpecialRollOutcome;
  otherLoot: GeneratedOtherLoot | null;
  pity: UniquePityState;
};
