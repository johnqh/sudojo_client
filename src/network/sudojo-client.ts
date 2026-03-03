import type { NetworkClient, UserInfoResponse } from "@sudobility/types";
import {
  type BadgeDefinition,
  type BaseResponse,
  type Board,
  type BoardCountsData,
  type BoardCreateRequest,
  type BoardQueryParams,
  type BoardUpdateRequest,
  type Challenge,
  type ChallengeCreateRequest,
  type ChallengeQueryParams,
  type ChallengeUpdateRequest,
  type Daily,
  type DailyCreateRequest,
  type DailyUpdateRequest,
  type ExampleCountsData,
  type GameFinishRequest,
  type GameFinishResponse,
  type GameStartRequest,
  type GameStartResponse,
  type GamificationStats,
  type GenerateData,
  type GenerateOptions,
  type HealthCheckData,
  type HintAccessDeniedResponse,
  isValidUUID,
  type Learning,
  type LearningCreateRequest,
  type LearningQueryParams,
  type LearningUpdateRequest,
  type Level,
  type LevelCreateRequest,
  type LevelUpdateRequest,
  type Optional,
  type PointTransaction,
  type SolveData,
  type SolveOptions,
  type SubscriptionResult,
  type Technique,
  type TechniqueCreateRequest,
  type TechniqueExample,
  type TechniqueExampleCreateRequest,
  type TechniqueExampleQueryParams,
  type TechniquePractice,
  type TechniquePracticeCountItem,
  type TechniquePracticeCreateRequest,
  type TechniqueQueryParams,
  type TechniqueUpdateRequest,
  type ValidateData,
  type ValidateOptions,
  validateUUID,
} from "@sudobility/sudojo_types";
import { HintAccessDeniedError } from "../errors";

// Re-export option types for convenience
export type { SolveOptions, ValidateOptions, GenerateOptions };

// =============================================================================
// Solution Decryption
// =============================================================================

let _solutionKey: CryptoKey | null = null;

/**
 * Configure the symmetric key used to decrypt `solution` fields in API responses.
 * Call once at app startup with the hex-encoded 256-bit key.
 * If not called (or called with empty string), encrypted solutions pass through as-is.
 */
export async function configureSolutionKey(keyHex: string): Promise<void> {
  if (!keyHex) return;
  const hexPairs = keyHex.match(/.{2}/g);
  if (!hexPairs) return;
  const keyBytes = new Uint8Array(hexPairs.map((byte) => parseInt(byte, 16)));
  _solutionKey = await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["decrypt"],
  );
}

async function decryptSolution(encrypted: string): Promise<string> {
  if (!_solutionKey) return encrypted;

  const raw = globalThis.atob(encrypted.slice(4)); // strip "enc:" prefix
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  const nonce = bytes.slice(0, 12);
  const ciphertextWithTag = bytes.slice(12);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    _solutionKey,
    ciphertextWithTag,
  );

  return new TextDecoder().decode(decrypted);
}

async function decryptSolutionFields(data: unknown): Promise<unknown> {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return Promise.all(data.map((item) => decryptSolutionFields(item)));
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      if (
        key === "solution" &&
        typeof obj[key] === "string" &&
        (obj[key] as string).startsWith("enc:")
      ) {
        result[key] = await decryptSolution(obj[key] as string);
      } else {
        result[key] = await decryptSolutionFields(obj[key]);
      }
    }
    return result;
  }

  return data;
}

// =============================================================================
// URL Search Params Utility
// =============================================================================

/**
 * Creates a lightweight URL search params builder.
 *
 * This is a custom implementation instead of the standard `URLSearchParams`
 * because the solver API requires a special encoding behavior: **commas must
 * NOT be percent-encoded** in pencilmark values. The standard `URLSearchParams`
 * encodes commas as `%2C`, which the Kotlin-based solver backend does not decode.
 *
 * @returns An object with `append(key, value)` and `toString()` methods
 *
 * @example
 * ```ts
 * const params = createURLSearchParams();
 * params.append("pencilmarks", "1,2,3");
 * params.toString(); // "pencilmarks=1,2,3" (commas preserved)
 * ```
 */
