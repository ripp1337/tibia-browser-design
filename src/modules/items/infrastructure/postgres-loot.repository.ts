import type { Pool } from "pg";
import { withTransaction } from "../../../infrastructure/database/transaction.js";
import type {
  LootGenerationContext,
  LootRepository,
  LootSettlementTransaction,
} from "../application/loot.repository.js";
import {
  createPostgresLootSettlementTransaction,
} from "./postgres-loot-transaction.js";

export type PostgresLootPool = Pick<Pool, "connect">;

function validateContext(
  context: LootGenerationContext
): void {
  if (context.characterId.length === 0) {
    throw new Error("Character ID cannot be empty.");
  }

  if (context.monsterId.length === 0) {
    throw new Error("Monster ID cannot be empty.");
  }
}

export class PostgresLootRepository implements LootRepository {
  public constructor(
    private readonly pool: PostgresLootPool
  ) {}

  public async withSettlementTransaction<TResult>(
    context: LootGenerationContext,
    operation: (
      transaction: LootSettlementTransaction
    ) => Promise<TResult>
  ): Promise<TResult> {
    validateContext(context);

    return withTransaction(
      this.pool,
      async (client) => {
        const transaction =
          await createPostgresLootSettlementTransaction(
            client,
            context
          );

        return operation(transaction);
      }
    );
  }
}