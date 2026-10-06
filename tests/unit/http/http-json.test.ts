import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InvalidJsonBodyError,
  RequestBodyTooLargeError,
  readJsonBody,
  stringifyJson,
} from "../../../src/http/http-json.js";

function createRequest(body: string): IncomingMessage {
  return Readable.from([
    Buffer.from(body, "utf8"),
  ]) as IncomingMessage;
}

describe("stringifyJson", () => {
  it("serializes bigint values as decimal strings", () => {
    expect(
      stringifyJson({
        experience: 123456789012345n,
        nested: {
          gold: 9876543210n,
        },
      })
    ).toBe(
      '{"experience":"123456789012345","nested":{"gold":"9876543210"}}'
    );
  });

  it("preserves ordinary JSON values", () => {
    expect(
      stringifyJson({
        name: "Hero",
        level: 1,
        active: true,
        optional: null,
      })
    ).toBe(
      '{"name":"Hero","level":1,"active":true,"optional":null}'
    );
  });
});

describe("readJsonBody", () => {
  it("parses a valid JSON object", async () => {
    const request = createRequest(
      '{"name":"Hero","seasonId":null}'
    );

    await expect(
      readJsonBody(request)
    ).resolves.toEqual({
      name: "Hero",
      seasonId: null,
    });
  });

  it("rejects malformed JSON", async () => {
    const request = createRequest('{"name":');

    await expect(
      readJsonBody(request)
    ).rejects.toBeInstanceOf(
      InvalidJsonBodyError
    );
  });

  it("rejects an empty body", async () => {
    const request = createRequest("");

    await expect(
      readJsonBody(request)
    ).rejects.toBeInstanceOf(
      InvalidJsonBodyError
    );
  });

  it("rejects a body exceeding the configured limit", async () => {
    const request = createRequest(
      '{"name":"Very Long Hero"}'
    );

    await expect(
      readJsonBody(request, 8)
    ).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });
});