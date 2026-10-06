import type {
  AccountId,
  CharacterId,
  CharacterResources,
} from "../domain/character.types.js";
import type {
  EffectiveCharacterStatistics,
} from "../domain/effective-character-statistics.js";

export type InventoryItemId = string;

export type EquipmentMutationInput = {
  accountId: AccountId;
  characterId: CharacterId;
  inventoryItemId: InventoryItemId;
};

export type EquipmentMutationResult = {
  inventoryItemId: InventoryItemId;
  effectiveStatistics: EffectiveCharacterStatistics;
  resources: CharacterResources;
};

export interface EquipmentRepository {
  equip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult>;

  unequip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult>;
}
