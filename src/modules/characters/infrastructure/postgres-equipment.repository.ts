import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import {
  CalculateCharacterStatsService,
} from "../application/calculate-character-stats.service.js";
import type {
  EquipmentMutationInput,
  EquipmentMutationResult,
  EquipmentRepository,
} from "../application/equipment.repository.js";
import {
  CharacterAccessDeniedError,
  EquipmentAlreadyEquippedError,
  EquipmentLevelRequiredError,
  EquipmentNotEquippedError,
  InventoryItemNotFoundError,
} from "../domain/character.errors.js";
import {
  withTransaction,
} from "../../../infrastructure/database/transaction.js";
import {
  PostgresCharacterStatisticsRepository,
} from "./postgres-character-statistics.repository.js";

type CharacterResourceRow = {
  level: number;
  current_health: string;
  current_mana: string;
  current_energy: string;
  resources_updated_at: Date;
};

type InventoryEquipmentRow = {
  inventory_item_id: string;
  slot: string;
  handedness: "OneHanded" | "TwoHanded" | null;
  required_level: number;
  is_equipped: boolean;
};

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

function parseSafeInteger(
  value: string,
  fieldName: string
): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(
      `${fieldName} must be a non-negative safe integer.`
    );
  }

  return parsed;
}

async function lockCharacter(
  client: PoolClient,
  input: EquipmentMutationInput
): Promise<CharacterResourceRow> {
  const result =
    await client.query<CharacterResourceRow>(
      `
        SELECT
          level,
          current_health,
          current_mana,
          current_energy,
          resources_updated_at
        FROM characters
        WHERE account_id = $1
          AND character_id = $2
          AND status = 'IsActive'
        FOR UPDATE
      `,
      [
        input.accountId,
        input.characterId,
      ]
    );

  const row = result.rows[0];

  if (row === undefined) {
    throw new CharacterAccessDeniedError();
  }

  return row;
}

async function lockInventory(
  client: PoolClient,
  characterId: string
): Promise<void> {
  await client.query(
    `
      SELECT inventory_item_id
      FROM inventory_items
      WHERE character_id = $1
      ORDER BY inventory_item_id
      FOR UPDATE
    `,
    [characterId]
  );
}

async function findInventoryItem(
  database: Queryable,
  input: EquipmentMutationInput
): Promise<InventoryEquipmentRow> {
  const result =
    await database.query<InventoryEquipmentRow>(
      `
        SELECT
          ii.inventory_item_id,
          ib.slot,
          ib.handedness,
          ib.required_level,
          ii.is_equipped
        FROM inventory_items ii
        INNER JOIN items i
          ON i.item_id = ii.item_id
        INNER JOIN item_bases ib
          ON ib.item_base_id = i.item_base_id
        WHERE ii.character_id = $1
          AND ii.inventory_item_id = $2
      `,
      [
        input.characterId,
        input.inventoryItemId,
      ]
    );

  const row = result.rows[0];

  if (row === undefined) {
    throw new InventoryItemNotFoundError();
  }

  return row;
}

async function unequipConflictingItems(
  client: PoolClient,
  characterId: string,
  item: InventoryEquipmentRow
): Promise<void> {
  await client.query(
    `
      UPDATE inventory_items current_inventory
      SET is_equipped = FALSE
      FROM items current_item
      INNER JOIN item_bases current_base
        ON current_base.item_base_id =
          current_item.item_base_id
      WHERE current_inventory.item_id =
          current_item.item_id
        AND current_inventory.character_id = $1
        AND current_inventory.inventory_item_id <> $2
        AND current_inventory.is_equipped = TRUE
        AND current_base.slot = $3
    `,
    [
      characterId,
      item.inventory_item_id,
      item.slot,
    ]
  );

  if (
    item.slot === "Weapon" &&
    item.handedness === "TwoHanded"
  ) {
    await client.query(
      `
        UPDATE inventory_items current_inventory
        SET is_equipped = FALSE
        FROM items current_item
        INNER JOIN item_bases current_base
          ON current_base.item_base_id =
            current_item.item_base_id
        WHERE current_inventory.item_id =
            current_item.item_id
          AND current_inventory.character_id = $1
          AND current_inventory.is_equipped = TRUE
          AND current_base.slot = 'Shield'
      `,
      [characterId]
    );
  }

  if (item.slot === "Shield") {
    await client.query(
      `
        UPDATE inventory_items current_inventory
        SET is_equipped = FALSE
        FROM items current_item
        INNER JOIN item_bases current_base
          ON current_base.item_base_id =
            current_item.item_base_id
        WHERE current_inventory.item_id =
            current_item.item_id
          AND current_inventory.character_id = $1
          AND current_inventory.is_equipped = TRUE
          AND current_base.slot = 'Weapon'
          AND current_base.handedness = 'TwoHanded'
      `,
      [characterId]
    );
  }
}

