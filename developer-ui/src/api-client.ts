export type DiagnosticEntry = {
  timestamp: string;
  method: string;
  path: string;
  requestBody: unknown;
  status: number | null;
  durationMs: number;
  responseBody: unknown;
};

export type ApiResult<T> = {
  data: T;
  diagnostic: DiagnosticEntry;
};

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly diagnostic: DiagnosticEntry
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  public constructor(
    private readonly token: string
  ) {}

  public async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResult<T>> {
    const startedAt = performance.now();
    const timestamp = new Date().toISOString();
    let status: number | null = null;
    let responseBody: unknown = null;

    try {
      const response = await fetch(`/api${path}`, {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          ...(body === undefined
            ? {}
            : { "content-type": "application/json" }),
        },
        body: body === undefined
          ? undefined
          : JSON.stringify(body),
      });

      status = response.status;
      const text = await response.text();
      responseBody = text ? JSON.parse(text) : null;

      const diagnostic: DiagnosticEntry = {
        timestamp,
        method,
        path,
        requestBody: body ?? null,
        status,
        durationMs: Math.round(performance.now() - startedAt),
        responseBody,
      };

      if (!response.ok) {
        const serverMessage = getServerErrorMessage(responseBody);
        throw new ApiError(
          serverMessage ?? `HTTP ${response.status}`,
          diagnostic
        );
      }

      if (!isRecord(responseBody) || !("data" in responseBody)) {
        throw new ApiError(
          "Odpowiedz nie zawiera pola data.",
          diagnostic
        );
      }

      return {
        data: responseBody.data as T,
        diagnostic,
      };
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      const diagnostic: DiagnosticEntry = {
        timestamp,
        method,
        path,
        requestBody: body ?? null,
        status,
        durationMs: Math.round(performance.now() - startedAt),
        responseBody,
      };

      throw new ApiError(
        error instanceof Error
          ? error.message
          : "Nieznany blad polaczenia.",
        diagnostic
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getServerErrorMessage(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.error)) {
    return null;
  }

  return typeof value.error.message === "string"
    ? value.error.message
    : null;
}
