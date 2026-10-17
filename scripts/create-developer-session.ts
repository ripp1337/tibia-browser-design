import { createHash, randomBytes } from "node:crypto";

import { databasePool } from "../src/database/pool.js";

const DEVELOPMENT_USERNAME = "developer_ui";
const SESSION_DURATION_HOURS = 24;

function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

async function main(): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);

  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    const accountResult = await client.query<{
      account_id: string;
      username: string;
    }>(
      `
        INSERT INTO accounts (
          username,
          password_hash,
          status
        )
        VALUES ($1, $2, 'Active')
        ON CONFLICT (username)
        DO UPDATE SET
          status = 'Active',
          updated_at = NOW()
        RETURNING
          account_id,
          username
      `,
      [
        DEVELOPMENT_USERNAME,
        "developer-ui-no-password-login",
      ]
    );

    const account = accountResult.rows[0];

    if (!account) {
      throw new Error(
        "Developer account was not returned."
      );
    }

    await client.query(
      `
        DELETE FROM account_sessions
        WHERE account_id = $1
      `,
      [
        account.account_id,
      ]
    );

    const sessionResult = await client.query<{
      expires_at: Date;
    }>(
      `
        INSERT INTO account_sessions (
          account_id,
          session_token_hash,
          created_at,
          last_activity_at,
          expires_at,
          is_revoked,
          revoked_at
        )
        VALUES (
          $1,
          $2,
          NOW(),
          NOW(),
          NOW() + ($3 * INTERVAL '1 hour'),
          FALSE,
          NULL
        )
        RETURNING expires_at
      `,
      [
        account.account_id,
        tokenHash,
        SESSION_DURATION_HOURS,
      ]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      throw new Error(
        "Developer session was not returned."
      );
    }

    await client.query("COMMIT");

    console.log("");
    console.log("============================================================");
    console.log(" DEVELOPER UI SESSION");
    console.log("============================================================");
    console.log(`Account: ${account.username}`);
    console.log(`Account ID: ${account.account_id}`);
    console.log(`Expires: ${session.expires_at.toISOString()}`);
    console.log("");
    console.log("Bearer token:");
    console.log(token);
    console.log("");
    console.log("Token nie jest zapisywany w repozytorium.");
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

void main()
  .catch((error: unknown) => {
    console.error("Developer session creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await databasePool.end();
  });

