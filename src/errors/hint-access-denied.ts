/**
 * Custom error for hint access denial due to subscription tier restrictions.
 *
 * ## When This Error Is Thrown
 *
 * The Sudojo solver API returns HTTP 402 (Payment Required) when a user
 * requests hints that require a higher subscription tier than they have.
 * The `SudojoClient.solverSolve()` method catches this response and throws
 * a `HintAccessDeniedError` with structured data about the denial.
 *
 * ## Error Properties
 *
 * - `code` - Always `"HINT_ACCESS_DENIED"` for programmatic identification
 * - `hintLevel` - The numeric hint level that was requested
 * - `requiredEntitlement` - The subscription tier needed to access this hint
 * - `userState` - The user's current subscription state
 *
 * ## Handling This Error
 *
 * ```typescript
 * try {
 *   const hints = await client.solverSolve(token, options);
 * } catch (error) {
 *   if (HintAccessDeniedError.isHintAccessDeniedError(error)) {
 *     // Show paywall or upgrade prompt
 *     showUpgradeDialog(error.requiredEntitlement);
 *   }
 * }
 * ```
 *
 * @module
 */

import type {
  HintAccessDeniedError as HintAccessDeniedErrorData,
  HintAccessUserState,
  HintEntitlement,
} from "@sudobility/sudojo_types";

/**
 * Error thrown when hint access is denied due to the user's subscription tier.
 *
 * This is the only custom error class in the library. All other API errors
 * (network failures, 401/403, 500s, validation errors) are thrown as generic
 * `Error` instances with descriptive messages.
 */
export class HintAccessDeniedError extends Error {
  /** Constant error code for programmatic identification. */
  readonly code = "HINT_ACCESS_DENIED" as const;

  /** The hint level that was requested but denied. */
  readonly hintLevel: number;

  /** The subscription tier required to access the requested hint level. */
  readonly requiredEntitlement: HintEntitlement;

  /** The user's current subscription state at the time of the request. */
  readonly userState: HintAccessUserState;

  /**
   * Create a HintAccessDeniedError from the API error response data.
   *
   * @param data - The structured error data from the API's 402 response
   */
  constructor(data: HintAccessDeniedErrorData) {
    super(data.message);
    this.name = "HintAccessDeniedError";
    this.hintLevel = data.hintLevel;
    this.requiredEntitlement = data.requiredEntitlement;
    this.userState = data.userState;
  }

  /**
   * Type guard to check if an unknown error is a HintAccessDeniedError.
   *
   * Prefer this over `instanceof` checks when the error may come from
   * a different module bundling context.
   *
   * @param error - The error to check
   * @returns True if the error is a HintAccessDeniedError
   */
  static isHintAccessDeniedError(
    error: unknown,
  ): error is HintAccessDeniedError {
    return error instanceof HintAccessDeniedError;
  }
}
