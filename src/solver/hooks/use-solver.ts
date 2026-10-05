/**
 * React hooks for Sudojo Solver API
 */

import { useCallback, useMemo } from "react";
import {
  useMutation,
  UseMutationResult,
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
  ValidateOptions,
} from "../../network/sudojo-client";

// =============================================================================
// Solve Hook
// =============================================================================

/**
 * Hook to get solving hints for a Sudoku puzzle
 *
 * `/solver/solve` allows anonymous calls (optional auth), so the query runs
 * without a token. With a token, hints on the active play session earn points.
 * Use {@link useSolverSolveMutation} to fetch hints imperatively.
 *
 * @param networkClient - Network client for API calls
 * @param baseUrl - Base URL for the API
 * @param token - Firebase access token, or "" for an anonymous call
 * @param options - Solve options (original puzzle, user input, etc.)
 * @param queryOptions - React Query options
 */
export const useSolverSolve = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options: SolveOptions,
  queryOptions?: Omit<
    UseQueryOptions<BaseResponse<SolveData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<SolveData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<SolveData>> => {
    return client.solverSolve(token, options);
  }, [client, token, options]);

  // Optional auth: no token requirement
  const isEnabled =
    queryOptions?.enabled !== undefined ? queryOptions.enabled : true;

  return useQuery({
    queryKey: solverQueryKeys.solve({
      original: options.original,
      user: options.user,
      autoPencilmarks: options.autoPencilmarks,
      pencilmarks: options.pencilmarks,
      filters: options.filters,
      techniques: options.techniques,
    }),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.SOLVE,
    ...queryOptions,
    enabled: isEnabled,
  });
};

// =============================================================================
// Solve Mutation
// =============================================================================

/** Arguments for one {@link useSolverSolveMutation} call. */
export interface SolverSolveVariables {
  /**
   * Firebase access token. Optional: `/solver/solve` accepts anonymous calls.
   * With a token, a hint on the active play session earns points.
   */
  token?: string | undefined;
  /** Puzzle state and filters for this hint request. */
  options: SolveOptions;
}

/**
 * Mutation for fetching solver hints imperatively, e.g. when the user taps
 * "hint", or for a filtered call followed by an unfiltered fallback:
 *
 * ```ts
 * const solve = useSolverSolveMutation(networkClient, baseUrl);
 * let res = await solve.mutateAsync({ token, options: { ...base, techniques: "5" } });
 * if (!res.data?.hints) res = await solve.mutateAsync({ token, options: base });
 * ```
 *
 * Calls `SudojoClient.solverSolve(token ?? "", options)`. Nothing is cached
 * or invalidated: each call reads a different board state, and hint points
 * are awarded server-side.
 *
 * @param networkClient - Network client for API calls
 * @param baseUrl - Base URL for the API
 * @returns A UseMutationResult whose data is `BaseResponse<SolveData>`
 */
export const useSolverSolveMutation = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<BaseResponse<SolveData>, Error, SolverSolveVariables> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  return useMutation({
    mutationFn: async ({ token, options }: SolverSolveVariables) =>
      client.solverSolve(token ?? "", options),
  });
};

// =============================================================================
// Validate Hook
// =============================================================================

/**
 * Hook to validate a Sudoku puzzle has a unique solution
 *
 * @param networkClient - Network client for API calls
 * @param baseUrl - Base URL for the API
 * @param token - Firebase access token
 * @param options - Validate options (original puzzle)
 * @param queryOptions - React Query options
 */
export const useSolverValidate = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options: ValidateOptions,
  queryOptions?: Omit<
    UseQueryOptions<BaseResponse<ValidateData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<ValidateData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<ValidateData>> => {
    return client.solverValidate(token, options);
  }, [client, token, options]);

  // Validate endpoint does not require authentication
  const isEnabled =
    queryOptions?.enabled !== undefined ? queryOptions.enabled : true;

  return useQuery({
    queryKey: solverQueryKeys.validate(options.original, options.brutalForce),
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
 * `/solver/generate` is public, so the query runs without a token.
 *
 * @param networkClient - Network client for API calls
 * @param baseUrl - Base URL for the API
 * @param token - Firebase access token, or "" (not required)
 * @param options - Generate options (symmetrical, etc.)
 * @param queryOptions - React Query options
 */
export const useSolverGenerate = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options: GenerateOptions = {},
  queryOptions?: Omit<
    UseQueryOptions<BaseResponse<GenerateData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<GenerateData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<GenerateData>> => {
    return client.solverGenerate(token, options);
  }, [client, token, options]);

  // Public endpoint: no token requirement
  const isEnabled =
    queryOptions?.enabled !== undefined ? queryOptions.enabled : true;

  return useQuery({
    queryKey: solverQueryKeys.generate({ symmetrical: options.symmetrical }),
    queryFn,
    staleTime: SOLVER_STALE_TIMES.GENERATE,
    ...queryOptions,
    enabled: isEnabled,
  });
};

// =============================================================================
// Imperative (mutation) variants
// =============================================================================

/** Arguments for one {@link useSolverValidateMutation} call. */
export interface SolverValidateVariables {
  /** Firebase access token. Optional: `/solver/validate` is public. */
  token?: string | undefined;
  /** Puzzle to validate, plus optional `brutalForce`. */
  options: ValidateOptions;
}

/**
 * Mutation for validating puzzles imperatively, e.g. in admin batch jobs that
 * validate many boards in a loop. Calls
 * `SudojoClient.solverValidate(token ?? "", options)` (120 s timeout).
 * Nothing is cached or invalidated.
 *
 * @param networkClient - Network client for API calls
 * @param baseUrl - Base URL for the API
 * @returns A UseMutationResult whose data is `BaseResponse<ValidateData>`
 */
export const useSolverValidateMutation = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<ValidateData>,
  Error,
  SolverValidateVariables
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  return useMutation({
    mutationFn: async ({ token, options }: SolverValidateVariables) =>
      client.solverValidate(token ?? "", options),
  });
};

/** Arguments for one {@link useSolverGenerateMutation} call. */
export interface SolverGenerateVariables {
  /** Firebase access token. Optional: `/solver/generate` is public. */
  token?: string | undefined;
  /** Generate options (e.g. `symmetrical`). Defaults to `{}`. */
  options?: GenerateOptions | undefined;
}

/**
 * Mutation for generating puzzles imperatively, e.g. in admin batch jobs.
 * Calls `SudojoClient.solverGenerate(token ?? "", options ?? {})`.
 * Nothing is cached or invalidated.
 *
 * @param networkClient - Network client for API calls
 * @param baseUrl - Base URL for the API
 * @returns A UseMutationResult whose data is `BaseResponse<GenerateData>`
 */
export const useSolverGenerateMutation = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<GenerateData>,
  Error,
  SolverGenerateVariables | void
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  return useMutation({
    mutationFn: async (variables: SolverGenerateVariables | void) =>
      client.solverGenerate(variables?.token ?? "", variables?.options ?? {}),
  });
};
