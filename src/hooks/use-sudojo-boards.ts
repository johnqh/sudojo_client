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
import type { SudojoAuth, SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get all boards with optional filtering
 */
export const useSudojoBoards = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  queryParams?: BoardQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Board[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Board[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Board[]>> => {
    return client.getBoards(queryParams);
  }, [client, queryParams]);

  return useQuery({
    queryKey: queryKeys.sudojo.boards({
      level_uuid: queryParams?.level_uuid ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.BOARDS,
    ...options,
  });
};

/**
 * Hook to get a random board with optional filtering
 */
export const useSudojoRandomBoard = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  queryParams?: BoardQueryParams,
  options?: Omit<UseQueryOptions<BaseResponse<Board>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Board>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Board>> => {
    return client.getRandomBoard(queryParams);
  }, [client, queryParams]);

  return useQuery({
    queryKey: queryKeys.sudojo.boardRandom({
      level_uuid: queryParams?.level_uuid ?? undefined,
    }),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
  });
};

/**
 * Hook to get a specific board by UUID
 */
export const useSudojoBoard = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  uuid: string,
  options?: Omit<UseQueryOptions<BaseResponse<Board>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Board>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Board>> => {
    return client.getBoard(uuid);
  }, [client, uuid]);

  return useQuery({
    queryKey: queryKeys.sudojo.board(uuid),
    queryFn,
    staleTime: STALE_TIMES.BOARDS,
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Hook to create a board
 */
export const useSudojoCreateBoard = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Board>,
  Error,
  { auth: SudojoAuth; data: BoardCreateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auth,
      data,
    }: {
      auth: SudojoAuth;
      data: BoardCreateRequest;
    }) => {
      return client.createBoard(auth, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Board>,
  Error,
  { auth: SudojoAuth; uuid: string; data: BoardUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auth,
      uuid,
      data,
    }: {
      auth: SudojoAuth;
      uuid: string;
      data: BoardUpdateRequest;
    }) => {
      return client.updateBoard(auth, uuid, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Board>,
  Error,
  { auth: SudojoAuth; uuid: string }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auth, uuid }: { auth: SudojoAuth; uuid: string }) => {
      return client.deleteBoard(auth, uuid);
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
