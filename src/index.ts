// Main library exports
export {
  createSudojoClient,
  isValidUUID,
  SudojoClient,
  validateUUID,
} from "./network";
export type { SudojoAuth, SudojoConfig } from "./network";

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
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
} from "@sudobility/sudojo_types";
