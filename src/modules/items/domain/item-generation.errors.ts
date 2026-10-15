export const ITEM_GENERATION_ERROR_CODE = {
  invalidConfiguration: "ITEM_GENERATION_INVALID_CONFIGURATION",
  invalidRandomSource: "ITEM_GENERATION_INVALID_RANDOM_SOURCE",
  itemScoreOverflow: "ITEM_SCORE_OVERFLOW",
} as const;

export class ItemGenerationConfigurationError extends Error {
  public readonly code =
    ITEM_GENERATION_ERROR_CODE.invalidConfiguration;

  public constructor(message: string) {
    super(message);
    this.name = "ItemGenerationConfigurationError";
  }
}

export class ItemGenerationRandomSourceError extends Error {
  public readonly code =
    ITEM_GENERATION_ERROR_CODE.invalidRandomSource;

  public constructor(message: string) {
    super(message);
    this.name = "ItemGenerationRandomSourceError";
  }
}

export class ItemScoreOverflowError extends Error {
  public readonly code =
    ITEM_GENERATION_ERROR_CODE.itemScoreOverflow;

  public constructor() {
    super("Item Score exceeds the PostgreSQL BIGINT maximum.");
    this.name = "ItemScoreOverflowError";
  }
}
