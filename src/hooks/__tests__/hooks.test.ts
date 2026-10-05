import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MockNetworkClient } from "@sudobility/di/mocks";
import { SudojoClient } from "../../network/sudojo-client";
import {
  useSolverGenerate,
  useSolverGenerateMutation,
  useSolverSolve,
  useSolverSolveMutation,
  useSolverValidateMutation,
} from "../../solver/hooks/use-solver";
import { solverQueryKeys } from "../../solver/hooks/query-keys";
import {
  useSudojoBoardCounts,
  useSudojoBoards,
  useSudojoFetchBoards,
  useSudojoUpdatePuzzleStats,
} from "../use-sudojo-boards";
import {
  useSudojoCreateExample,
  useSudojoExampleCounts,
  useSudojoExamples,
} from "../use-sudojo-examples";
import { useSudojoDeleteUser } from "../use-sudojo-users";
import { useSudojoCommunity } from "../use-sudojo-communities";
import { useSudojoStrategy } from "../use-sudojo-strategies";
import { useSudojoTechniqueByPath } from "../use-sudojo-techniques";
import { useSudojoLevel } from "../use-sudojo-levels";
import { queryKeys } from "../query-keys";

const BASE_URL = "https://test-sudojo.example.com";
const OK = { success: true, data: {}, timestamp: "2026-01-01T00:00:00Z" };
const PUZZLE = "0".repeat(81);
const UUID = "12345678-1234-1234-1234-123456789abc";

