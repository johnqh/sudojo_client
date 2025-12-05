// Main library exports
export {
  createSudojoClient,
  isValidUUID,
  SudojoClient,
  validateUUID,
} from "./network";
export type { SudojoAuth, SudojoConfig } from "./network";

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
