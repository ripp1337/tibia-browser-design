import "dotenv/config";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      `Invalid DB_PORT: ${value}`
    );
  }

  return port;
}

function parseUtcHour(
  value: string
): number {
  const hour = Number(value);

  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    throw new Error(
      `Invalid DAILY_BOSS_RESET_HOUR_UTC: ${value}`
    );
  }

  return hour;
}

export const env = Object.freeze({
  database: {
    host: requireEnvironmentVariable(
      "DB_HOST"
    ),

    port: parsePort(
      requireEnvironmentVariable(
        "DB_PORT"
      )
    ),

    name: requireEnvironmentVariable(
      "DB_NAME"
    ),

    user: requireEnvironmentVariable(
      "DB_USER"
    ),

    password: requireEnvironmentVariable(
      "DB_PASSWORD"
    ),
  },

  dailyBoss: {
    resetHourUtc: parseUtcHour(
      process.env
        .DAILY_BOSS_RESET_HOUR_UTC
        ?.trim() ?? "0"
    ),
  },
});