describe("hooks", () => {
  let net: MockNetworkClient;
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

  beforeEach(() => {
    net = new MockNetworkClient();
    net.setDefaultResponse({ data: OK });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    wrapper = ({ children }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe("useSolverSolveMutation", () => {
    it("calls solverSolve with the token and options", async () => {
      const spy = vi.spyOn(SudojoClient.prototype, "solverSolve");
      const { result } = renderHook(
        () => useSolverSolveMutation(net, BASE_URL),
        { wrapper },
      );
      const options = { original: PUZZLE, user: PUZZLE, techniques: "5" };

      const data = await result.current.mutateAsync({ token: "tok", options });

      expect(spy).toHaveBeenCalledWith("tok", options);
      expect(data).toEqual(OK);
      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/solver/solve?original=${PUZZLE}&techniques=5&user=${PUZZLE}`,
      );
    });

    it('passes "" when no token is given (anonymous solve)', async () => {
      const spy = vi.spyOn(SudojoClient.prototype, "solverSolve");
      const { result } = renderHook(
        () => useSolverSolveMutation(net, BASE_URL),
        { wrapper },
      );
      const options = { original: PUZZLE, user: PUZZLE };

      await result.current.mutateAsync({ options });

      expect(spy).toHaveBeenCalledWith("", options);
      const headers = net.getLastRequest()?.options?.headers as Record<
        string,
        string
      >;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("rejects when the solver call fails", async () => {
      net.setDefaultResponse({ ok: false, status: 500, data: undefined });
      const { result } = renderHook(
        () => useSolverSolveMutation(net, BASE_URL),
        { wrapper },
      );
      await expect(
        result.current.mutateAsync({
          options: { original: PUZZLE, user: PUZZLE },
        }),
      ).rejects.toThrow("Failed to get hints from solver");
    });
  });

  describe("solver query token gating", () => {
    it("useSolverSolve runs without a token", async () => {
      const options = { original: PUZZLE, user: PUZZLE };
      const { result } = renderHook(
        () => useSolverSolve(net, BASE_URL, "", options),
        { wrapper },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        net.wasUrlCalled(
          `${BASE_URL}/api/v1/solver/solve?original=${PUZZLE}&user=${PUZZLE}`,
        ),
      ).toBe(true);
      expect(
        queryClient.getQueryData(
          solverQueryKeys.solve({
            original: PUZZLE,
            user: PUZZLE,
            autoPencilmarks: undefined,
            pencilmarks: undefined,
            filters: undefined,
            techniques: undefined,
          }),
        ),
      ).toEqual(OK);
    });

    it("useSolverGenerate runs without a token", async () => {
      const { result } = renderHook(
        () => useSolverGenerate(net, BASE_URL, ""),
        { wrapper },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(net.wasUrlCalled(`${BASE_URL}/api/v1/solver/generate`)).toBe(true);
    });

    it("queryOptions.enabled = false still disables both", async () => {
      renderHook(
        () => {
          useSolverSolve(
            net,
            BASE_URL,
            "",
            { original: PUZZLE, user: PUZZLE },
            { enabled: false },
          );
          useSolverGenerate(net, BASE_URL, "", {}, { enabled: false });
        },
        { wrapper },
      );
      await new Promise((r) => setTimeout(r, 20));
      expect(net.getRequests()).toHaveLength(0);
    });
  });

  describe("useSudojoBoards", () => {
    it("forwards every filter to the request and the query key", async () => {
      const mask = "1152921504606846978"; // > 2^53
      const { result } = renderHook(
        () =>
          useSudojoBoards(net, BASE_URL, "", {
            level: 3,
            symmetrical: undefined,
            limit: 20,
            offset: 40,
            techniques: mask,
            technique_bit: 6,
          }),
        { wrapper },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/boards?level=3&limit=20&offset=40&techniques=${mask}&technique_bit=6`,
      );
      const keys = queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey);
      expect(keys).toContainEqual(
        queryKeys.sudojo.boards({
          level: 3,
          symmetrical: undefined,
          limit: 20,
          offset: 40,
          techniques: mask,
          technique_bit: "6",
        }),
      );
    });

    it("puts numeric masks into the key as exact strings", async () => {
      const { result } = renderHook(
        () =>
          useSudojoBoards(net, BASE_URL, "", {
            level: undefined,
            symmetrical: undefined,
            limit: undefined,
            offset: undefined,
            techniques: 2 ** 60,
            technique_bit: undefined,
          }),
        { wrapper },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const key = queryClient.getQueryCache().getAll()[0]?.queryKey;
      expect(JSON.stringify(key)).toContain(
        '"techniques":"1152921504606846976"',
      );
    });

    it("distinct pages get distinct cache entries", async () => {
      const params = (offset: number) => ({
        level: 1,
        symmetrical: undefined,
        limit: 10,
        offset,
        techniques: undefined,
        technique_bit: undefined,
      });
      const a = renderHook(
        () => useSudojoBoards(net, BASE_URL, "", params(0)),
        {
          wrapper,
        },
      );
      const b = renderHook(
        () => useSudojoBoards(net, BASE_URL, "", params(10)),
        { wrapper },
      );
      await waitFor(() => expect(a.result.current.isSuccess).toBe(true));
      await waitFor(() => expect(b.result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
    });

    it("keeps the unfiltered key unchanged", async () => {
      const { result } = renderHook(() => useSudojoBoards(net, BASE_URL, ""), {
        wrapper,
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(net.getLastRequest()?.url).toBe(`${BASE_URL}/api/v1/boards`);
      expect(
        queryClient.getQueryData(queryKeys.sudojo.boards({ level: undefined })),
      ).toEqual(OK);
    });
  });

  describe("new query hooks", () => {
    it.each([
      [
        "useSudojoBoardCounts",
        () => useSudojoBoardCounts(net, BASE_URL, ""),
        "/api/v1/boards/counts",
      ],
      [
        "useSudojoExampleCounts",
        () => useSudojoExampleCounts(net, BASE_URL, ""),
        "/api/v1/examples/counts",
      ],
      [
        "useSudojoExamples",
        () => useSudojoExamples(net, BASE_URL, "", { technique: 7 }),
        "/api/v1/examples?technique=7",
      ],
      [
        "useSudojoCommunity",
        () => useSudojoCommunity(net, BASE_URL, "", UUID),
        `/api/v1/communities/${UUID}`,
      ],
      [
        "useSudojoStrategy",
        () => useSudojoStrategy(net, BASE_URL, "", 4),
        "/api/v1/strategies/4",
      ],
      [
        "useSudojoTechniqueByPath",
        () => useSudojoTechniqueByPath(net, BASE_URL, "", "x-wing"),
        "/api/v1/techniques/path/x-wing",
      ],
    ])("%s fetches its endpoint", async (_name, hook, path) => {
      const { result } = renderHook(hook, { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(net.getLastRequest()?.url).toBe(`${BASE_URL}${path}`);
    });

    it("useSudojoLevel is disabled outside MIN_LEVEL..MAX_LEVEL", async () => {
      const { result } = renderHook(
        () => useSudojoLevel(net, BASE_URL, "", 13),
        { wrapper },
      );
      expect(result.current.fetchStatus).toBe("idle");
      expect(net.getRequests()).toHaveLength(0);
    });
  });

  describe("new mutation hooks", () => {
    it("useSudojoCreateExample invalidates example queries", async () => {
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(
        () => useSudojoCreateExample(net, BASE_URL),
        { wrapper },
      );
      await result.current.mutateAsync({
        token: "tok",
        data: {
          board: PUZZLE,
          pencilmarks: undefined,
          solution: PUZZLE,
          techniques_bitfield: 2,
          primary_technique: 1,
          hint_data: undefined,
          source_board_uuid: undefined,
        },
      });
      expect(net.getLastRequest()?.method).toBe("POST");
      expect(spy).toHaveBeenCalledWith({
        queryKey: [...queryKeys.sudojo.all(), "examples"],
      });
    });

    it("useSudojoUpdatePuzzleStats invalidates levels and techniques", async () => {
      const spy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(
        () => useSudojoUpdatePuzzleStats(net, BASE_URL),
        { wrapper },
      );
      await result.current.mutateAsync({ token: "tok" });
      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/boards/update-stats`,
      );
      expect(spy).toHaveBeenCalledWith({
        queryKey: [...queryKeys.sudojo.all(), "levels"],
      });
      expect(spy).toHaveBeenCalledWith({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
    });

    it("useSudojoDeleteUser calls DELETE and drops the user's cache", async () => {
      queryClient.setQueryData(queryKeys.sudojo.user("uid-1"), OK);
      const { result } = renderHook(() => useSudojoDeleteUser(net, BASE_URL), {
        wrapper,
      });
      await result.current.mutateAsync({ token: "tok", userId: "uid-1" });
      expect(net.getLastRequest()?.method).toBe("DELETE");
      expect(net.getLastRequest()?.url).toBe(`${BASE_URL}/api/v1/users/uid-1`);
      expect(
        queryClient.getQueryData(queryKeys.sudojo.user("uid-1")),
      ).toBeUndefined();
    });
  });

  describe("imperative read mutations", () => {
    it("useSolverValidateMutation calls solverValidate with brutalForce", async () => {
      const spy = vi.spyOn(SudojoClient.prototype, "solverValidate");
      const { result } = renderHook(
        () => useSolverValidateMutation(net, BASE_URL),
        { wrapper },
      );
      const options = { original: PUZZLE, brutalForce: false };
      await result.current.mutateAsync({ options });
      expect(spy).toHaveBeenCalledWith("", options);
      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/solver/validate?brutalForce=false&original=${PUZZLE}`,
      );
      await result.current.mutateAsync({ token: "tok", options });
      expect(spy).toHaveBeenLastCalledWith("tok", options);
    });

    it("useSolverGenerateMutation calls solverGenerate", async () => {
      const spy = vi.spyOn(SudojoClient.prototype, "solverGenerate");
      const { result } = renderHook(
        () => useSolverGenerateMutation(net, BASE_URL),
        { wrapper },
      );
      await result.current.mutateAsync({ options: { symmetrical: true } });
      expect(spy).toHaveBeenCalledWith("", { symmetrical: true });
      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/solver/generate?symmetrical=true`,
      );
      await result.current.mutateAsync({ token: "tok" });
      expect(spy).toHaveBeenLastCalledWith("tok", {});
      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/solver/generate`,
      );
    });

    it("useSudojoFetchBoards forwards every filter and caches nothing", async () => {
      const spy = vi.spyOn(SudojoClient.prototype, "getBoards");
      const { result } = renderHook(() => useSudojoFetchBoards(net, BASE_URL), {
        wrapper,
      });
      const queryParams = {
        level: 2,
        symmetrical: undefined,
        limit: 50,
        offset: 100,
        techniques: "1152921504606846978",
        technique_bit: 4,
      };
      const data = await result.current.mutateAsync({
        token: "tok",
        queryParams,
      });
      expect(data).toEqual(OK);
      expect(spy).toHaveBeenCalledWith("tok", queryParams);
      expect(net.getLastRequest()?.url).toBe(
        `${BASE_URL}/api/v1/boards?level=2&limit=50&offset=100&techniques=1152921504606846978&technique_bit=4`,
      );
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });
});
