import type {
  IncomingMessage,
} from "node:http";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AuthenticationRequiredError,
  requireAuthentication,
  type AuthenticationProvider,
} from "../../../src/http/http-auth.js";

function createRequest(): IncomingMessage {
  return {} as IncomingMessage;
}

describe("requireAuthentication", () => {
  it("returns an authenticated account context", async () => {
    const request = createRequest();

    const provider: AuthenticationProvider = {
      authenticate: vi.fn().mockResolvedValue({
        accountId: "account-1",
      }),
    };

    await expect(
      requireAuthentication(request, provider)
    ).resolves.toEqual({
      accountId: "account-1",
    });

    expect(provider.authenticate).toHaveBeenCalledOnce();
    expect(provider.authenticate).toHaveBeenCalledWith(
      request
    );
  });

  it("rejects a missing authentication context", async () => {
    const provider: AuthenticationProvider = {
      authenticate: vi.fn().mockResolvedValue(null),
    };

    await expect(
      requireAuthentication(
        createRequest(),
        provider
      )
    ).rejects.toBeInstanceOf(
      AuthenticationRequiredError
    );
  });

  it("rejects an empty account identifier", async () => {
    const provider: AuthenticationProvider = {
      authenticate: vi.fn().mockResolvedValue({
        accountId: "   ",
      }),
    };

    await expect(
      requireAuthentication(
        createRequest(),
        provider
      )
    ).rejects.toBeInstanceOf(
      AuthenticationRequiredError
    );
  });

  it("propagates authentication provider errors", async () => {
    const providerError = new Error(
      "Session database failed"
    );

    const provider: AuthenticationProvider = {
      authenticate: vi.fn().mockRejectedValue(
        providerError
      ),
    };

    await expect(
      requireAuthentication(
        createRequest(),
        provider
      )
    ).rejects.toBe(providerError);
  });
});