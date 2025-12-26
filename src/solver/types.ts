/**
 * Sudoku Solver API Types
 *
 * Re-exports shared types from @sudobility/sudojo_types and defines
 * client-specific types for request options and configuration.
 */

// Re-export solver types from shared package
export type {
  SolverPencilmarks,
  SolverBoard,
  SolverAreaType,
  SolverColor,
  SolverHintArea,
  SolverCellActions,
  SolverHintCell,
  SolverHintStep,
  SolveData,
  ValidateData,
  GenerateData,
} from "@sudobility/sudojo_types";

// Re-export BaseResponse for convenience
export type { BaseResponse } from "@sudobility/sudojo_types";

/**
 * Options for the solve API call
 */
export interface SolveOptions {
  /** 81-character puzzle string */
  original: string;
  /** 81-character user input string */
  user: string;
  /** Whether auto-pencilmarks are enabled */
  autoPencilmarks?: boolean;
  /** Comma-separated pencilmarks string */
  pencilmarks?: string;
  /** Optional technique filters */
  filters?: string;
}

/**
 * Options for the validate API call
 */
export interface ValidateOptions {
  /** 81-character puzzle string */
  original: string;
}

/**
 * Options for the generate API call
 */
export interface GenerateOptions {
  /** Whether to generate a symmetrical puzzle */
  symmetrical?: boolean;
}

/**
 * Client configuration options
 */
export interface ClientConfig {
  /** Base URL of the API (e.g., "http://localhost:5000") */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

// Response types - BaseResponse wrapping data types
import type {
  BaseResponse,
  GenerateData,
  SolveData,
  ValidateData,
} from "@sudobility/sudojo_types";

/**
 * Response type for solve endpoint
 */
export type SolveResponse = BaseResponse<SolveData>;

/**
 * Response type for validate endpoint
 */
export type ValidateResponse = BaseResponse<ValidateData>;

/**
 * Response type for generate endpoint
 */
export type GenerateResponse = BaseResponse<GenerateData>;
