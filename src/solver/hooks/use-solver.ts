/**
 * React hooks for Sudojo Solver API
 */

import { useCallback, useMemo } from "react";
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { NetworkClient } from "@sudobility/types";
import type { SudojoAuth } from "../../network/sudojo-client";
import { solverQueryKeys } from "./query-keys";
import { SOLVER_STALE_TIMES } from "./query-config";
import { SudojoSolverClient } from "../sudojo-solver-client";
import type {
  GenerateOptions,
  GenerateResponse,
  SolveOptions,
  SolverConfig,
  SolveResponse,
  ValidateOptions,
  ValidateResponse,
} from "../types";

// =============================================================================
// Solve Hook
// =============================================================================

/**
 * Hook to get solving hints for a Sudoku puzzle
 *
 * @param networkClient - Network client for API calls
 * @param config - Solver configuration
 * @param auth - Authentication with Firebase access token (required for /solve endpoint)
 * @param options - Solve options (original puzzle, user input, etc.)
 * @param queryOptions - React Query options
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useSolverSolve(
 *   networkClient,
 *   { baseUrl: 'http://localhost:5000' },
 *   { accessToken: 'firebase-token' },
 *   {
 *     original: '040002008...',
 *     user: '000000000...',
 *     autoPencilmarks: true,
 *   }
 * );
 * ```
 */
export const useSolverSolve = (
  networkClient: NetworkClient,
  config: SolverConfig,
  auth: SudojoAuth,
  options: SolveOptions,
  queryOptions?: Omit<UseQueryOptions<SolveResponse>, "queryKey" | "queryFn">,
): UseQueryResult<SolveResponse> => {
  const client = useMemo(
    () => new SudojoSolverClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<SolveResponse> => {
    return client.solve(options, auth);
  }, [client, options, auth]);

  return useQuery({
    queryKey: solverQueryKeys.solve({
      original: options.original,
      user: options.user,
      autoPencilmarks: options.autoPencilmarks,
      pencilmarks: options.pencilmarks,
      filters: options.filters,
    }),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.SOLVE,
    enabled: !!auth?.accessToken,
    ...queryOptions,
  });
};

// =============================================================================
// Validate Hook
// =============================================================================

/**
 * Hook to validate a Sudoku puzzle has a unique solution
 *
 * @param networkClient - Network client for API calls
 * @param config - Solver configuration
 * @param options - Validate options (original puzzle)
 * @param queryOptions - React Query options
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useSolverValidate(
 *   networkClient,
 *   { baseUrl: 'http://localhost:5000' },
 *   { original: '040002008...' }
 * );
 *
 * if (data?.success) {
 *   console.log('Solution:', data.data?.board.board.solution);
 * }
 * ```
 */
export const useSolverValidate = (
  networkClient: NetworkClient,
  config: SolverConfig,
  options: ValidateOptions,
  queryOptions?: Omit<
    UseQueryOptions<ValidateResponse>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<ValidateResponse> => {
  const client = useMemo(
    () => new SudojoSolverClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<ValidateResponse> => {
    return client.validate(options);
  }, [client, options]);

  return useQuery({
    queryKey: solverQueryKeys.validate(options.original),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.VALIDATE,
    ...queryOptions,
  });
};

// =============================================================================
// Generate Hook
// =============================================================================

/**
 * Hook to generate a new random Sudoku puzzle
 *
 * @param networkClient - Network client for API calls
 * @param config - Solver configuration
 * @param options - Generate options (symmetrical, etc.)
 * @param queryOptions - React Query options
 *
 * @example
 * ```typescript
 * const { data, isLoading, refetch } = useSolverGenerate(
 *   networkClient,
 *   { baseUrl: 'http://localhost:5000' },
 *   { symmetrical: true }
 * );
 *
 * // Generate a new puzzle
 * const handleNewPuzzle = () => refetch();
 * ```
 */
export const useSolverGenerate = (
  networkClient: NetworkClient,
  config: SolverConfig,
  options: GenerateOptions = {},
  queryOptions?: Omit<
    UseQueryOptions<GenerateResponse>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<GenerateResponse> => {
  const client = useMemo(
    () => new SudojoSolverClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<GenerateResponse> => {
    return client.generate(options);
  }, [client, options]);

  return useQuery({
    queryKey: solverQueryKeys.generate({ symmetrical: options.symmetrical }),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.GENERATE,
    ...queryOptions,
  });
};