async function recalculateAndPersistResources(
  client: PoolClient,
  input: EquipmentMutationInput,
  character: CharacterResourceRow
): Promise<EquipmentMutationResult> {
  const statisticsRepository =
    new PostgresCharacterStatisticsRepository(client);

  const statisticsService =
    new CalculateCharacterStatsService(
      statisticsRepository
    );

  const effectiveStatistics =
    await statisticsService.execute({
      characterId: input.characterId,
    });

  const currentHealth = Math.min(
    parseSafeInteger(
      character.current_health,
      "current_health"
    ),
    effectiveStatistics.maximumHealth
  );

  const currentMana = Math.min(
    parseSafeInteger(
      character.current_mana,
      "current_mana"
    ),
    effectiveStatistics.maximumMana
  );

  const currentEnergy = Math.min(
    parseSafeInteger(
      character.current_energy,
      "current_energy"
    ),
    effectiveStatistics.maximumEnergy
  );

  const resources = {
    currentHealth,
    maximumHealth:
      effectiveStatistics.maximumHealth,

    currentMana,
    maximumMana:
      effectiveStatistics.maximumMana,

    currentEnergy,
    maximumEnergy:
      effectiveStatistics.maximumEnergy,

    resourcesUpdatedAt:
      character.resources_updated_at,
  };

  await client.query(
    `
      UPDATE characters
      SET
        current_health = $3,
        max_health = $4,
        current_mana = $5,
        max_mana = $6,
        current_energy = $7,
        max_energy = $8,
        updated_at = NOW()
      WHERE account_id = $1
        AND character_id = $2
    `,
    [
      input.accountId,
      input.characterId,
      resources.currentHealth,
      resources.maximumHealth,
      resources.currentMana,
      resources.maximumMana,
      resources.currentEnergy,
      resources.maximumEnergy,
    ]
  );

  return {
    inventoryItemId: input.inventoryItemId,
    effectiveStatistics,
    resources,
  };
}

export class PostgresEquipmentRepository
  implements EquipmentRepository
{
  public constructor(
    private readonly pool: Pool
  ) {}

  public async equip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult> {
    return withTransaction(
      this.pool,
      async (client) => {
        const character =
          await lockCharacter(client, input);

        await lockInventory(
          client,
          input.characterId
        );

        const item =
          await findInventoryItem(client, input);

        if (item.is_equipped) {
          throw new EquipmentAlreadyEquippedError();
        }

        if (character.level < item.required_level) {
          throw new EquipmentLevelRequiredError(
            item.required_level,
            character.level
          );
        }

        await unequipConflictingItems(
          client,
          input.characterId,
          item
        );

        await client.query(
          `
            UPDATE inventory_items
            SET is_equipped = TRUE
            WHERE character_id = $1
              AND inventory_item_id = $2
          `,
          [
            input.characterId,
            input.inventoryItemId,
          ]
        );

        return recalculateAndPersistResources(
          client,
          input,
          character
        );
      }
    );
  }

  public async unequip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult> {
    return withTransaction(
      this.pool,
      async (client) => {
        const character =
          await lockCharacter(client, input);

        await lockInventory(
          client,
          input.characterId
        );

        const item =
          await findInventoryItem(client, input);

        if (!item.is_equipped) {
          throw new EquipmentNotEquippedError();
        }

        await client.query(
          `
            UPDATE inventory_items
            SET is_equipped = FALSE
            WHERE character_id = $1
              AND inventory_item_id = $2
          `,
          [
            input.characterId,
            input.inventoryItemId,
          ]
        );

        return recalculateAndPersistResources(
          client,
          input,
          character
        );
      }
    );
  }
}
