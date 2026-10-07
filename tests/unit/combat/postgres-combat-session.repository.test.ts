import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CombatAlreadyActiveError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";

type QueryResponse = {
  rows: QueryResultRow[];
  rowCount: number;
};

function createQueryResult(
  rows: QueryResultRow[] = [],
  rowCount = rows.length
): QueryResponse {
  return {
    rows,
    rowCount,
  };
}

function createLockedCharacterRow() {
  return {
    character_id: "character-1",
    account_id: "account-1",
    level: 10,
    current_health: "180",
    max_health: "180",
    current_mana: "35",
    max_mana: "35",
    current_energy: "100",
    max_energy: "100",
    resources_updated_at:
      new Date("2026-10-07T20:00:00.000Z"),
  };
}

function createRepositoryFixture(
  activeCombat = false
) {
  const release = vi.fn();

  const query = vi.fn(
    async (
      queryText: string
    ): Promise<QueryResponse> => {
      const normalized = queryText.trim();

      if (
        normalized === "BEGIN" ||
        normalized === "COMMIT" ||
        normalized === "ROLLBACK"
      ) {
        return createQueryResult();
      }

      if (
        normalized.includes("FROM characters") &&
        normalized.includes("FOR UPDATE")
      ) {
        return createQueryResult([
          createLockedCharacterRow(),
        ]);
      }

      if (
        normalized.includes("FROM combat_sessions") &&
        normalized.includes("status = 'Active'")
      ) {
        return activeCombat
          ? createQueryResult([
              {
                combat_session_id: "session-1",
              },
            ])
          : createQueryResult();
      }

      throw new Error(
        `Unexpected query in test: ${normalized}`
      );
    }
  );

  const client = {
    query: query as unknown as PoolClient["query"],
    release,
  } as unknown as PoolClient;

  const connect =
    vi.fn().mockResolvedValue(client);

  const pool = {
    connect,
  } as unknown as Pool;

  return {
    repository:
      new PostgresCombatSessionRepository(pool),
    query,
    release,
    connect,
  };
}

const transactionInput = {
  accountId: "account-1",
  characterId: "character-1",
  observedAt:
    new Date("2026-10-07T21:00:00.000Z"),
};

describe(
  "PostgresCombatSessionRepository start transaction",
  () => {
    it(
      "locks the owned active character and commits",
      async () => {
        const fixture =
          createRepositoryFixture();

        const operation = vi.fn(
          async (transaction) => {
            expect(
              transaction.character
            ).toMatchObject({
              characterId: "character-1",
              accountId: "account-1",
              level: 10,
            });

            return "completed";
          }
        );

        const result =
          await fixture.repository.withStartTransaction(
            transactionInput,
            operation
          );

        expect(result).toBe("completed");
        expect(operation).toHaveBeenCalledOnce();

        const lockCall =
          fixture.query.mock.calls.find(
            ([queryText]) =>
              String(queryText).includes(
                "FROM characters"
              )
          );

        expect(lockCall).toBeDefined();
        expect(String(lockCall?.[0])).toContain(
          "FOR UPDATE"
        );
        expect(
          (
            lockCall as unknown as
              | [string, unknown[]]
              | undefined
          )?.[1]
        ).toEqual([
          "account-1",
          "character-1",
        ]);

        expect(fixture.query).toHaveBeenCalledWith(
          "BEGIN"
        );
        expect(fixture.query).toHaveBeenCalledWith(
          "COMMIT"
        );
        expect(
          fixture.query
        ).not.toHaveBeenCalledWith("ROLLBACK");
        expect(fixture.release).toHaveBeenCalledOnce();
      }
    );

    it(
      "rejects an existing active combat before operation",
      async () => {
        const fixture =
          createRepositoryFixture(true);

        const operation = vi.fn();

        await expect(
          fixture.repository.withStartTransaction(
            transactionInput,
            operation
          )
        ).rejects.toBeInstanceOf(
          CombatAlreadyActiveError
        );

        expect(operation).not.toHaveBeenCalled();
        expect(fixture.query).toHaveBeenCalledWith(
          "ROLLBACK"
        );
        expect(
          fixture.query
        ).not.toHaveBeenCalledWith("COMMIT");
        expect(fixture.release).toHaveBeenCalledOnce();
      }
    );

    it(
      "rolls back when the transaction operation fails",
      async () => {
        const fixture =
          createRepositoryFixture();

        const failure =
          new Error("Forced operation failure");

        await expect(
          fixture.repository.withStartTransaction(
            transactionInput,
            async () => {
              throw failure;
            }
          )
        ).rejects.toBe(failure);

        expect(fixture.query).toHaveBeenCalledWith(
          "ROLLBACK"
        );
        expect(
          fixture.query
        ).not.toHaveBeenCalledWith("COMMIT");
        expect(fixture.release).toHaveBeenCalledOnce();
      }
    );

    it("rejects an invalid observedAt value", async () => {
      const fixture =
        createRepositoryFixture();

      await expect(
        fixture.repository.withStartTransaction(
          {
            ...transactionInput,
            observedAt: new Date("invalid"),
          },
          async () => undefined
        )
      ).rejects.toThrow(
        "observedAt must contain a valid date."
      );

      expect(fixture.connect).not.toHaveBeenCalled();
    });
  }
);
