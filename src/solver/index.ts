// Hooks
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
} from "./hooks";
export type {
  SolverGenerateVariables,
  SolverSolveVariables,
  SolverValidateVariables,
} from "./hooks";

// Re-export solver types from shared package
export type {
  SolverPencilmark,
  SolverBoard,
  SolverAreaType,
  SolverColor,
  SolverHintArea,
  SolverCellActions,
  SolverHintCell,
  SolverHintStep,
  SolverHints,
  SolveData,
  ValidateData,
  GenerateData,
  ValidateBoardData,
  BaseResponse,
} from "@sudobility/sudojo_types";
