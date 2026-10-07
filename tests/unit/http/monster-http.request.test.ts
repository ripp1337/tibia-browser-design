import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InvalidMonsterHttpRequestError,
  parseMonsterCharacterId,
  parseMonsterCode,
} from "../../../src/modules/monsters/http/monster-http.request.js";

describe("monster HTTP request parsing", () => {
  it("parses characterId", () => {
    expect(
      parseMonsterCharacterId(
        "character-1"
      )
    ).toBe("character-1");
  });

  it("parses monsterCode", () => {
    expect(
      parseMonsterCode(
        "dev_monster_01"
      )
    ).toBe("dev_monster_01");
  });

  it("rejects missing characterId", () => {
    expect(() =>
      parseMonsterCharacterId("")
    ).toThrow(
      InvalidMonsterHttpRequestError
    );
  });

  it("rejects missing monsterCode", () => {
    expect(() =>
      parseMonsterCode("   ")
    ).toThrow(
      InvalidMonsterHttpRequestError
    );
  });
});
