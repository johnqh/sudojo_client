/**
 * Sudojo API hooks for React
 */

// ============================================================================
// Query utilities
// ============================================================================

export { createQueryKey, getServiceKeys, queryKeys } from "./query-keys";
export type { QueryKey } from "./query-keys";
export { STALE_TIMES } from "./query-config";

// ============================================================================
// Health hook
// ============================================================================

export { useSudojoHealth } from "./use-sudojo-health";

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
  useSudojoBoards,
  useSudojoCreateBoard,
  useSudojoDeleteBoard,
  useSudojoRandomBoard,
  useSudojoUpdateBoard,
} from "./use-sudojo-boards";

// ============================================================================
// Daily hooks
// ============================================================================

export {
  useSudojoCreateDaily,
  useSudojoDailies,
  useSudojoDaily,
  useSudojoDailyByDate,
  useSudojoDeleteDaily,
  useSudojoRandomDaily,
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

export { useSudojoUserSubscription } from "./use-sudojo-users";

// ============================================================================
// Practice hooks
// ============================================================================

export {
  useSudojoCreatePractice,
  useSudojoDeleteAllPractices,
  useSudojoPracticeCounts,
  useSudojoRandomPractice,
} from "./use-sudojo-practices";

// ============================================================================
// Gamification hooks (points, badges, levels, game sessions)
// ============================================================================

export {
  useSudojoBadgeDefinitions,
  useSudojoGamificationStats,
  useSudojoPlayFinish,
  useSudojoPlayStart,
  useSudojoPointHistory,
} from "./use-sudojo-gamification";
