import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InvalidCombatHttpRequestError,
  parseCombatActionHttpRequest,
  parseCombatCharacterId,
  parseCombatSessionId,
  parseStartCombatHttpRequest,
} from "../../../src/modules/combat/http/combat-http.request.js";

describe("combat HTTP request parsing", () => {
  it("parses combat path identifiers", () => {
    expect(
      parseCombatCharacterId("character-1")
    ).toBe("character-1");

    expect(
      parseCombatSessionId("session-1")
    ).toBe("session-1");
  });

  it("rejects missing path identifiers", () => {
    expect(() =>
      parseCombatCharacterId("")
    ).toThrow(
      InvalidCombatHttpRequestError
    );

    expect(() =>
      parseCombatSessionId("   ")
    ).toThrow(
      InvalidCombatHttpRequestError
    );
  });

  it("parses a combat-start request", () => {
    expect(
      parseStartCombatHttpRequest({
        monsterCode: "dev_monster_01",
      })
    ).toEqual({
      monsterCode: "dev_monster_01",
    });
  });

  it("rejects an invalid combat-start request", () => {
    expect(() =>
      parseStartCombatHttpRequest({})
    ).toThrow(
      InvalidCombatHttpRequestError
    );

    expect(() =>
      parseStartCombatHttpRequest({
        monsterCode: "   ",
      })
    ).toThrow(
      InvalidCombatHttpRequestError
    );
  });

  it("parses a basic combat action", () => {
    expect(
      parseCombatActionHttpRequest({
        expectedTurn: 4,
        action: {
          type: "basic_attack",
        },
      })
    ).toEqual({
      expectedTurn: 4,
      action: {
        type: "basic_attack",
      },
    });
  });

  it("rejects invalid expected turns", () => {
    for (const expectedTurn of [
      0,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
      "1",
    ]) {
      expect(() =>
        parseCombatActionHttpRequest({
          expectedTurn,
          action: {
            type: "basic_attack",
          },
        })
      ).toThrow(
        InvalidCombatHttpRequestError
      );
    }
  });

  it("rejects unsupported or extended actions", () => {
    expect(() =>
      parseCombatActionHttpRequest({
        expectedTurn: 1,
        action: {
          type: "spell",
        },
      })
    ).toThrow(
      InvalidCombatHttpRequestError
    );

    expect(() =>
      parseCombatActionHttpRequest({
        expectedTurn: 1,
        action: {
          type: "basic_attack",
          damage: 999,
        },
      })
    ).toThrow(
      InvalidCombatHttpRequestError
    );
  });

  it("rejects non-object request bodies", () => {
    expect(() =>
      parseStartCombatHttpRequest(null)
    ).toThrow(
      InvalidCombatHttpRequestError
    );

    expect(() =>
      parseCombatActionHttpRequest([])
    ).toThrow(
      InvalidCombatHttpRequestError
    );
  });
});