const createURLSearchParams = () => {
  const params: Record<string, string[]> = {};
  return {
    append: (key: string, value: string) => {
      if (!params[key]) {
        params[key] = [];
      }
      params[key]?.push(value);
    },
    toString: () => {
      return Object.entries(params)
        .flatMap(([key, values]) =>
          values.map(
            (value) =>
              // Don't encode commas - the solver API expects literal commas in pencilmarks
              `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%2C/g, ",")}`,
          ),
        )
        .join("&");
    },
  };
};

// =============================================================================
// API Configuration Factory
// =============================================================================

const createApiConfig = (baseUrl: string) => ({
  BASE_URL: baseUrl,
  ENDPOINTS: {
    // Health
    HEALTH: "/",

    // Levels
    LEVELS: "/api/v1/levels",
    LEVEL: (level: number) => `/api/v1/levels/${level}`,

    // Techniques
    TECHNIQUES: "/api/v1/techniques",
    TECHNIQUE: (technique: number) => `/api/v1/techniques/${technique}`,

    // Learning
    LEARNING: "/api/v1/learning",
    LEARNING_ITEM: (uuid: string) => `/api/v1/learning/${uuid}`,

    // Boards
    BOARDS: "/api/v1/boards",
    BOARDS_RANDOM: "/api/v1/boards/random",
    BOARD: (uuid: string) => `/api/v1/boards/${uuid}`,

    // Dailies
    DAILIES: "/api/v1/dailies",
    DAILIES_RANDOM: "/api/v1/dailies/random",
    DAILIES_TODAY: "/api/v1/dailies/today",
    DAILIES_DATE: (date: string) => `/api/v1/dailies/date/${date}`,
    DAILY: (uuid: string) => `/api/v1/dailies/${uuid}`,

    // Challenges
    CHALLENGES: "/api/v1/challenges",
    CHALLENGES_RANDOM: "/api/v1/challenges/random",
    CHALLENGE: (uuid: string) => `/api/v1/challenges/${uuid}`,

    // Users
    USER: (userId: string) => `/api/v1/users/${userId}`,
    USER_SUBSCRIPTIONS: (userId: string) =>
      `/api/v1/users/${userId}/subscriptions`,

    // Solver
    SOLVER_SOLVE: "/api/v1/solver/solve",
    SOLVER_VALIDATE: "/api/v1/solver/validate",
    SOLVER_GENERATE: "/api/v1/solver/generate",

    // Practices
    PRACTICES: "/api/v1/practices",
    PRACTICES_COUNTS: "/api/v1/practices/counts",
    PRACTICE_RANDOM: (technique: number) =>
      `/api/v1/practices/technique/${technique}/random`,

    // Examples
    EXAMPLES: "/api/v1/examples",
    EXAMPLES_COUNTS: "/api/v1/examples/counts",

    // Boards counts
    BOARDS_COUNTS: "/api/v1/boards/counts",
    BOARDS_COUNTS_BY_TECHNIQUE: "/api/v1/boards/counts/by-technique",

    // Play (game sessions)
    PLAY_START: "/api/v1/play/start",
    PLAY_FINISH: "/api/v1/play/finish",

    // Gamification
    GAMIFICATION_STATS: "/api/v1/gamification/stats",
    GAMIFICATION_BADGES: "/api/v1/gamification/badges",
    GAMIFICATION_HISTORY: "/api/v1/gamification/history",
  },
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =============================================================================
// Sudojo Client Class
// =============================================================================

/**
 * Type-safe client for the Sudojo REST API.
 *
 * Provides methods for all Sudojo API endpoints including levels, techniques,
 * boards, dailies, challenges, users, solver, practices, examples, and gamification.
 *
 * ## Error Handling
 *
 * All methods throw errors on failure:
 * - **Network errors**: Thrown by the underlying `NetworkClient` (e.g., connection refused, timeout)
 * - **Empty response**: Throws `Error("No data received from server")` when the server returns no data
 * - **Validation errors**: Thrown before the request for invalid parameters (e.g., invalid UUID, level out of range)
 * - **HTTP 402**: `solverSolve()` throws {@link HintAccessDeniedError} when the hint level exceeds the user's tier
 * - **Other HTTP errors**: Depend on the `NetworkClient` implementation - typically thrown as generic `Error`
 *
 * ## Authentication
 *
 * Most methods accept a `token` parameter (Firebase ID token). The token is sent
 * as a `Bearer` token in the `Authorization` header. Public endpoints (health,
 * levels, boards, etc.) accept but do not require a token. User-specific endpoints
 * (subscriptions, gamification) require a valid token.
 *
 * ## Usage
 *
 * ```typescript
 * const client = new SudojoClient(networkClient, "https://api.sudojo.com");
 * const levels = await client.getLevels(token);
 * const daily = await client.getDailyByDate(token, "2024-01-15");
 * ```
 */
export class SudojoClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private networkClient: NetworkClient;
  private config: ReturnType<typeof createApiConfig>;

  /**
   * Create a SudojoClient instance.
   *
   * @param networkClient - Network client for making HTTP requests (from `@sudobility/types`)
   * @param baseUrl - Base URL for the Sudojo API (e.g., "https://api.sudojo.com")
   */
  constructor(networkClient: NetworkClient, baseUrl: string) {
    this.config = createApiConfig(baseUrl);
    this.baseUrl = this.config.BASE_URL;
    this.networkClient = networkClient;

    this.headers = {
      ...this.config.DEFAULT_HEADERS,
    };
  }

  // ===========================================================================
  // Private Request Method
  // ===========================================================================

  private async request<T>(
    endpoint: string,
    options: {
      method?: Optional<"GET" | "POST" | "PUT" | "DELETE">;
      body?: Optional<Record<string, unknown>>;
      headers?: Optional<Record<string, string>>;
      token?: Optional<string>;
      timeout?: Optional<number>;
    } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      ...this.headers,
      ...options.headers,
    };

    // Add authorization header if token is provided
    if (options.token) {
      requestHeaders["Authorization"] = `Bearer ${options.token}`;
    }

    const requestOptions: {
      method: "GET" | "POST" | "PUT" | "DELETE";
      headers: Record<string, string>;
      body?: string;
      timeout?: number;
    } = {
      method: options.method || "GET",
      headers: requestHeaders,
    };

    // Add body for POST/PUT/DELETE requests
    if (options.body && options.method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Add timeout if specified
    if (options.timeout) {
      requestOptions.timeout = options.timeout;
    }

    const response = await this.networkClient.request<T>(url, requestOptions);

    if (response.data === undefined) {
      throw new Error("No data received from server");
    }

    return (await decryptSolutionFields(response.data)) as T;
  }

  // ===========================================================================
  // Health Check
  // ===========================================================================

  async getHealth(): Promise<BaseResponse<HealthCheckData>> {
    return this.request<BaseResponse<HealthCheckData>>(
      this.config.ENDPOINTS.HEALTH,
    );
  }

  // ===========================================================================
  // Levels
  // ===========================================================================

  async getLevels(token: string): Promise<BaseResponse<Level[]>> {
    return this.request<BaseResponse<Level[]>>(this.config.ENDPOINTS.LEVELS, {
      token,
    });
  }

  async getLevel(token: string, level: number): Promise<BaseResponse<Level>> {
    if (level < 1 || level > 12) {
      throw new Error(`Invalid level: ${level}. Expected 1-12`);
    }
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(level),
      { token },
    );
  }

  async createLevel(
    token: string,
    data: LevelCreateRequest,
  ): Promise<BaseResponse<Level>> {
    return this.request<BaseResponse<Level>>(this.config.ENDPOINTS.LEVELS, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      token,
    });
  }

  async updateLevel(
    token: string,
    level: number,
    data: LevelUpdateRequest,
  ): Promise<BaseResponse<Level>> {
    if (level < 1 || level > 12) {
      throw new Error(`Invalid level: ${level}. Expected 1-12`);
    }
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(level),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteLevel(
    token: string,
    level: number,
  ): Promise<BaseResponse<Level>> {
    if (level < 1 || level > 12) {
      throw new Error(`Invalid level: ${level}. Expected 1-12`);
    }
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(level),
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Techniques
  // ===========================================================================

  async getTechniques(
    token: string,
    queryParams?: TechniqueQueryParams,
  ): Promise<BaseResponse<Technique[]>> {
    const params = createURLSearchParams();

    if (queryParams?.level !== undefined) {
      params.append("level", String(queryParams.level));
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.TECHNIQUES}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Technique[]>>(endpoint, { token });
  }

  async getTechnique(
    token: string,
    technique: number,
  ): Promise<BaseResponse<Technique>> {
    if (technique < 1) {
      throw new Error(`Invalid technique: ${technique}. Expected >= 1`);
    }
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(technique),
      { token },
    );
  }

  async createTechnique(
    token: string,
    data: TechniqueCreateRequest,
  ): Promise<BaseResponse<Technique>> {
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUES,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async updateTechnique(
    token: string,
    technique: number,
    data: TechniqueUpdateRequest,
  ): Promise<BaseResponse<Technique>> {
    if (technique < 1) {
      throw new Error(`Invalid technique: ${technique}. Expected >= 1`);
    }
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(technique),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteTechnique(
    token: string,
    technique: number,
  ): Promise<BaseResponse<Technique>> {
    if (technique < 1) {
      throw new Error(`Invalid technique: ${technique}. Expected >= 1`);
    }
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(technique),
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Learning
  // ===========================================================================

  async getLearning(
    token: string,
    queryParams?: LearningQueryParams,
  ): Promise<BaseResponse<Learning[]>> {
    const params = createURLSearchParams();

    if (queryParams?.technique !== undefined) {
      params.append("technique", String(queryParams.technique));
    }
    if (queryParams?.language_code) {
      params.append("language_code", queryParams.language_code);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.LEARNING}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Learning[]>>(endpoint, { token });
  }

  async getLearningItem(
    token: string,
    uuid: string,
  ): Promise<BaseResponse<Learning>> {
    const validatedUuid = validateUUID(uuid, "Learning UUID");
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING_ITEM(validatedUuid),
      { token },
    );
  }

  async createLearning(
    token: string,
    data: LearningCreateRequest,
  ): Promise<BaseResponse<Learning>> {
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async updateLearning(
    token: string,
    uuid: string,
    data: LearningUpdateRequest,
  ): Promise<BaseResponse<Learning>> {
    const validatedUuid = validateUUID(uuid, "Learning UUID");
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING_ITEM(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteLearning(
    token: string,
    uuid: string,
  ): Promise<BaseResponse<Learning>> {
    const validatedUuid = validateUUID(uuid, "Learning UUID");
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING_ITEM(validatedUuid),
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Boards
  // ===========================================================================

  async getBoards(
    token: string,
    queryParams?: BoardQueryParams,
  ): Promise<BaseResponse<Board[]>> {
    const params = createURLSearchParams();

    if (queryParams?.level !== undefined) {
      params.append("level", String(queryParams.level));
    }
    if (queryParams?.limit !== undefined) {
      params.append("limit", String(queryParams.limit));
    }
    if (queryParams?.offset !== undefined) {
      params.append("offset", String(queryParams.offset));
    }
    if (queryParams?.techniques !== undefined) {
      params.append("techniques", String(queryParams.techniques));
    }
    if (queryParams?.technique_bit !== undefined) {
      params.append("technique_bit", String(queryParams.technique_bit));
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.BOARDS}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Board[]>>(endpoint, { token });
  }

  async getRandomBoard(
    token: string,
    queryParams?: BoardQueryParams,
  ): Promise<BaseResponse<Board>> {
    const params = createURLSearchParams();

    if (queryParams?.level !== undefined) {
      params.append("level", String(queryParams.level));
    }

    if (queryParams?.symmetrical !== undefined) {
      params.append("symmetrical", String(queryParams.symmetrical));
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.BOARDS_RANDOM}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Board>>(endpoint, { token });
  }

  async getBoard(token: string, uuid: string): Promise<BaseResponse<Board>> {
    const validatedUuid = validateUUID(uuid, "Board UUID");
    return this.request<BaseResponse<Board>>(
      this.config.ENDPOINTS.BOARD(validatedUuid),
      { token },
    );
  }

  async createBoard(
    token: string,
    data: BoardCreateRequest,
  ): Promise<BaseResponse<Board>> {
    return this.request<BaseResponse<Board>>(this.config.ENDPOINTS.BOARDS, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      token,
    });
  }

  async updateBoard(
    token: string,
    uuid: string,
    data: BoardUpdateRequest,
  ): Promise<BaseResponse<Board>> {
    const validatedUuid = validateUUID(uuid, "Board UUID");
    return this.request<BaseResponse<Board>>(
      this.config.ENDPOINTS.BOARD(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteBoard(token: string, uuid: string): Promise<BaseResponse<Board>> {
    const validatedUuid = validateUUID(uuid, "Board UUID");
    return this.request<BaseResponse<Board>>(
      this.config.ENDPOINTS.BOARD(validatedUuid),
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Dailies
  // ===========================================================================

  async getDailies(token: string): Promise<BaseResponse<Daily[]>> {
    return this.request<BaseResponse<Daily[]>>(this.config.ENDPOINTS.DAILIES, {
      token,
    });
  }

  async getRandomDaily(token: string): Promise<BaseResponse<Daily>> {
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILIES_RANDOM,
      { token },
    );
  }

  async getTodayDaily(token: string): Promise<BaseResponse<Daily>> {
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILIES_TODAY,
      { token },
    );
  }

  async getDailyByDate(
    token: string,
    date: string,
  ): Promise<BaseResponse<Daily>> {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(
        `Invalid date format: "${date}". Expected YYYY-MM-DD format`,
      );
    }
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILIES_DATE(date),
      { token },
    );
  }

  async getDaily(token: string, uuid: string): Promise<BaseResponse<Daily>> {
    const validatedUuid = validateUUID(uuid, "Daily UUID");
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILY(validatedUuid),
      { token },
    );
  }

  async createDaily(
    token: string,
    data: DailyCreateRequest,
  ): Promise<BaseResponse<Daily>> {
    return this.request<BaseResponse<Daily>>(this.config.ENDPOINTS.DAILIES, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      token,
    });
  }

  async updateDaily(
    token: string,
    uuid: string,
    data: DailyUpdateRequest,
  ): Promise<BaseResponse<Daily>> {
    const validatedUuid = validateUUID(uuid, "Daily UUID");
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILY(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteDaily(token: string, uuid: string): Promise<BaseResponse<Daily>> {
    const validatedUuid = validateUUID(uuid, "Daily UUID");
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILY(validatedUuid),
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Challenges
  // ===========================================================================

  async getChallenges(
    token: string,
    queryParams?: ChallengeQueryParams,
  ): Promise<BaseResponse<Challenge[]>> {
    const params = createURLSearchParams();

    if (queryParams?.level !== undefined) {
      params.append("level", String(queryParams.level));
    }
    if (queryParams?.difficulty) {
      params.append("difficulty", queryParams.difficulty);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.CHALLENGES}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Challenge[]>>(endpoint, { token });
  }

  async getRandomChallenge(
    token: string,
    queryParams?: ChallengeQueryParams,
  ): Promise<BaseResponse<Challenge>> {
    const params = createURLSearchParams();

    if (queryParams?.level !== undefined) {
      params.append("level", String(queryParams.level));
    }
    if (queryParams?.difficulty) {
      params.append("difficulty", queryParams.difficulty);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.CHALLENGES_RANDOM}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Challenge>>(endpoint, { token });
  }

  async getChallenge(
    token: string,
    uuid: string,
  ): Promise<BaseResponse<Challenge>> {
    const validatedUuid = validateUUID(uuid, "Challenge UUID");
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGE(validatedUuid),
      { token },
    );
  }

  async createChallenge(
    token: string,
    data: ChallengeCreateRequest,
  ): Promise<BaseResponse<Challenge>> {
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGES,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async updateChallenge(
    token: string,
    uuid: string,
    data: ChallengeUpdateRequest,
  ): Promise<BaseResponse<Challenge>> {
    const validatedUuid = validateUUID(uuid, "Challenge UUID");
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGE(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteChallenge(
    token: string,
    uuid: string,
  ): Promise<BaseResponse<Challenge>> {
    const validatedUuid = validateUUID(uuid, "Challenge UUID");
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGE(validatedUuid),
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async getUser(
    token: string,
    userId: string,
  ): Promise<BaseResponse<UserInfoResponse>> {
    if (!userId || userId.length === 0 || userId.length > 128) {
      throw new Error(`Invalid userId: "${userId}". Expected 1-128 characters`);
    }
    return this.request<BaseResponse<UserInfoResponse>>(
      this.config.ENDPOINTS.USER(userId),
      {
        token,
      },
    );
  }

  async getUserSubscription(
    token: string,
    userId: string,
  ): Promise<BaseResponse<SubscriptionResult>> {
    if (!userId || userId.length === 0 || userId.length > 128) {
      throw new Error(`Invalid userId: "${userId}". Expected 1-128 characters`);
    }
    return this.request<BaseResponse<SubscriptionResult>>(
      this.config.ENDPOINTS.USER_SUBSCRIPTIONS(userId),
      {
        token,
      },
    );
  }

  // ===========================================================================
  // Practices
  // ===========================================================================

  /**
   * Get practice counts for all techniques
   */
  async getPracticeCounts(
    token: string,
  ): Promise<BaseResponse<TechniquePracticeCountItem[]>> {
    return this.request<BaseResponse<TechniquePracticeCountItem[]>>(
      this.config.ENDPOINTS.PRACTICES_COUNTS,
      { token },
    );
  }

  /**
   * Get a random practice for a specific technique
   */
  async getRandomPractice(
    token: string,
    technique: number,
  ): Promise<BaseResponse<TechniquePractice>> {
    if (technique < 1) {
      throw new Error(`Invalid technique: ${technique}. Expected >= 1`);
    }
    return this.request<BaseResponse<TechniquePractice>>(
      this.config.ENDPOINTS.PRACTICE_RANDOM(technique),
      { token },
    );
  }

  /**
   * Create a new practice (admin only)
   */
  async createPractice(
    token: string,
    data: TechniquePracticeCreateRequest,
  ): Promise<BaseResponse<TechniquePractice>> {
    return this.request<BaseResponse<TechniquePractice>>(
      this.config.ENDPOINTS.PRACTICES,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  /**
   * Delete all practices (admin only, requires confirm=true)
   */
  async deleteAllPractices(
    token: string,
  ): Promise<BaseResponse<{ deleted: number; message: string }>> {
    return this.request<BaseResponse<{ deleted: number; message: string }>>(
      `${this.config.ENDPOINTS.PRACTICES}?confirm=true`,
      {
        method: "DELETE",
        token,
      },
    );
  }

  // ===========================================================================
  // Examples
  // ===========================================================================

  /**
   * Get example counts for all techniques
   */
  async getExampleCounts(
    token: string,
  ): Promise<BaseResponse<ExampleCountsData>> {
    return this.request<BaseResponse<ExampleCountsData>>(
      this.config.ENDPOINTS.EXAMPLES_COUNTS,
      { token },
    );
  }

  /**
   * Get examples, optionally filtered by technique
   */
  async getExamples(
    token: string,
    queryParams?: TechniqueExampleQueryParams,
  ): Promise<BaseResponse<TechniqueExample[]>> {
    const params = createURLSearchParams();

    if (queryParams?.technique !== undefined) {
      params.append("technique", String(queryParams.technique));
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.EXAMPLES}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<TechniqueExample[]>>(endpoint, { token });
  }

  /**
   * Create a new example (admin only)
   */
  async createExample(
    token: string,
    data: TechniqueExampleCreateRequest,
  ): Promise<BaseResponse<TechniqueExample>> {
    return this.request<BaseResponse<TechniqueExample>>(
      this.config.ENDPOINTS.EXAMPLES,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  // ===========================================================================
  // Board Counts
  // ===========================================================================

  /**
   * Get board counts (total and without techniques)
   */
  async getBoardCounts(token: string): Promise<BaseResponse<BoardCountsData>> {
    return this.request<BaseResponse<BoardCountsData>>(
      this.config.ENDPOINTS.BOARDS_COUNTS,
      { token },
    );
  }

  /**
   * Get board counts by technique (count of boards with each technique bit set)
   * Returns Record<number, number> where key is technique ID and value is count
   */
  async getBoardCountsByTechnique(
    token: string,
  ): Promise<BaseResponse<Record<number, number>>> {
    return this.request<BaseResponse<Record<number, number>>>(
      this.config.ENDPOINTS.BOARDS_COUNTS_BY_TECHNIQUE,
      { token },
    );
  }

  // ===========================================================================
  // Solver
  // ===========================================================================

  /**
   * Builds an endpoint path with query parameters for solver endpoints
   */
  private buildSolverUrl(
    endpoint: string,
    params: Record<string, string | boolean | undefined>,
  ): string {
    const searchParams = createURLSearchParams();
    // Sort keys alphabetically to match Kotlin behavior
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      const value = params[key];
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    // Return endpoint + query only, baseUrl is added by request()
    return `${endpoint}${query ? `?${query}` : ""}`;
  }

  /**
   * Get hints for solving a Sudoku puzzle
   * @throws {HintAccessDeniedError} When hint level exceeds user's subscription tier
   */
  async solverSolve(
    token: string,
    options: SolveOptions,
  ): Promise<BaseResponse<SolveData>> {
    const url = this.buildSolverUrl(this.config.ENDPOINTS.SOLVER_SOLVE, {
      original: options.original,
      user: options.user,
      autopencilmarks: options.autoPencilmarks,
      pencilmarks: options.pencilmarks,
      filters: options.filters,
      techniques: options.techniques,
    });

    const fullUrl = `${this.baseUrl}${url}`;
    const requestHeaders: Record<string, string> = {
      ...this.headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Use 120 second timeout for solve (advanced techniques can be slow)
    const response = await this.networkClient.request<
      BaseResponse<SolveData> | HintAccessDeniedResponse
    >(fullUrl, {
      method: "GET",
      headers: requestHeaders,
      timeout: 120000,
    });

    // Check for hint access denied (402)
    if (response.status === 402 && response.data) {
      const errorResponse = response.data as HintAccessDeniedResponse;
      if (errorResponse.error?.code === "HINT_ACCESS_DENIED") {
        throw new HintAccessDeniedError(errorResponse.error);
      }
    }

    // Check for other errors
    if (!response.ok || response.data === undefined) {
      throw new Error("Failed to get hints from solver");
    }

    return (await decryptSolutionFields(
      response.data,
    )) as BaseResponse<SolveData>;
  }

  /**
   * Validate that a Sudoku puzzle has a unique solution.
   * Uses a longer timeout (120s) because validation involves iterative solving.
   */
  async solverValidate(
    token: string,
    options: ValidateOptions,
  ): Promise<BaseResponse<ValidateData>> {
    const url = this.buildSolverUrl(this.config.ENDPOINTS.SOLVER_VALIDATE, {
      original: options.original,
    });

    // Use 120 second timeout for validation (iterative solving can be slow)
    return this.request<BaseResponse<ValidateData>>(url, {
      token,
      timeout: 120000,
    });
  }

  /**
   * Generate a new random Sudoku puzzle
   */
  async solverGenerate(
    token: string,
    options: GenerateOptions = {},
  ): Promise<BaseResponse<GenerateData>> {
    const url = this.buildSolverUrl(this.config.ENDPOINTS.SOLVER_GENERATE, {
      symmetrical: options.symmetrical,
    });

    return this.request<BaseResponse<GenerateData>>(url, { token });
  }

  // ===========================================================================
  // Play (Game Session) Endpoints
  // ===========================================================================

  /**
   * Start a new game session
   */
  async playStart(
    token: string,
    data: GameStartRequest,
  ): Promise<BaseResponse<GameStartResponse>> {
    return this.request<BaseResponse<GameStartResponse>>(
      this.config.ENDPOINTS.PLAY_START,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  /**
   * Finish the current game session and get rewards
   */
  async playFinish(
    token: string,
    data: GameFinishRequest,
  ): Promise<BaseResponse<GameFinishResponse>> {
    return this.request<BaseResponse<GameFinishResponse>>(
      this.config.ENDPOINTS.PLAY_FINISH,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  // ===========================================================================
  // Gamification Endpoints
  // ===========================================================================

  /**
   * Get user's gamification stats (points, level, badges)
   */
  async getGamificationStats(
    token: string,
  ): Promise<BaseResponse<GamificationStats>> {
    return this.request<BaseResponse<GamificationStats>>(
      this.config.ENDPOINTS.GAMIFICATION_STATS,
      { token },
    );
  }

  /**
   * Get all badge definitions (public)
   */
  async getBadgeDefinitions(): Promise<BaseResponse<BadgeDefinition[]>> {
    return this.request<BaseResponse<BadgeDefinition[]>>(
      this.config.ENDPOINTS.GAMIFICATION_BADGES,
    );
  }

  /**
   * Get user's point transaction history
   */
  async getPointHistory(
    token: string,
    options?: { limit?: number; offset?: number },
  ): Promise<BaseResponse<PointTransaction[]>> {
    let endpoint = this.config.ENDPOINTS.GAMIFICATION_HISTORY;
    if (options?.limit || options?.offset) {
      const params = createURLSearchParams();
      if (options.limit) params.append("limit", String(options.limit));
      if (options.offset) params.append("offset", String(options.offset));
      endpoint = `${endpoint}?${params.toString()}`;
    }
    return this.request<BaseResponse<PointTransaction[]>>(endpoint, { token });
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Factory function to create a new SudojoClient instance.
 *
 * Equivalent to `new SudojoClient(networkClient, baseUrl)` but useful
 * for dependency injection and functional composition patterns.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL for the Sudojo API
 * @returns A new SudojoClient instance
 */
export const createSudojoClient = (
  networkClient: NetworkClient,
  baseUrl: string,
): SudojoClient => {
  return new SudojoClient(networkClient, baseUrl);
};

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Re-exported UUID validation utilities from `@sudobility/sudojo_types`.
 *
 * These are used internally by the SudojoClient for parameter validation
 * and are also exported for consumer convenience. Use `isValidUUID` for
 * boolean checks and `validateUUID` when you want an error thrown on invalid input.
 *
 * - `isValidUUID(value)` - Returns true if the string is a valid UUID v4
 * - `validateUUID(value, label)` - Returns the UUID or throws an Error with the label
 */
export { isValidUUID, validateUUID };
