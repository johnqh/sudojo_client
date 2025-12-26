// Client
export {
  createSudojoSolverClient,
  SudojoApiError,
  SudojoSolverClient,
} from "./sudojo-solver-client";

// Hooks
export {
  getSolverServiceKeys,
  solverQueryKeys,
  SOLVER_STALE_TIMES,
  useSolverGenerate,
  useSolverSolve,
  useSolverValidate,
} from "./hooks";

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
  BaseResponse,
} from "@sudobility/sudojo_types";

// Client-specific types
export type {
  SolveOptions,
  ValidateOptions,
  GenerateOptions,
  ClientConfig,
  SolveResponse,
  ValidateResponse,
  GenerateResponse,
} from "./types";
