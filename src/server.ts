import { databasePool } from "./database/pool.js";
import { createApplicationServer } from "./app.js";

function parseServerPort(value: string | undefined): number {
  if (!value) {
    return 3000;
  }

  const port = Number.parseInt(value, 10);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(`Invalid PORT: ${value}`);
  }

  return port;
}

const host = process.env.HOST?.trim() || "0.0.0.0";
const port = parseServerPort(process.env.PORT);

const server = createApplicationServer();

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`Received ${signal}. Shutting down.`);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await databasePool.end();

  console.log("Server shutdown completed.");
}

server.on("error", (error) => {
  console.error("HTTP server error:", error);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(
    `HTTP server listening on http://${host}:${port}`
  );
});

process.once("SIGINT", () => {
  void shutdown("SIGINT").catch((error: unknown) => {
    console.error("Shutdown failed:", error);
    process.exitCode = 1;
  });
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM").catch((error: unknown) => {
    console.error("Shutdown failed:", error);
    process.exitCode = 1;
  });
});