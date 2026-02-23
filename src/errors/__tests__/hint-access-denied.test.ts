import { describe, expect, it } from "vitest";
import { HintAccessDeniedError } from "../hint-access-denied";

describe("HintAccessDeniedError", () => {
  const mockErrorData = {
    code: "HINT_ACCESS_DENIED" as const,
    message: "Hint level 3 requires premium subscription",
    hintLevel: 3,
    requiredEntitlement: {
      identifier: "premium",
      description: "Premium subscription",
    },
    userState: {
      hasSubscription: false,
      currentTier: "free",
      hintsRemaining: 0,
    },
  };

  it("should create an error with correct properties", () => {
    const error = new HintAccessDeniedError(mockErrorData);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HintAccessDeniedError);
    expect(error.name).toBe("HintAccessDeniedError");
    expect(error.code).toBe("HINT_ACCESS_DENIED");
    expect(error.message).toBe("Hint level 3 requires premium subscription");
    expect(error.hintLevel).toBe(3);
    expect(error.requiredEntitlement).toEqual(
      mockErrorData.requiredEntitlement,
    );
    expect(error.userState).toEqual(mockErrorData.userState);
  });

  it("should have readonly code property", () => {
    const error = new HintAccessDeniedError(mockErrorData);

    // The code should always be "HINT_ACCESS_DENIED"
    expect(error.code).toBe("HINT_ACCESS_DENIED");
  });

  it("should have a stack trace", () => {
    const error = new HintAccessDeniedError(mockErrorData);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("HintAccessDeniedError");
  });

  describe("isHintAccessDeniedError", () => {
    it("should return true for HintAccessDeniedError instances", () => {
      const error = new HintAccessDeniedError(mockErrorData);

      expect(HintAccessDeniedError.isHintAccessDeniedError(error)).toBe(true);
    });

    it("should return false for generic Error instances", () => {
      const error = new Error("some error");

      expect(HintAccessDeniedError.isHintAccessDeniedError(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(HintAccessDeniedError.isHintAccessDeniedError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(HintAccessDeniedError.isHintAccessDeniedError(undefined)).toBe(
        false,
      );
    });

    it("should return false for plain objects", () => {
      const fakeError = {
        code: "HINT_ACCESS_DENIED",
        message: "fake",
        hintLevel: 1,
      };

      expect(HintAccessDeniedError.isHintAccessDeniedError(fakeError)).toBe(
        false,
      );
    });

    it("should return false for strings", () => {
      expect(
        HintAccessDeniedError.isHintAccessDeniedError(
          "HINT_ACCESS_DENIED",
        ),
      ).toBe(false);
    });

    it("should return false for numbers", () => {
      expect(HintAccessDeniedError.isHintAccessDeniedError(42)).toBe(false);
    });
  });

  it("should preserve error data across different hint levels", () => {
    const level1Error = new HintAccessDeniedError({
      ...mockErrorData,
      hintLevel: 1,
      message: "Hint level 1 denied",
    });

    const level5Error = new HintAccessDeniedError({
      ...mockErrorData,
      hintLevel: 5,
      message: "Hint level 5 denied",
    });

    expect(level1Error.hintLevel).toBe(1);
    expect(level1Error.message).toBe("Hint level 1 denied");
    expect(level5Error.hintLevel).toBe(5);
    expect(level5Error.message).toBe("Hint level 5 denied");
  });
});
