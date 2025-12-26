import type { NetworkClient } from "@sudobility/types";
import type { SudojoAuth } from "../network/sudojo-client";
import type {
  ClientConfig,
  GenerateOptions,
  GenerateResponse,
  SolveOptions,
  SolveResponse,
  ValidateOptions,
  ValidateResponse,
} from "./types";

/**
 * Error thrown when an API request fails
 */
export class SudojoApiError extends Error {
  public readonly statusCode: number;
  public readonly response: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = "SudojoApiError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

// =============================================================================
// URL Search Params Utility
// =============================================================================

/**
 * Custom URL params builder that matches Kotlin Params class behavior.
 * Does NOT URL-encode values to match the server's expectations.
 */
const createURLSearchParams = (): {
  append: (key: string, value: string) => void;
  toString: () => string;
} => {
  const params: Record<string, string[]> = {};
  return {
    append: (key: string, value: string): void => {
      if (!params[key]) {
        params[key] = [];
      }
      params[key]?.push(value);
    },
    toString: (): string => {
      // Match Kotlin Params.toString() - no URL encoding
      // Keys are sorted alphabetically to match Kotlin behavior
      const sortedKeys = Object.keys(params).sort();
      return sortedKeys
        .flatMap((key) => (params[key] ?? []).map((value) => `${key}=${value}`))
        .join("&");
    },
  };
};

// =============================================================================
// API Configuration Factory
// =============================================================================

const createApiConfig = (
  config: ClientConfig,
): {
  BASE_URL: string;
  ENDPOINTS: {
    SOLVE: string;
    VALIDATE: string;
    GENERATE: string;
  };
  DEFAULT_HEADERS: Record<string, string>;
} => ({
  BASE_URL: config.baseUrl.replace(/\/+$/, ""),
  ENDPOINTS: {
    SOLVE: "/api/v1/solver/solve",
    VALIDATE: "/api/v1/solver/validate",
    GENERATE: "/api/v1/solver/generate",
  },
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =============================================================================
// Sudojo Solver Client Class
// =============================================================================

/**
 * Client for the Sudoku Solver API
 *
 * Provides methods to:
 * - Get hints for solving a puzzle
 * - Validate a puzzle has a unique solution
 * - Generate new random puzzles
 *
 * @example
 * ```typescript
 * import { NetworkService } from '@sudobility/di';
 *
 * const networkClient = NetworkService.getInstance();
 * const client = new SudojoSolverClient(networkClient, { baseUrl: 'http://localhost:5000' });
 *
 * // Get hints (requires auth)
 * const hints = await client.solve({
 *   original: '040002008100400000080000140070105000508000602000209030069000070000006004700500090',
 *   user: '000000000000000000000000000000000000000000000000000000000000000000000000000000000',
 *   autoPencilmarks: true,
 * }, { accessToken: 'firebase-token' });
 *
 * // Validate a puzzle (no auth required)
 * const validation = await client.validate({
 *   original: '040002008100400000080000140070105000508000602000209030069000070000006004700500090',
 * });
 *
 * // Generate a new puzzle (no auth required)
 * const puzzle = await client.generate({ symmetrical: true });
 * ```
 */
export class SudojoSolverClient {
  private readonly networkClient: NetworkClient;
  private readonly config: ReturnType<typeof createApiConfig>;
  private readonly headers: Record<string, string>;

  /**
   * Creates a new Sudoku Solver API client
   *
   * @param networkClient - Network client for making HTTP requests
   * @param config - Client configuration
   */
  constructor(networkClient: NetworkClient, config: ClientConfig) {
    this.networkClient = networkClient;
    this.config = createApiConfig(config);
    this.headers = { ...this.config.DEFAULT_HEADERS };
  }

  /**
   * Builds a URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params: Record<string, string | boolean | undefined>,
  ): string {
    const searchParams = createURLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    return `${this.config.BASE_URL}${endpoint}${query ? `?${query}` : ""}`;
  }

  /**
   * Makes a request to the API and parses the response
   */
  private async request<T>(url: string, auth?: SudojoAuth): Promise<T> {
    const headers = { ...this.headers };
    if (auth?.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    const response = await this.networkClient.get<T>(url, {
      headers,
    });

    if (!response.ok) {
      throw new SudojoApiError(
        `API request failed with status ${response.status}`,
        response.status,
        response.data,
      );
    }

    if (response.data === undefined || response.data === null) {
      throw new Error("No data received from server");
    }

    return response.data as T;
  }

  /**
   * Get hints for solving a Sudoku puzzle
   *
   * @param options - Solve options including puzzle state
   * @param auth - Authentication with Firebase access token (required)
   * @returns Hint response with solving steps
   *
   * @example
   * ```typescript
   * const result = await client.solve({
   *   original: '040002008...',
   *   user: '000000000...',
   *   autoPencilmarks: true,
   * }, { accessToken: 'firebase-token' });
   *
   * if (result.success && result.data?.hints) {
   *   for (const step of result.data.hints.steps) {
   *     console.log(`${step.title}: ${step.text}`);
   *   }
   * }
   * ```
   */
  async solve(
    options: SolveOptions,
    auth?: SudojoAuth,
  ): Promise<SolveResponse> {
    const url = this.buildUrl(this.config.ENDPOINTS.SOLVE, {
      original: options.original,
      user: options.user,
      autopencilmarks: options.autoPencilmarks,
      pencilmarks: options.pencilmarks,
      filters: options.filters,
    });

    return this.request<SolveResponse>(url, auth);
  }

  /**
   * Validate that a Sudoku puzzle has a unique solution
   *
   * @param options - Validate options with puzzle string
   * @returns Validation result with solution if valid
   *
   * @example
   * ```typescript
   * const result = await client.validate({
   *   original: '040002008...',
   * });
   *
   * if (result.success) {
   *   console.log('Valid puzzle!');
   *   console.log('Solution:', result.data?.board.board.solution);
   * } else {
   *   console.log('Invalid:', result.error?.message);
   * }
   * ```
   */
  async validate(options: ValidateOptions): Promise<ValidateResponse> {
    const url = this.buildUrl(this.config.ENDPOINTS.VALIDATE, {
      original: options.original,
    });

    return this.request<ValidateResponse>(url);
  }

  /**
   * Generate a new random Sudoku puzzle
   *
   * @param options - Generation options
   * @returns Generated puzzle with solution
   *
   * @example
   * ```typescript
   * const result = await client.generate({ symmetrical: true });
   *
   * if (result.success && result.data) {
   *   console.log('Puzzle:', result.data.board.board.original);
   *   console.log('Solution:', result.data.board.board.solution);
   *   console.log('Difficulty level:', result.data.board.level);
   * }
   * ```
   */
  async generate(options: GenerateOptions = {}): Promise<GenerateResponse> {
    const url = this.buildUrl(this.config.ENDPOINTS.GENERATE, {
      symmetrical: options.symmetrical,
    });

    return this.request<GenerateResponse>(url);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Factory function to create a SudojoSolverClient
 *
 * @param networkClient - Network client for making HTTP requests
 * @param config - Client configuration
 * @returns A new SudojoSolverClient instance
 */
export const createSudojoSolverClient = (
  networkClient: NetworkClient,
  config: ClientConfig,
): SudojoSolverClient => {
  return new SudojoSolverClient(networkClient, config);
};
