import "dotenv/config";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid DB_PORT: ${value}`);
  }

  return port;
}

export const env = Object.freeze({
  database: {
    host: requireEnvironmentVariable("DB_HOST"),
    port: parsePort(requireEnvironmentVariable("DB_PORT")),
    name: requireEnvironmentVariable("DB_NAME"),
    user: requireEnvironmentVariable("DB_USER"),
    password: requireEnvironmentVariable("DB_PASSWORD")
  }
});
