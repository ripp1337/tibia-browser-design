import type {
  IncomingMessage,
} from "node:http";

import {
  ApplicationError,
} from "../application/errors/application-error.js";
import type {
  AccountId,
} from "../modules/characters/domain/character.types.js";

export class AuthenticationRequiredError
  extends ApplicationError
{
  public constructor() {
    super({
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication is required.",
      statusCode: 401,
    });

    this.name = "AuthenticationRequiredError";
  }
}

export type AuthenticationContext = {
  accountId: AccountId;
};

export interface AuthenticationProvider {
  authenticate(
    request: IncomingMessage
  ): Promise<AuthenticationContext | null>;
}

export async function requireAuthentication(
  request: IncomingMessage,
  authenticationProvider: AuthenticationProvider
): Promise<AuthenticationContext> {
  const context =
    await authenticationProvider.authenticate(request);

  if (!context?.accountId.trim()) {
    throw new AuthenticationRequiredError();
  }

  return context;
}