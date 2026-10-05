import {
  createSudojoClient as internalCreateSudojoClient,
  SudojoClient as InternalSudojoClient,
} from "./network";

// Main library exports
export { configureSolutionKey, isValidUUID, validateUUID } from "./network";
/** Fetch-based NetworkClient with bearer auth, 401 refresh-and-retry and a 403 hook, for hosts without one. */
export { createAuthenticatedFetchClient } from "./network";
export type { AuthenticatedFetchClientOptions } from "./network";
export type {
  DeletedData,
  DeleteUserRequest,
  GenerateOptions,
  SolveOptions,
  ValidateOptions,
} from "./network";

/**
 * @deprecated Use the hooks; direct client use is reserved for sudojo_client
 * internals. (Non-React consumers such as sudojo_bot import it from the
 * `@sudobility/sudojo_client/network` entry, which is not deprecated.) Still
 * exported until a later breaking release.
 */
export const SudojoClient = InternalSudojoClient;
/**
 * @deprecated Use the hooks; direct client use is reserved for sudojo_client
 * internals.
 */
// Same-name type so `SudojoClient` still works as a type annotation.
// eslint-disable-next-line no-redeclare
export type SudojoClient = InternalSudojoClient;

/**
 * @deprecated Use the hooks; direct client use is reserved for sudojo_client
 * internals. (Non-React consumers such as sudojo_bot import it from the
 * `@sudobility/sudojo_client/network` entry, which is not deprecated.) Still
 * exported until a later breaking release.
 */
export const createSudojoClient = internalCreateSudojoClient;

// Errors
export { HintAccessDeniedError } from "./errors";

// React hooks
export {
  // Query utilities
  createQueryKey,
  getServiceKeys,
  queryKeys,
  STALE_TIMES,
  // Health
  useSudojoHealth,
  useSudojoOcrExtract,
  // Levels
  useSudojoCreateLevel,
  useSudojoDeleteLevel,
  useSudojoLevel,
  useSudojoLevels,
  useSudojoUpdateLevel,
  // Techniques
  useSudojoCreateTechnique,
  useSudojoDeleteTechnique,
  useSudojoTechnique,
  useSudojoTechniqueByPath,
  useSudojoTechniques,
  useSudojoUpdateTechnique,
  // Learning
  useSudojoCreateLearning,
  useSudojoDeleteLearning,
  useSudojoLearning,
  useSudojoLearningItem,
  useSudojoUpdateLearning,
  // Boards
  useSudojoBoard,
  useSudojoBoardCounts,
  useSudojoBoardCountsByTechnique,
  useSudojoBoards,
  useSudojoCreateBoard,
  useSudojoDeleteBoard,
  useSudojoFetchBoards,
  useSudojoRandomBoard,
  useSudojoUpdateBoard,
  useSudojoUpdatePuzzleStats,
  // Examples
  useSudojoCreateExample,
  useSudojoDeleteExample,
  useSudojoExample,
  useSudojoExampleCounts,
  useSudojoExamples,
  useSudojoRandomExample,
  useSudojoUpdateExample,
  // Dailies
  useSudojoCreateDaily,
  useSudojoDailies,
  useSudojoDaily,
  useSudojoDailyByDate,
  useSudojoDeleteDaily,
  useSudojoTodayDaily,
  useSudojoUpdateDaily,
  // Challenges
  useSudojoChallenge,
  useSudojoChallenges,
  useSudojoCreateChallenge,
  useSudojoDeleteChallenge,
  useSudojoRandomChallenge,
  useSudojoUpdateChallenge,
  // Users
  useSudojoDeleteUser,
  useSudojoUser,
  useSudojoUserSubscription,
  // Practices
  useSudojoCreatePractice,
  useSudojoDeleteAllPractices,
  useSudojoDeletePractice,
  useSudojoPractice,
  useSudojoRegeneratePracticeHints,
  useSudojoPracticeCounts,
  useSudojoRandomPractice,
  // Communities
  useSudojoCommunities,
  useSudojoCommunity,
  useSudojoCreateCommunity,
  useSudojoDeleteCommunity,
  useSudojoUpdateCommunity,
  // Strategies
  useSudojoStrategies,
  useSudojoStrategy,
  useSudojoStrategyByStub,
  useSudojoCreateStrategy,
  useSudojoDeleteStrategy,
  useSudojoUpdateStrategy,
  // Gamification
  useSudojoBadgeDefinitions,
  useSudojoCreateBadge,
  useSudojoDeleteBadge,
  useSudojoGamificationStats,
  useSudojoUpdateBadge,
  useSudojoPlayFinish,
  useSudojoPlayStart,
  useSudojoPointHistory,
  // Invalidation utilities
  useSudojoInvalidation,
} from "./hooks";
export type { BoardsKeyFilters, FetchBoardsVariables, QueryKey } from "./hooks";
export type { DeleteUserVariables, OcrExtractVariables } from "./hooks";

// Solver hooks
export {
  getSolverServiceKeys,
  solverQueryKeys,
  SOLVER_STALE_TIMES,
  useSolverGenerate,
  useSolverGenerateMutation,
  useSolverSolve,
  useSolverSolveMutation,
  useSolverValidate,
  useSolverValidateMutation,
} from "./solver";
export type {
  SolverGenerateVariables,
  SolverSolveVariables,
  SolverValidateVariables,
} from "./solver";
