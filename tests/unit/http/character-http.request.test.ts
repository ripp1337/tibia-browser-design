import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InvalidHttpRequestError,
  parseCharacterId,
  parseCreateCharacterHttpRequest,
} from "../../../src/modules/characters/http/character-http.request.js";

describe("parseCreateCharacterHttpRequest", () => {
  it("parses name and season identifier", () => {
    expect(
      parseCreateCharacterHttpRequest({
        name: "Hero",
        seasonId: "season-1",
      })
    ).toEqual({
      name: "Hero",
      seasonId: "season-1",
    });
  });

  it("defaults a missing season identifier to null", () => {
    expect(
      parseCreateCharacterHttpRequest({
        name: "Hero",
      })
    ).toEqual({
      name: "Hero",
      seasonId: null,
    });
  });

  it("preserves name as unknown for domain validation", () => {
    expect(
      parseCreateCharacterHttpRequest({
        name: 123,
      })
    ).toEqual({
      name: 123,
      seasonId: null,
    });
  });

  it.each([
    null,
    [],
    "body",
    123,
  ])("rejects a non-object body", (body) => {
    expect(() =>
      parseCreateCharacterHttpRequest(body)
    ).toThrow(InvalidHttpRequestError);
  });

  it("rejects a missing name", () => {
    expect(() =>
      parseCreateCharacterHttpRequest({})
    ).toThrow(InvalidHttpRequestError);
  });

  it.each([
    123,
    true,
    {},
    [],
  ])("rejects invalid seasonId: %o", (seasonId) => {
    expect(() =>
      parseCreateCharacterHttpRequest({
        name: "Hero",
        seasonId,
      })
    ).toThrow(InvalidHttpRequestError);
  });

  it("rejects an empty season identifier", () => {
    expect(() =>
      parseCreateCharacterHttpRequest({
        name: "Hero",
        seasonId: "   ",
      })
    ).toThrow(InvalidHttpRequestError);
  });
});

describe("parseCharacterId", () => {
  it("returns a non-empty character identifier", () => {
    expect(
      parseCharacterId("character-1")
    ).toBe("character-1");
  });

  it.each([
    undefined,
    "",
    "   ",
  ])("rejects missing characterId: %o", (value) => {
    expect(() =>
      parseCharacterId(value)
    ).toThrow(InvalidHttpRequestError);
  });
});