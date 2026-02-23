import { describe, expect, it } from "vitest";
import { getSolverServiceKeys, solverQueryKeys } from "../query-keys";

describe("solverQueryKeys", () => {
  describe("all", () => {
    it("should return the root solver key", () => {
      expect(solverQueryKeys.all()).toEqual(["sudojo", "solver"]);
    });
  });

  describe("solve", () => {
    it("should return solve key with basic options", () => {
      const key = solverQueryKeys.solve({
        original: "0".repeat(81),
        user: "1".repeat(81),
      });

      expect(key[0]).toBe("sudojo");
      expect(key[1]).toBe("solver");
      expect(key[2]).toBe("solve");
      expect(key[3]).toEqual({
        original: "0".repeat(81),
        user: "1".repeat(81),
      });
    });

    it("should include optional parameters in the key", () => {
      const key = solverQueryKeys.solve({
        original: "0".repeat(81),
        user: "1".repeat(81),
        autoPencilmarks: true,
        pencilmarks: "1,2,3",
        filters: "hidden_singles",
      });

      const options = key[3] as Record<string, unknown>;
      expect(options["autoPencilmarks"]).toBe(true);
      expect(options["pencilmarks"]).toBe("1,2,3");
      expect(options["filters"]).toBe("hidden_singles");
    });

    it("should produce different keys for different puzzle states", () => {
      const key1 = solverQueryKeys.solve({
        original: "0".repeat(81),
        user: "1".repeat(81),
      });

      const key2 = solverQueryKeys.solve({
        original: "0".repeat(81),
        user: "2".repeat(81),
      });

      // Keys should be structurally different
      expect(key1).not.toEqual(key2);
    });
  });

  describe("validate", () => {
    it("should return validate key with puzzle string", () => {
      const puzzle = "0".repeat(81);
      const key = solverQueryKeys.validate(puzzle);

      expect(key).toEqual(["sudojo", "solver", "validate", puzzle]);
    });

    it("should produce different keys for different puzzles", () => {
      const key1 = solverQueryKeys.validate("0".repeat(81));
      const key2 = solverQueryKeys.validate("1".repeat(81));

      expect(key1).not.toEqual(key2);
    });
  });

  describe("generate", () => {
    it("should return generate key without options", () => {
      const key = solverQueryKeys.generate();

      expect(key).toEqual(["sudojo", "solver", "generate", undefined]);
    });

    it("should return generate key with symmetrical option", () => {
      const key = solverQueryKeys.generate({ symmetrical: true });

      expect(key).toEqual([
        "sudojo",
        "solver",
        "generate",
        { symmetrical: true },
      ]);
    });

    it("should return generate key with symmetrical false", () => {
      const key = solverQueryKeys.generate({ symmetrical: false });

      expect(key).toEqual([
        "sudojo",
        "solver",
        "generate",
        { symmetrical: false },
      ]);
    });
  });
});

describe("getSolverServiceKeys", () => {
  it("should return the root solver key", () => {
    expect(getSolverServiceKeys()).toEqual(["sudojo", "solver"]);
  });

  it("should match solverQueryKeys.all()", () => {
    expect(getSolverServiceKeys()).toEqual(solverQueryKeys.all());
  });
});
