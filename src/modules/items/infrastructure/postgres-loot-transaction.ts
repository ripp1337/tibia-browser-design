import type { PoolClient } from "pg";
import type {
  ApplyOtherLootInput,
  LootGenerationContext,
  LootSettlementTransaction,
  PersistRegularItemInput,
  PersistSpecialItemInput,
  UpdateUniquePityInput,
} from "../application/loot.repository.js";
import { loadLootCatalog } from "./postgres-loot-catalog.js";
import { lockLootCharacterState } from "./postgres-loot-lock.js";
import {
  applyOtherLootReward,
  persistRegularLootItem,
  persistSpecialLootItem,
  updateUniquePityState,
} from "./postgres-loot-persistence.js";

export type SharedLootTransactionClient = Pick<PoolClient, "query">;

function requireContext(context: LootGenerationContext): void {
  if (context.characterId.length === 0) {
    throw new Error("Character ID cannot be empty.");
  }
  if (context.monsterId.length === 0) {
    throw new Error("Monster ID cannot be empty.");
  }
}

function requireLockedCharacter(
  expectedCharacterId: string,
  receivedCharacterId: string
): void {
  if (receivedCharacterId !== expectedCharacterId) {
    throw new Error(
      "Loot persistence Character ID must match the locked Character."
    );
  }
}

export async function createPostgresLootSettlementTransaction(
  client: SharedLootTransactionClient,
  context: LootGenerationContext
): Promise<LootSettlementTransaction> {
  requireContext(context);

  const character = await lockLootCharacterState(
    client,
    context.characterId
  );

  return {
    character,

    loadCatalog: async (receivedContext) => {
      if (
        receivedContext.characterId !== context.characterId ||
        receivedContext.monsterId !== context.monsterId ||
        receivedContext.monsterFamilyId !== context.monsterFamilyId
      ) {
        throw new Error(
          "Loot catalog context must match the settlement transaction."
        );
      }
      return loadLootCatalog(client, receivedContext);
    },

    persistRegularItem: async (input: PersistRegularItemInput) => {
      requireLockedCharacter(context.characterId, input.characterId);
      return persistRegularLootItem(client, input);
    },

    persistSpecialItem: async (input: PersistSpecialItemInput) => {
      requireLockedCharacter(context.characterId, input.characterId);
      return persistSpecialLootItem(client, input);
    },

    applyOtherLoot: async (input: ApplyOtherLootInput) => {
      requireLockedCharacter(context.characterId, input.characterId);
      await applyOtherLootReward(client, input);
    },

    updateUniquePity: async (input: UpdateUniquePityInput) => {
      requireLockedCharacter(context.characterId, input.characterId);
      await updateUniquePityState(client, input);
    },
  };
}