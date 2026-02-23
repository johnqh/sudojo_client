import { describe, expect, it } from "vitest";
import { createQueryKey, getServiceKeys, queryKeys } from "../query-keys";

describe("queryKeys", () => {
  describe("sudojo.all", () => {
    it("should return the root key", () => {
      expect(queryKeys.sudojo.all()).toEqual(["sudojo"]);
    });
  });

  describe("health", () => {
    it("should return the health key", () => {
      expect(queryKeys.sudojo.health()).toEqual(["sudojo", "health"]);
    });
  });

  describe("levels", () => {
    it("should return the levels list key", () => {
      expect(queryKeys.sudojo.levels()).toEqual(["sudojo", "levels"]);
    });

    it("should return a specific level key", () => {
      expect(queryKeys.sudojo.level(1)).toEqual(["sudojo", "levels", 1]);
      expect(queryKeys.sudojo.level(12)).toEqual(["sudojo", "levels", 12]);
    });
  });

  describe("techniques", () => {
    it("should return techniques key without filters", () => {
      expect(queryKeys.sudojo.techniques()).toEqual([
        "sudojo",
        "techniques",
        undefined,
      ]);
    });

    it("should return techniques key with level filter", () => {
      expect(queryKeys.sudojo.techniques({ level: 3 })).toEqual([
        "sudojo",
        "techniques",
        { level: 3 },
      ]);
    });

    it("should return a specific technique key", () => {
      expect(queryKeys.sudojo.technique(1)).toEqual([
        "sudojo",
        "techniques",
        1,
      ]);
    });
  });

  describe("learning", () => {
    it("should return learning key without filters", () => {
      expect(queryKeys.sudojo.learning()).toEqual([
        "sudojo",
        "learning",
        undefined,
      ]);
    });

    it("should return learning key with technique filter", () => {
      expect(queryKeys.sudojo.learning({ technique: 5 })).toEqual([
        "sudojo",
        "learning",
        { technique: 5 },
      ]);
    });

    it("should return learning key with both filters", () => {
      expect(
        queryKeys.sudojo.learning({ technique: 5, language_code: "en" }),
      ).toEqual(["sudojo", "learning", { technique: 5, language_code: "en" }]);
    });

    it("should return a specific learning item key", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      expect(queryKeys.sudojo.learningItem(uuid)).toEqual([
        "sudojo",
        "learning",
        uuid,
      ]);
    });
  });

  describe("boards", () => {
    it("should return boards key without filters", () => {
      expect(queryKeys.sudojo.boards()).toEqual([
        "sudojo",
        "boards",
        undefined,
      ]);
    });

    it("should return boards key with level filter", () => {
      expect(queryKeys.sudojo.boards({ level: 3 })).toEqual([
        "sudojo",
        "boards",
        { level: 3 },
      ]);
    });

    it("should return board random key", () => {
      expect(queryKeys.sudojo.boardRandom({ level: 1 })).toEqual([
        "sudojo",
        "boards",
        "random",
        { level: 1 },
      ]);
    });

    it("should return a specific board key", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      expect(queryKeys.sudojo.board(uuid)).toEqual([
        "sudojo",
        "boards",
        uuid,
      ]);
    });
  });

  describe("dailies", () => {
    it("should return dailies list key", () => {
      expect(queryKeys.sudojo.dailies()).toEqual(["sudojo", "dailies"]);
    });

    it("should return daily random key", () => {
      expect(queryKeys.sudojo.dailyRandom()).toEqual([
        "sudojo",
        "dailies",
        "random",
      ]);
    });

    it("should return daily today key", () => {
      expect(queryKeys.sudojo.dailyToday()).toEqual([
        "sudojo",
        "dailies",
        "today",
      ]);
    });

    it("should return daily by date key", () => {
      expect(queryKeys.sudojo.dailyByDate("2025-01-15")).toEqual([
        "sudojo",
        "dailies",
        "date",
        "2025-01-15",
      ]);
    });

    it("should return a specific daily key", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      expect(queryKeys.sudojo.daily(uuid)).toEqual([
        "sudojo",
        "dailies",
        uuid,
      ]);
    });
  });

  describe("challenges", () => {
    it("should return challenges key without filters", () => {
      expect(queryKeys.sudojo.challenges()).toEqual([
        "sudojo",
        "challenges",
        undefined,
      ]);
    });

    it("should return challenges key with filters", () => {
      expect(
        queryKeys.sudojo.challenges({ level: 1, difficulty: "hard" }),
      ).toEqual([
        "sudojo",
        "challenges",
        { level: 1, difficulty: "hard" },
      ]);
    });

    it("should return challenge random key", () => {
      expect(queryKeys.sudojo.challengeRandom({ level: 2 })).toEqual([
        "sudojo",
        "challenges",
        "random",
        { level: 2 },
      ]);
    });

    it("should return a specific challenge key", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      expect(queryKeys.sudojo.challenge(uuid)).toEqual([
        "sudojo",
        "challenges",
        uuid,
      ]);
    });
  });

  describe("users", () => {
    it("should return a user key", () => {
      expect(queryKeys.sudojo.user("user-123")).toEqual([
        "sudojo",
        "users",
        "user-123",
      ]);
    });

    it("should return a user subscription key", () => {
      expect(queryKeys.sudojo.userSubscription("user-123")).toEqual([
        "sudojo",
        "users",
        "user-123",
        "subscription",
      ]);
    });
  });

  describe("practices", () => {
    it("should return practice counts key", () => {
      expect(queryKeys.sudojo.practiceCounts()).toEqual([
        "sudojo",
        "practices",
        "counts",
      ]);
    });

    it("should return practice random key", () => {
      expect(queryKeys.sudojo.practiceRandom(5)).toEqual([
        "sudojo",
        "practices",
        "random",
        5,
      ]);
    });
  });

  describe("gamification", () => {
    it("should return gamification stats key", () => {
      expect(queryKeys.sudojo.gamificationStats()).toEqual([
        "sudojo",
        "gamification",
        "stats",
      ]);
    });

    it("should return gamification badges key", () => {
      expect(queryKeys.sudojo.gamificationBadges()).toEqual([
        "sudojo",
        "gamification",
        "badges",
      ]);
    });

    it("should return gamification history key without options", () => {
      expect(queryKeys.sudojo.gamificationHistory()).toEqual([
        "sudojo",
        "gamification",
        "history",
        undefined,
      ]);
    });

    it("should return gamification history key with pagination", () => {
      expect(
        queryKeys.sudojo.gamificationHistory({ limit: 10, offset: 20 }),
      ).toEqual([
        "sudojo",
        "gamification",
        "history",
        { limit: 10, offset: 20 },
      ]);
    });
  });
});

describe("createQueryKey", () => {
  it("should create a key with service name only", () => {
    expect(createQueryKey("custom")).toEqual(["custom"]);
  });

  it("should create a key with string parts", () => {
    expect(createQueryKey("custom", "endpoint", "sub")).toEqual([
      "custom",
      "endpoint",
      "sub",
    ]);
  });

  it("should create a key with mixed types", () => {
    expect(createQueryKey("custom", "endpoint", 42, { filter: "value" })).toEqual([
      "custom",
      "endpoint",
      42,
      { filter: "value" },
    ]);
  });
});

describe("getServiceKeys", () => {
  it("should return the root sudojo key", () => {
    expect(getServiceKeys()).toEqual(["sudojo"]);
  });

  it("should match the queryKeys.sudojo.all() output", () => {
    expect(getServiceKeys()).toEqual(queryKeys.sudojo.all());
  });
});
