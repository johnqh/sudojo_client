/**
 * Hook for Sudojo boards endpoints
 */

import { useCallback, useMemo, useRef } from "react";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { NetworkClient } from "@sudobility/types";
import type {
  BaseResponse,
  Board,
  BoardCreateRequest,
  BoardQueryParams,
  BoardUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch all Sudoku boards with optional filtering by level.
 *
 * Boards represent Sudoku puzzles with their original clues, solution, and
 * metadata. This is a public endpoint - token is accepted for consistency
 * but not required.
 *
 * Stale time: {@link STALE_TIMES.BOARDS} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters (e.g., `{ level: 3 }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Board objects
 */
export const useSudojoBoards = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: BoardQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Board[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Board[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  // Extract values for stable dependencies
  const level = queryParams?.level;

  const queryFn = useCallback(async (): Promise<BaseResponse<Board[]>> => {
    return client.getBoards(
      token,
      level !== undefined
        ? {
            level,
            symmetrical: undefined,
            limit: undefined,
            offset: undefined,
            techniques: undefined,
            technique_bit: undefined,
          }
        : undefined,
    );
  }, [client, token, level]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.boards({
      level: level ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.BOARDS,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a random Sudoku board, optionally filtered by level.
 *
 * Uses `staleTime: Infinity` so the puzzle is never automatically refetched.
 * To get a new random puzzle, call `refetch()` on the returned query result.
 * Also disables `refetchOnWindowFocus` to prevent unintended puzzle changes.
 *
 * Uses a ref for the token to keep the queryFn reference stable across
 * token refreshes, preventing unnecessary refetches.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters (e.g., `{ level: 3 }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Board object. Call `refetch()` for a new puzzle.
 */
export const useSudojoRandomBoard = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: BoardQueryParams,
  options?: Omit<UseQueryOptions<BaseResponse<Board>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Board>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  // Extract values for stable dependencies
  const level = queryParams?.level;

  // Use a ref for token so queryFn reference stays stable across token refreshes
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const queryFn = useCallback(async (): Promise<BaseResponse<Board>> => {
    return client.getRandomBoard(
      tokenRef.current,
      level !== undefined
        ? {
            level,
            symmetrical: undefined,
            limit: undefined,
            offset: undefined,
            techniques: undefined,
            technique_bit: undefined,
          }
        : undefined,
    );
  }, [client, level]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.boardRandom({
      level: level ?? undefined,
    }),
    queryFn,
    staleTime: Infinity, // Only refetch via explicit nextPuzzle() / refetch()
    refetchOnWindowFocus: false,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a specific board by its UUID.
 *
 * The query is automatically disabled when no UUID is provided.
 * This is a public endpoint - token is accepted but not required.
 *
 * Stale time: {@link STALE_TIMES.BOARDS} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param uuid - Board UUID. Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Board object
 */
export const useSudojoBoard = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<UseQueryOptions<BaseResponse<Board>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Board>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Board>> => {
    return client.getBoard(token, uuid);
  }, [client, token, uuid]);

  // Public endpoint - no token required, but uuid is required
  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.board(uuid),
    queryFn,
    staleTime: STALE_TIMES.BOARDS,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new board. Requires admin authentication.
 *
 * On success, invalidates all board list queries (including random and filtered).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoCreateBoard = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Board>,
  Error,
  { token: string; data: BoardCreateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: BoardCreateRequest;
    }) => {
      return client.createBoard(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "boards"],
      });
    },
  });
};

/**
 * Hook to update an existing board. Requires admin authentication.
 *
 * On success, invalidates all board list queries and the specific board query.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid, data })` to execute.
 */
export const useSudojoUpdateBoard = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Board>,
  Error,
  { token: string; uuid: string; data: BoardUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      uuid,
      data,
    }: {
      token: string;
      uuid: string;
      data: BoardUpdateRequest;
    }) => {
      return client.updateBoard(token, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "boards"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.board(variables.uuid),
      });
    },
  });
};

/**
 * Hook to delete a board. Requires admin authentication.
 *
 * On success, invalidates all board list queries and removes the specific
 * board from the query cache entirely.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid })` to execute.
 */
export const useSudojoDeleteBoard = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Board>,
  Error,
  { token: string; uuid: string }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, uuid }: { token: string; uuid: string }) => {
      return client.deleteBoard(token, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "boards"],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.board(variables.uuid),
      });
    },
  });
};
