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
import type {
  BaseResponse,
  GenerateData,
  SolveData,
  ValidateData,
} from "@sudobility/sudojo_types";
import { solverQueryKeys } from "./query-keys";
import { SOLVER_STALE_TIMES } from "./query-config";
import { SudojoClient } from "../../network/sudojo-client";
import type {
  GenerateOptions,
  SolveOptions,
  SudojoAuth,
  SudojoConfig,
  ValidateOptions,
} from "../../network/sudojo-client";

// =============================================================================
// Solve Hook
// =============================================================================

/**
 * Hook to get solving hints for a Sudoku puzzle
 *
 * @param networkClient - Network client for API calls
 * @param config - Client configuration
 * @param auth - Authentication with Firebase access token
 * @param options - Solve options (original puzzle, user input, etc.)
 * @param queryOptions - React Query options
 */
export const useSolverSolve = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  options: SolveOptions,
  queryOptions?: Omit<
    UseQueryOptions<BaseResponse<SolveData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<SolveData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<SolveData>> => {
    return client.solverSolve({ accessToken: accessToken ?? "" }, options);
  }, [client, accessToken, options]);

  const isEnabled =
    !!accessToken &&
    (queryOptions?.enabled !== undefined ? queryOptions.enabled : true);

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
    ...queryOptions,
    enabled: isEnabled,
  });
};

// =============================================================================
// Validate Hook
// =============================================================================

/**
 * Hook to validate a Sudoku puzzle has a unique solution
 *
 * @param networkClient - Network client for API calls
 * @param config - Client configuration
 * @param auth - Authentication with Firebase access token
 * @param options - Validate options (original puzzle)
 * @param queryOptions - React Query options
 */
export const useSolverValidate = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  options: ValidateOptions,
  queryOptions?: Omit<
    UseQueryOptions<BaseResponse<ValidateData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<ValidateData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<ValidateData>> => {
    return client.solverValidate({ accessToken: accessToken ?? "" }, options);
  }, [client, accessToken, options]);

  const isEnabled =
    !!accessToken &&
    (queryOptions?.enabled !== undefined ? queryOptions.enabled : true);

  return useQuery({
    queryKey: solverQueryKeys.validate(options.original),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.VALIDATE,
    ...queryOptions,
    enabled: isEnabled,
  });
};

// =============================================================================
// Generate Hook
// =============================================================================

/**
 * Hook to generate a new random Sudoku puzzle
 *
 * @param networkClient - Network client for API calls
 * @param config - Client configuration
 * @param auth - Authentication with Firebase access token
 * @param options - Generate options (symmetrical, etc.)
 * @param queryOptions - React Query options
 */
export const useSolverGenerate = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  options: GenerateOptions = {},
  queryOptions?: Omit<
    UseQueryOptions<BaseResponse<GenerateData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<GenerateData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<GenerateData>> => {
    return client.solverGenerate({ accessToken: accessToken ?? "" }, options);
  }, [client, accessToken, options]);

  const isEnabled =
    !!accessToken &&
    (queryOptions?.enabled !== undefined ? queryOptions.enabled : true);

  return useQuery({
    queryKey: solverQueryKeys.generate({ symmetrical: options.symmetrical }),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.GENERATE,
    ...queryOptions,
    enabled: isEnabled,
  });
};
