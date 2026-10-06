export type ApplicationErrorOptions = {
  code: string;
  message: string;
  statusCode?: number;
  details?: Readonly<Record<string, unknown>>;
  cause?: unknown;
};

export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(options: ApplicationErrorOptions) {
    super(options.message, { cause: options.cause });

    this.name = "ApplicationError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isApplicationError(
  error: unknown
): error is ApplicationError {
  return error instanceof ApplicationError;
}