/**
 * Hook for Sudojo boards endpoints
 */

import { useCallback, useMemo } from "react";
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
 * Hook to get all boards with optional filtering
 * Note: This is a public endpoint - token is optional
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
    return client.getBoards(token, level ? { level } : undefined);
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
 * Hook to get a random board with optional filtering
 * Note: This is a public endpoint - token is optional
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

  const queryFn = useCallback(async (): Promise<BaseResponse<Board>> => {
    return client.getRandomBoard(token, level ? { level } : undefined);
  }, [client, token, level]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.boardRandom({
      level: level ?? undefined,
    }),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to get a specific board by UUID
 * Note: This is a public endpoint - token is optional
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
 * Hook to create a board
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
 * Hook to update a board
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
 * Hook to delete a board
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
