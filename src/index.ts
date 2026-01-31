// Main library exports
export {
  createSudojoClient,
  isValidUUID,
  SudojoClient,
  validateUUID,
} from "./network";
export type { GenerateOptions, SolveOptions, ValidateOptions } from "./network";

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
  useSudojoBoards,
  useSudojoCreateBoard,
  useSudojoDeleteBoard,
  useSudojoRandomBoard,
  useSudojoUpdateBoard,
  // Dailies
  useSudojoCreateDaily,
  useSudojoDailies,
  useSudojoDaily,
  useSudojoDailyByDate,
  useSudojoDeleteDaily,
  useSudojoRandomDaily,
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
  useSudojoUserSubscription,
  // Practices
  useSudojoCreatePractice,
  useSudojoDeleteAllPractices,
  useSudojoPracticeCounts,
  useSudojoRandomPractice,
  // Gamification
  useSudojoBadgeDefinitions,
  useSudojoGamificationStats,
  useSudojoPlayFinish,
  useSudojoPlayStart,
  useSudojoPointHistory,
} from "./hooks";
export type { QueryKey } from "./hooks";

// Solver hooks
export {
  getSolverServiceKeys,
  solverQueryKeys,
  SOLVER_STALE_TIMES,
  useSolverGenerate,
  useSolverSolve,
  useSolverValidate,
} from "./solver";
