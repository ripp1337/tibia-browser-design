import {
  createHash,
} from "node:crypto";
import type {
  IncomingMessage,
} from "node:http";
import type {
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  AuthenticationContext,
  AuthenticationProvider,
} from "./http-auth.js";

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

type AuthenticationRow = {
  account_id: string;
};

function extractBearerToken(
  request: IncomingMessage
): string | null {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return null;
  }

  const match = /^Bearer ([^\s]+)$/iu.exec(
    authorization
  );

  return match?.[1] ?? null;
}

export function hashSessionToken(
  token: string
): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export class PostgresAuthenticationProvider
  implements AuthenticationProvider
{
  public constructor(
    private readonly database: Queryable
  ) {}

  public async authenticate(
    request: IncomingMessage
  ): Promise<AuthenticationContext | null> {
    const token = extractBearerToken(request);

    if (!token) {
      return null;
    }

    const tokenHash = hashSessionToken(token);

    const result =
      await this.database.query<AuthenticationRow>(
        `
          UPDATE account_sessions AS session
          SET last_activity_at = now()
          FROM accounts AS account
          WHERE session.account_id = account.account_id
            AND session.session_token_hash = $1
            AND session.is_revoked = FALSE
            AND session.expires_at > now()
            AND account.status = 'Active'
          RETURNING session.account_id
        `,
        [tokenHash]
      );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      accountId: row.account_id,
    };
  }
}