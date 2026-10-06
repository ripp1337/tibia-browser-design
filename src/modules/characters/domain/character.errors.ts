import { ApplicationError } from "../../../application/errors/application-error.js";

export const CHARACTER_ERROR_CODE = {
  invalidName: "CHARACTER_NAME_INVALID",
  nameTaken: "CHARACTER_NAME_TAKEN",
  limitReached: "CHARACTER_LIMIT_REACHED",
  notFound: "CHARACTER_NOT_FOUND",
  accessDenied: "CHARACTER_ACCESS_DENIED",
  alreadyArchived: "CHARACTER_ALREADY_ARCHIVED",
  invalidResourceState: "CHARACTER_RESOURCE_STATE_INVALID",
  inventoryItemNotFound: "INVENTORY_ITEM_NOT_FOUND",
  equipmentLevelRequired: "EQUIPMENT_LEVEL_REQUIRED",
  equipmentAlreadyEquipped: "EQUIPMENT_ALREADY_EQUIPPED",
  equipmentNotEquipped: "EQUIPMENT_NOT_EQUIPPED",
} as const;

export type CharacterErrorCode =
  (typeof CHARACTER_ERROR_CODE)[keyof typeof CHARACTER_ERROR_CODE];

export class CharacterNameInvalidError extends ApplicationError {
  public constructor(reason: string) {
    super({
      code: CHARACTER_ERROR_CODE.invalidName,
      message: "Character name is invalid.",
      statusCode: 400,
      details: {
        reason,
      },
    });

    this.name = "CharacterNameInvalidError";
  }
}

export class CharacterNameTakenError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.nameTaken,
      message: "Character name is already taken.",
      statusCode: 409,
    });

    this.name = "CharacterNameTakenError";
  }
}

export class CharacterLimitReachedError extends ApplicationError {
  public constructor(maximumActiveCharacters: number) {
    super({
      code: CHARACTER_ERROR_CODE.limitReached,
      message: "Active character limit has been reached.",
      statusCode: 409,
      details: {
        maximumActiveCharacters,
      },
    });

    this.name = "CharacterLimitReachedError";
  }
}

export class CharacterNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.notFound,
      message: "Character was not found.",
      statusCode: 404,
    });

    this.name = "CharacterNotFoundError";
  }
}

export class CharacterAccessDeniedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.accessDenied,
      message: "Character access was denied.",
      statusCode: 403,
    });

    this.name = "CharacterAccessDeniedError";
  }
}

export class CharacterAlreadyArchivedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.alreadyArchived,
      message: "Character is already archived.",
      statusCode: 409,
    });

    this.name = "CharacterAlreadyArchivedError";
  }
}

export class CharacterResourceStateInvalidError extends ApplicationError {
  public constructor(reason: string) {
    super({
      code: CHARACTER_ERROR_CODE.invalidResourceState,
      message: "Character resource state is invalid.",
      statusCode: 500,
      details: {
        reason,
      },
    });

    this.name = "CharacterResourceStateInvalidError";
  }
}
export class InventoryItemNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.inventoryItemNotFound,
      message: "Inventory item was not found.",
      statusCode: 404,
    });

    this.name = "InventoryItemNotFoundError";
  }
}

export class EquipmentLevelRequiredError extends ApplicationError {
  public constructor(
    requiredLevel: number,
    characterLevel: number
  ) {
    super({
      code: CHARACTER_ERROR_CODE.equipmentLevelRequired,
      message: "Character level is too low to equip this item.",
      statusCode: 409,
      details: {
        requiredLevel,
        characterLevel,
      },
    });

    this.name = "EquipmentLevelRequiredError";
  }
}

export class EquipmentAlreadyEquippedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.equipmentAlreadyEquipped,
      message: "Inventory item is already equipped.",
      statusCode: 409,
    });

    this.name = "EquipmentAlreadyEquippedError";
  }
}

export class EquipmentNotEquippedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.equipmentNotEquipped,
      message: "Inventory item is not equipped.",
      statusCode: 409,
    });

    this.name = "EquipmentNotEquippedError";
  }
}
