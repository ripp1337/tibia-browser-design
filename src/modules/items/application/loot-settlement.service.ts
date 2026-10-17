import type { RandomSource } from "../../combat/ports/random-source.js";
import type {
  LootGenerationContext,
  LootRepository,
  LootSettlementTransaction,
  PersistedEquipmentItem,
} from "./loot.repository.js";
import { generateCompleteRegularItem } from "../domain/complete-regular-item-generator.js";
import { rollItemLevel } from "../domain/item-loot-level.js";
import { generateOtherLoot } from "../domain/other-loot-generator.js";
import { generateSpecialItemReward } from "../domain/special-item-generator.js";
import type {
  GeneratedOtherLoot,
  GeneratedRegularItem,
  GeneratedSpecialItem,
  ItemLootContext,
  SpecialItemRewardResult,
  UniquePityState,
} from "../domain/item-generation.types.js";

export type LootLossReason = "InventoryFull";

export type EquipmentSettlementResult<TItem> =
  | { generated: null; persisted: null; lossReason: null }
  | { generated: TItem; persisted: PersistedEquipmentItem; lossReason: null }
  | { generated: TItem; persisted: null; lossReason: LootLossReason };

export type SettleLootInput = LootGenerationContext & {
  monsterLevel: number;
  bossBonusLootLevel: number;
  isBoss: boolean;
};

export type LootSettlementResult = {
  regularEquipment: EquipmentSettlementResult<GeneratedRegularItem>;
  specialEquipment: EquipmentSettlementResult<GeneratedSpecialItem>;
  specialRollOutcome: SpecialItemRewardResult["outcome"];
  otherLoot: GeneratedOtherLoot | null;
  pity: UniquePityState;
};

type GeneratedSettlement = {
  regular: GeneratedRegularItem | null;
  other: GeneratedOtherLoot | null;
  special: SpecialItemRewardResult;
};

export type LootSettlementDependencies = {
  generateRegular: typeof generateCompleteRegularItem;
  generateOther: typeof generateOtherLoot;
  rollSpecialItemLevel: typeof rollItemLevel;
  generateSpecial: typeof generateSpecialItemReward;
};

const defaultDependencies: LootSettlementDependencies = {
  generateRegular: generateCompleteRegularItem,
  generateOther: generateOtherLoot,
  rollSpecialItemLevel: rollItemLevel,
  generateSpecial: generateSpecialItemReward,
};

function nextFreePositions(
  capacity: number,
  occupied: readonly number[]
): number[] {
  if (!Number.isSafeInteger(capacity) || capacity < 1) {
    throw new Error("Inventory capacity must be a positive safe integer.");
  }
  const occupiedSet = new Set(occupied);
  return Array.from({ length: capacity }, (_, index) => index + 1)
    .filter((position) => !occupiedSet.has(position));
}

function emptyEquipmentResult<TItem>(): EquipmentSettlementResult<TItem> {
  return { generated: null, persisted: null, lossReason: null };
}

async function persistGeneratedLoot(
  transaction: LootSettlementTransaction,
  generated: GeneratedSettlement
): Promise<LootSettlementResult> {
  const freePositions = nextFreePositions(
    transaction.character.inventoryCapacity,
    transaction.character.occupiedInventoryPositions
  );

  let specialEquipment = emptyEquipmentResult<GeneratedSpecialItem>();
  let regularEquipment = emptyEquipmentResult<GeneratedRegularItem>();
  let pity = generated.special.nextPity;

  if (generated.special.outcome === "Generated") {
    const position = freePositions.shift();
    if (position === undefined) {
      specialEquipment = {
        generated: generated.special.item,
        persisted: null,
        lossReason: "InventoryFull",
      };
      pity = transaction.character.pity;
    } else {
      const persisted = await transaction.persistSpecialItem({
        characterId: transaction.character.characterId,
        inventoryPosition: position,
        item: generated.special.item,
      });
      specialEquipment = {
        generated: generated.special.item,
        persisted,
        lossReason: null,
      };
      pity = { eligibleKillCount: 0, chancePerMille: 1 };
    }
  }

  if (generated.regular !== null) {
    const position = freePositions.shift();
    if (position === undefined) {
      regularEquipment = {
        generated: generated.regular,
        persisted: null,
        lossReason: "InventoryFull",
      };
    } else {
      const persisted = await transaction.persistRegularItem({
        characterId: transaction.character.characterId,
        inventoryPosition: position,
        item: generated.regular,
      });
      regularEquipment = {
        generated: generated.regular,
        persisted,
        lossReason: null,
      };
    }
  }

  if (generated.other !== null) {
    await transaction.applyOtherLoot({
      characterId: transaction.character.characterId,
      reward: generated.other,
    });
  }

  if (
    pity.eligibleKillCount !== transaction.character.pity.eligibleKillCount ||
    pity.chancePerMille !== transaction.character.pity.chancePerMille
  ) {
    await transaction.updateUniquePity({
      characterId: transaction.character.characterId,
      pity,
    });
  }

  return {
    regularEquipment,
    specialEquipment,
    specialRollOutcome: generated.special.outcome,
    otherLoot: generated.other,
    pity,
  };
}

export class LootSettlementService {
  public constructor(
    private readonly repository: LootRepository,
    private readonly randomSource: RandomSource,
    private readonly dependencies: LootSettlementDependencies = defaultDependencies
  ) {}

  public async settle(input: SettleLootInput): Promise<LootSettlementResult> {
    const lootContext: ItemLootContext = {
      monsterLevel: input.monsterLevel,
      bossBonusLootLevel: input.bossBonusLootLevel,
      isBoss: input.isBoss,
    };
    const repositoryContext: LootGenerationContext = {
      characterId: input.characterId,
      monsterId: input.monsterId,
      monsterFamilyId: input.monsterFamilyId,
    };

    return this.repository.withSettlementTransaction(
      repositoryContext,
      async (transaction) => {
        const catalog = await transaction.loadCatalog(repositoryContext);

        const regular = this.dependencies.generateRegular({
          context: lootContext,
          itemBaseCandidates: catalog.regularItemBases,
          coefficients: catalog.itemScoreCoefficients,
        }, this.randomSource);

        const other = this.dependencies.generateOther({
          isBoss: input.isBoss,
          candidates: catalog.otherLootCandidates,
        }, this.randomSource);

        const specialItemLevel = this.dependencies.rollSpecialItemLevel(
          lootContext,
          this.randomSource
        );
        const special = this.dependencies.generateSpecial({
          defeatedMonsterId: input.monsterId,
          defeatedMonsterFamilyId: input.monsterFamilyId,
          defeatedSourceIsBoss: input.isBoss,
          rolledItemLevel: specialItemLevel,
          pity: transaction.character.pity,
          candidates: catalog.specialItemCandidates,
          coefficients: catalog.itemScoreCoefficients,
        }, this.randomSource);

        return persistGeneratedLoot(transaction, { regular, other, special });
      }
    );
  }
}