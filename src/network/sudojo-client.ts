import type { NetworkClient } from "@sudobility/types";
import type {
  BaseResponse,
  Board,
  BoardCreateRequest,
  BoardQueryParams,
  BoardUpdateRequest,
  Challenge,
  ChallengeCreateRequest,
  ChallengeQueryParams,
  ChallengeUpdateRequest,
  Daily,
  DailyCreateRequest,
  DailyUpdateRequest,
  GenerateData,
  HealthCheckData,
  Learning,
  LearningCreateRequest,
  LearningQueryParams,
  LearningUpdateRequest,
  Level,
  LevelCreateRequest,
  LevelUpdateRequest,
  Optional,
  SolveData,
  SubscriptionResult,
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
  ValidateData,
} from "@sudobility/sudojo_types";

// =============================================================================
// Solver Option Types
// =============================================================================

/**
 * Options for the solve API call
 */
export interface SolveOptions {
  /** 81-character puzzle string */
  original: string;
  /** 81-character user input string */
  user: string;
  /** Whether auto-pencilmarks are enabled */
  autoPencilmarks?: boolean;
  /** Comma-separated pencilmarks string */
  pencilmarks?: string;
  /** Optional technique filters */
  filters?: string;
}

/**
 * Options for the validate API call
 */
export interface ValidateOptions {
  /** 81-character puzzle string */
  original: string;
}

/**
 * Options for the generate API call
 */
export interface GenerateOptions {
  /** Whether to generate a symmetrical puzzle */
  symmetrical?: boolean;
}

// =============================================================================
// URL Search Params Utility
// =============================================================================

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
// UUID Validation
// =============================================================================

const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
};

const validateUUID = (uuid: string, name: string = "UUID"): string => {
  if (!uuid) {
    throw new Error(`${name} is required`);
  }
  if (!isValidUUID(uuid)) {
    throw new Error(
      `Invalid ${name} format: "${uuid}". Expected UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`,
    );
  }
  return uuid;
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
    LEVEL: (uuid: string) => `/api/v1/levels/${uuid}`,

    // Techniques
    TECHNIQUES: "/api/v1/techniques",
    TECHNIQUE: (uuid: string) => `/api/v1/techniques/${uuid}`,

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
    USER_SUBSCRIPTIONS: (userId: string) =>
      `/api/v1/users/${userId}/subscriptions`,

    // Solver
    SOLVER_SOLVE: "/api/v1/solver/solve",
    SOLVER_VALIDATE: "/api/v1/solver/validate",
    SOLVER_GENERATE: "/api/v1/solver/generate",
  },
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =============================================================================
// Sudojo Client Class
// =============================================================================

export class SudojoClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private networkClient: NetworkClient;
  private config: ReturnType<typeof createApiConfig>;

  /**
   * Create a SudojoClient
   * @param networkClient - Network client for making requests
   * @param baseUrl - Base URL for API requests
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
    } = {
      method: options.method || "GET",
      headers: requestHeaders,
    };

    // Add body for POST/PUT/DELETE requests
    if (options.body && options.method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }

    const response = await this.networkClient.request<T>(url, requestOptions);

    if (response.data === undefined) {
      throw new Error("No data received from server");
    }

    return response.data as T;
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

  async getLevel(token: string, uuid: string): Promise<BaseResponse<Level>> {
    const validatedUuid = validateUUID(uuid, "Level UUID");
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(validatedUuid),
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
    uuid: string,
    data: LevelUpdateRequest,
  ): Promise<BaseResponse<Level>> {
    const validatedUuid = validateUUID(uuid, "Level UUID");
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteLevel(token: string, uuid: string): Promise<BaseResponse<Level>> {
    const validatedUuid = validateUUID(uuid, "Level UUID");
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(validatedUuid),
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

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.TECHNIQUES}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Technique[]>>(endpoint, { token });
  }

  async getTechnique(
    token: string,
    uuid: string,
  ): Promise<BaseResponse<Technique>> {
    const validatedUuid = validateUUID(uuid, "Technique UUID");
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(validatedUuid),
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
    uuid: string,
    data: TechniqueUpdateRequest,
  ): Promise<BaseResponse<Technique>> {
    const validatedUuid = validateUUID(uuid, "Technique UUID");
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        token,
      },
    );
  }

  async deleteTechnique(
    token: string,
    uuid: string,
  ): Promise<BaseResponse<Technique>> {
    const validatedUuid = validateUUID(uuid, "Technique UUID");
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(validatedUuid),
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

    if (queryParams?.technique_uuid) {
      params.append("technique_uuid", queryParams.technique_uuid);
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

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
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

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
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

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
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

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
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
    });

    return this.request<BaseResponse<SolveData>>(url, { token });
  }

  /**
   * Validate that a Sudoku puzzle has a unique solution
   */
  async solverValidate(
    token: string,
    options: ValidateOptions,
  ): Promise<BaseResponse<ValidateData>> {
    const url = this.buildSolverUrl(this.config.ENDPOINTS.SOLVER_VALIDATE, {
      original: options.original,
    });

    return this.request<BaseResponse<ValidateData>>(url, { token });
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
}

// =============================================================================
// Factory Function
// =============================================================================

export const createSudojoClient = (
  networkClient: NetworkClient,
  baseUrl: string,
): SudojoClient => {
  return new SudojoClient(networkClient, baseUrl);
};

// =============================================================================
// Utility Exports
// =============================================================================

export { isValidUUID, validateUUID };
