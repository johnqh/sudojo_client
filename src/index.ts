// Main library exports
export {
  createSudojoClient,
  isValidUUID,
  SudojoClient,
  validateUUID,
} from "./network";
export type { GenerateOptions, SolveOptions, ValidateOptions } from "./network";

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
} from "./hooks";
export type { QueryKey } from "./hooks";

// Re-export types from @sudobility/sudojo_types for convenience
export type {
  BaseResponse,
  Board,
  BoardCreateRequest,
  BoardQueryParams,
  BoardUpdateRequest,
  Challenge,
  ChallengeCreateRequest,
  ChallengeQueryParams,
  ChallengeUpdateRequest,
  Daily,
  DailyCreateRequest,
  DailyUpdateRequest,
  GenerateData,
  HealthCheckData,
  Learning,
  LearningCreateRequest,
  LearningQueryParams,
  LearningUpdateRequest,
  Level,
  LevelCreateRequest,
  LevelUpdateRequest,
  Optional,
  PaginatedResponse,
  PaginationInfo,
  PaginationOptions,
  RevenueCatEntitlement,
  SolveData,
  SolverAreaType,
  SolverBoard,
  SolverCellActions,
  SolverColor,
  SolverHintArea,
  SolverHintCell,
  SolverHintStep,
  SolverPencilmarks,
  SubscriptionResult,
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
  ValidateData,
} from "@sudobility/sudojo_types";

// Solver hooks
export {
  getSolverServiceKeys,
  solverQueryKeys,
  SOLVER_STALE_TIMES,
  useSolverGenerate,
  useSolverSolve,
  useSolverValidate,
} from "./solver";
