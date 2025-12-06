/**
 * Hook for Sudojo health check endpoint
 */

import { useCallback, useMemo } from "react";
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { BaseResponse, NetworkClient } from "@sudobility/types";
import type { HealthCheckData } from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";
import type { SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get Sudojo server health status
 *
 * @param networkClient - Network client for API calls
 * @param config - Sudojo configuration
 * @param options - React Query options
 */
export const useSudojoHealth = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  options?: Omit<
    UseQueryOptions<BaseResponse<HealthCheckData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<HealthCheckData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<HealthCheckData>
  > => {
    return client.getHealth();
  }, [client]);

  return useQuery({
    queryKey: queryKeys.sudojo.health(),
    queryFn,
    staleTime: STALE_TIMES.HEALTH_STATUS,
    ...options,
  });
};
