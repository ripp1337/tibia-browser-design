import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

const DEFAULT_MAXIMUM_BODY_BYTES = 16_384;

export class InvalidJsonBodyError extends Error {
  public constructor(
    message = "Request body must contain valid JSON."
  ) {
    super(message);
    this.name = "InvalidJsonBodyError";
  }
}

export class RequestBodyTooLargeError extends Error {
  public constructor(
    public readonly maximumBodyBytes: number
  ) {
    super(
      `Request body cannot exceed ${maximumBodyBytes} bytes.`
    );

    this.name = "RequestBodyTooLargeError";
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, nestedValue: unknown) => {
      if (typeof nestedValue === "bigint") {
        return nestedValue.toString();
      }

      return nestedValue;
    }
  );
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown
): void {
  const serializedBody = stringifyJson(body);

  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(
      serializedBody,
      "utf8"
    ),
  });

  response.end(serializedBody);
}

export async function readJsonBody(
  request: IncomingMessage,
  maximumBodyBytes = DEFAULT_MAXIMUM_BODY_BYTES
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk);

    receivedBytes += buffer.length;

    if (receivedBytes > maximumBodyBytes) {
      throw new RequestBodyTooLargeError(
        maximumBodyBytes
      );
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    throw new InvalidJsonBodyError(
      "Request body is required."
    );
  }

  const body = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}