/**
 * Sudojo API hooks for React
 */

// ============================================================================
// Query utilities
// ============================================================================

export { createQueryKey, getServiceKeys, queryKeys } from "./query-keys";
export type { BoardsKeyFilters, QueryKey } from "./query-keys";
export { STALE_TIMES } from "./query-config";

// ============================================================================
// Health hook
// ============================================================================

export { useSudojoHealth } from "./use-sudojo-health";

// ============================================================================
// OCR hook
// ============================================================================

export { useSudojoOcrExtract } from "./use-sudojo-ocr";
export type { OcrExtractVariables } from "./use-sudojo-ocr";

// ============================================================================
// Level hooks
// ============================================================================

export {
  useSudojoCreateLevel,
  useSudojoDeleteLevel,
  useSudojoLevel,
  useSudojoLevels,
  useSudojoUpdateLevel,
} from "./use-sudojo-levels";

// ============================================================================
// Technique hooks
// ============================================================================

export {
  useSudojoCreateTechnique,
  useSudojoDeleteTechnique,
  useSudojoTechnique,
  useSudojoTechniqueByPath,
  useSudojoTechniques,
  useSudojoUpdateTechnique,
} from "./use-sudojo-techniques";

// ============================================================================
// Learning hooks
// ============================================================================

export {
  useSudojoCreateLearning,
  useSudojoDeleteLearning,
  useSudojoLearning,
  useSudojoLearningItem,
  useSudojoUpdateLearning,
} from "./use-sudojo-learning";

// ============================================================================
// Board hooks
// ============================================================================

export {
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
} from "./use-sudojo-boards";
export type { FetchBoardsVariables } from "./use-sudojo-boards";

// ============================================================================
// Example hooks
// ============================================================================

export {
  useSudojoCreateExample,
  useSudojoDeleteExample,
  useSudojoExample,
  useSudojoExampleCounts,
  useSudojoExamples,
  useSudojoRandomExample,
  useSudojoUpdateExample,
} from "./use-sudojo-examples";

// ============================================================================
// Daily hooks
// ============================================================================

export {
  useSudojoCreateDaily,
  useSudojoDailies,
  useSudojoDaily,
  useSudojoDailyByDate,
  useSudojoDeleteDaily,
  useSudojoTodayDaily,
  useSudojoUpdateDaily,
} from "./use-sudojo-dailies";

// ============================================================================
// Challenge hooks
// ============================================================================

export {
  useSudojoChallenge,
  useSudojoChallenges,
  useSudojoCreateChallenge,
  useSudojoDeleteChallenge,
  useSudojoRandomChallenge,
  useSudojoUpdateChallenge,
} from "./use-sudojo-challenges";

// ============================================================================
// User hooks
// ============================================================================

export {
  useSudojoDeleteUser,
  useSudojoUser,
  useSudojoUserSubscription,
} from "./use-sudojo-users";
export type { DeleteUserVariables } from "./use-sudojo-users";

// ============================================================================
// Practice hooks
// ============================================================================

export {
  useSudojoCreatePractice,
  useSudojoDeleteAllPractices,
  useSudojoDeletePractice,
  useSudojoPractice,
  useSudojoRegeneratePracticeHints,
  useSudojoPracticeCounts,
  useSudojoRandomPractice,
} from "./use-sudojo-practices";

// ============================================================================
// Gamification hooks (points, badges, levels, game sessions)
// ============================================================================

export {
  useSudojoBadgeDefinitions,
  useSudojoCreateBadge,
  useSudojoDeleteBadge,
  useSudojoGamificationStats,
  useSudojoUpdateBadge,
  useSudojoPlayFinish,
  useSudojoPlayStart,
  useSudojoPointHistory,
} from "./use-sudojo-gamification";

// ============================================================================
// Community hooks
// ============================================================================

export {
  useSudojoCommunities,
  useSudojoCommunity,
  useSudojoCreateCommunity,
  useSudojoDeleteCommunity,
  useSudojoUpdateCommunity,
} from "./use-sudojo-communities";

// ============================================================================
// Strategy hooks
// ============================================================================

export {
  useSudojoStrategies,
  useSudojoStrategy,
  useSudojoStrategyByStub,
  useSudojoCreateStrategy,
  useSudojoDeleteStrategy,
  useSudojoUpdateStrategy,
} from "./use-sudojo-strategies";

// ============================================================================
// Invalidation utilities
// ============================================================================

export { useSudojoInvalidation } from "./use-sudojo-invalidation";
