/**
 * Error thrown when hint access is denied due to subscription tier
 */

import type {
  HintAccessDeniedError as HintAccessDeniedErrorData,
  HintAccessUserState,
  HintEntitlement,
} from "@sudobility/sudojo_types";

export class HintAccessDeniedError extends Error {
  readonly code = "HINT_ACCESS_DENIED" as const;
  readonly hintLevel: number;
  readonly requiredEntitlement: HintEntitlement;
  readonly userState: HintAccessUserState;

  constructor(data: HintAccessDeniedErrorData) {
    super(data.message);
    this.name = "HintAccessDeniedError";
    this.hintLevel = data.hintLevel;
    this.requiredEntitlement = data.requiredEntitlement;
    this.userState = data.userState;
  }

  /**
   * Check if an error is a HintAccessDeniedError
   */
  static isHintAccessDeniedError(
    error: unknown,
  ): error is HintAccessDeniedError {
    return error instanceof HintAccessDeniedError;
  }
}
