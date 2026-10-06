import type {
  IncomingMessage,
} from "node:http";
import type {
  QueryResult,
} from "pg";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PostgresAuthenticationProvider,
  hashSessionToken,
} from "../../../src/http/postgres-authentication.provider.js";

function createRequest(
  authorization?: string
): IncomingMessage {
  return {
    headers: authorization
      ? {
          authorization,
        }
      : {},
  } as IncomingMessage;
}

function createQueryResult(
  rows: { account_id: string }[]
): QueryResult<{ account_id: string }> {
  return {
    command: "UPDATE",
    rowCount: rows.length,
    oid: 0,
    fields: [],
    rows,
  };
}

describe("hashSessionToken", () => {
  it("creates a deterministic SHA-256 hash", () => {
    expect(
      hashSessionToken("test-session-token")
    ).toBe(
      "7a16f44e82f892c5db994ff1fe2c468656ad31af77ebe04b1d02be3bf8d4cc8e"
    );
  });

  it("does not return the original token", () => {
    const token = "secret-session-token";

    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(token)).toHaveLength(64);
  });
});

describe("PostgresAuthenticationProvider", () => {
  it("authenticates a valid Bearer session", async () => {
    const query = vi.fn().mockResolvedValue(
      createQueryResult([
        {
          account_id: "account-1",
        },
      ])
    );

    const provider =
      new PostgresAuthenticationProvider({
        query,
      });

    await expect(
      provider.authenticate(
        createRequest(
          "Bearer valid-session-token"
        )
      )
    ).resolves.toEqual({
      accountId: "account-1",
    });

    expect(query).toHaveBeenCalledOnce();

    const call = query.mock.calls[0];

    expect(call?.[0]).toContain(
      "session.session_token_hash = $1"
    );

    expect(call?.[0]).toContain(
      "session.is_revoked = FALSE"
    );

    expect(call?.[0]).toContain(
      "session.expires_at > now()"
    );

    expect(call?.[0]).toContain(
      "account.status = 'Active'"
    );

    expect(call?.[0]).toContain(
      "SET last_activity_at = now()"
    );

    expect(call?.[1]).toEqual([
      hashSessionToken("valid-session-token"),
    ]);
  });

  it("returns null when authorization is missing", async () => {
    const query = vi.fn();

    const provider =
      new PostgresAuthenticationProvider({
        query,
      });

    await expect(
      provider.authenticate(createRequest())
    ).resolves.toBeNull();

    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "Basic credentials",
    "Bearer",
    "Bearer ",
    "Bearer token with spaces",
  ])(
    "rejects malformed authorization: %s",
    async (authorization) => {
      const query = vi.fn();

      const provider =
        new PostgresAuthenticationProvider({
          query,
        });

      await expect(
        provider.authenticate(
          createRequest(authorization)
        )
      ).resolves.toBeNull();

      expect(query).not.toHaveBeenCalled();
    }
  );

  it("returns null when the session is invalid", async () => {
    const query = vi.fn().mockResolvedValue(
      createQueryResult([])
    );

    const provider =
      new PostgresAuthenticationProvider({
        query,
      });

    await expect(
      provider.authenticate(
        createRequest("Bearer invalid-token")
      )
    ).resolves.toBeNull();
  });

  it("propagates database errors", async () => {
    const databaseError = new Error(
      "Database unavailable"
    );

    const query = vi.fn().mockRejectedValue(
      databaseError
    );

    const provider =
      new PostgresAuthenticationProvider({
        query,
      });

    await expect(
      provider.authenticate(
        createRequest("Bearer valid-token")
      )
    ).rejects.toBe(databaseError);
  });
});