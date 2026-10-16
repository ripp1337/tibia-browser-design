import type {
  CompleteRegularItemBaseCandidate,
  GeneratedOtherLoot,
  GeneratedRegularItem,
  GeneratedSpecialItem,
  ItemScoreCoefficients,
  OtherLootCandidate,
  SpecialItemCandidate,
  UniquePityState,
} from "../domain/item-generation.types.js";

export type LootGenerationContext = {
  characterId: string;
  monsterId: string;
  monsterFamilyId: string | null;
};

export type LootCatalogSnapshot = {
  regularItemBases: readonly CompleteRegularItemBaseCandidate[];
  otherLootCandidates: readonly OtherLootCandidate[];
  specialItemCandidates: readonly SpecialItemCandidate[];
  itemScoreCoefficients: ItemScoreCoefficients;
};

export type LockedLootCharacter = {
  characterId: string;
  inventoryCapacity: number;
  occupiedInventoryPositions: readonly number[];
  pity: UniquePityState;
};

export type PersistedEquipmentItem = {
  itemId: string;
  inventoryPosition: number;
};

export type PersistRegularItemInput = {
  characterId: string;
  inventoryPosition: number;
  item: GeneratedRegularItem;
};

export type PersistSpecialItemInput = {
  characterId: string;
  inventoryPosition: number;
  item: GeneratedSpecialItem;
};

export type ApplyOtherLootInput = {
  characterId: string;
  reward: GeneratedOtherLoot;
};

export type UpdateUniquePityInput = {
  characterId: string;
  pity: UniquePityState;
};

export interface LootSettlementTransaction {
  readonly character: LockedLootCharacter;

  loadCatalog(
    context: LootGenerationContext
  ): Promise<LootCatalogSnapshot>;

  persistRegularItem(
    input: PersistRegularItemInput
  ): Promise<PersistedEquipmentItem>;

  persistSpecialItem(
    input: PersistSpecialItemInput
  ): Promise<PersistedEquipmentItem>;

  applyOtherLoot(
    input: ApplyOtherLootInput
  ): Promise<void>;

  updateUniquePity(
    input: UpdateUniquePityInput
  ): Promise<void>;
}

export interface LootRepository {
  withSettlementTransaction<TResult>(
    context: LootGenerationContext,
    operation: (
      transaction: LootSettlementTransaction
    ) => Promise<TResult>
  ): Promise<TResult>;
}