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
  HealthCheckData,
  Learning,
  LearningCreateRequest,
  LearningQueryParams,
  LearningUpdateRequest,
  Level,
  LevelCreateRequest,
  LevelUpdateRequest,
  Optional,
  SubscriptionResult,
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
} from "@sudobility/sudojo_types";

// =============================================================================
// Configuration Types
// =============================================================================

export interface SudojoConfig {
  baseUrl: string;
  apiToken?: Optional<string>;
}

export interface SudojoAuth {
  accessToken: string;
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
              `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
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

const createApiConfig = (config: SudojoConfig) => ({
  BASE_URL: config.baseUrl,
  API_TOKEN: config.apiToken,
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

  constructor(networkClient: NetworkClient, config: SudojoConfig) {
    this.config = createApiConfig(config);
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
      auth?: Optional<SudojoAuth>;
    } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      ...this.headers,
      ...options.headers,
    };

    // Add authorization header if auth is provided
    if (options.auth?.accessToken) {
      requestHeaders["Authorization"] = `Bearer ${options.auth.accessToken}`;
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

  async getLevels(): Promise<BaseResponse<Level[]>> {
    return this.request<BaseResponse<Level[]>>(this.config.ENDPOINTS.LEVELS);
  }

  async getLevel(uuid: string): Promise<BaseResponse<Level>> {
    const validatedUuid = validateUUID(uuid, "Level UUID");
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(validatedUuid),
    );
  }

  async createLevel(
    auth: SudojoAuth,
    data: LevelCreateRequest,
  ): Promise<BaseResponse<Level>> {
    return this.request<BaseResponse<Level>>(this.config.ENDPOINTS.LEVELS, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      auth,
    });
  }

  async updateLevel(
    auth: SudojoAuth,
    uuid: string,
    data: LevelUpdateRequest,
  ): Promise<BaseResponse<Level>> {
    const validatedUuid = validateUUID(uuid, "Level UUID");
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async deleteLevel(
    auth: SudojoAuth,
    uuid: string,
  ): Promise<BaseResponse<Level>> {
    const validatedUuid = validateUUID(uuid, "Level UUID");
    return this.request<BaseResponse<Level>>(
      this.config.ENDPOINTS.LEVEL(validatedUuid),
      {
        method: "DELETE",
        auth,
      },
    );
  }

  // ===========================================================================
  // Techniques
  // ===========================================================================

  async getTechniques(
    queryParams?: TechniqueQueryParams,
  ): Promise<BaseResponse<Technique[]>> {
    const params = createURLSearchParams();

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.TECHNIQUES}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Technique[]>>(endpoint);
  }

  async getTechnique(uuid: string): Promise<BaseResponse<Technique>> {
    const validatedUuid = validateUUID(uuid, "Technique UUID");
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(validatedUuid),
    );
  }

  async createTechnique(
    auth: SudojoAuth,
    data: TechniqueCreateRequest,
  ): Promise<BaseResponse<Technique>> {
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUES,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async updateTechnique(
    auth: SudojoAuth,
    uuid: string,
    data: TechniqueUpdateRequest,
  ): Promise<BaseResponse<Technique>> {
    const validatedUuid = validateUUID(uuid, "Technique UUID");
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async deleteTechnique(
    auth: SudojoAuth,
    uuid: string,
  ): Promise<BaseResponse<Technique>> {
    const validatedUuid = validateUUID(uuid, "Technique UUID");
    return this.request<BaseResponse<Technique>>(
      this.config.ENDPOINTS.TECHNIQUE(validatedUuid),
      {
        method: "DELETE",
        auth,
      },
    );
  }

  // ===========================================================================
  // Learning
  // ===========================================================================

  async getLearning(
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

    return this.request<BaseResponse<Learning[]>>(endpoint);
  }

  async getLearningItem(uuid: string): Promise<BaseResponse<Learning>> {
    const validatedUuid = validateUUID(uuid, "Learning UUID");
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING_ITEM(validatedUuid),
    );
  }

  async createLearning(
    auth: SudojoAuth,
    data: LearningCreateRequest,
  ): Promise<BaseResponse<Learning>> {
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async updateLearning(
    auth: SudojoAuth,
    uuid: string,
    data: LearningUpdateRequest,
  ): Promise<BaseResponse<Learning>> {
    const validatedUuid = validateUUID(uuid, "Learning UUID");
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING_ITEM(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async deleteLearning(
    auth: SudojoAuth,
    uuid: string,
  ): Promise<BaseResponse<Learning>> {
    const validatedUuid = validateUUID(uuid, "Learning UUID");
    return this.request<BaseResponse<Learning>>(
      this.config.ENDPOINTS.LEARNING_ITEM(validatedUuid),
      {
        method: "DELETE",
        auth,
      },
    );
  }

  // ===========================================================================
  // Boards
  // ===========================================================================

  async getBoards(
    queryParams?: BoardQueryParams,
  ): Promise<BaseResponse<Board[]>> {
    const params = createURLSearchParams();

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.BOARDS}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Board[]>>(endpoint);
  }

  async getRandomBoard(
    queryParams?: BoardQueryParams,
  ): Promise<BaseResponse<Board>> {
    const params = createURLSearchParams();

    if (queryParams?.level_uuid) {
      params.append("level_uuid", queryParams.level_uuid);
    }

    const query = params.toString();
    const endpoint = `${this.config.ENDPOINTS.BOARDS_RANDOM}${query ? `?${query}` : ""}`;

    return this.request<BaseResponse<Board>>(endpoint);
  }

  async getBoard(uuid: string): Promise<BaseResponse<Board>> {
    const validatedUuid = validateUUID(uuid, "Board UUID");
    return this.request<BaseResponse<Board>>(
      this.config.ENDPOINTS.BOARD(validatedUuid),
    );
  }

  async createBoard(
    auth: SudojoAuth,
    data: BoardCreateRequest,
  ): Promise<BaseResponse<Board>> {
    return this.request<BaseResponse<Board>>(this.config.ENDPOINTS.BOARDS, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      auth,
    });
  }

  async updateBoard(
    auth: SudojoAuth,
    uuid: string,
    data: BoardUpdateRequest,
  ): Promise<BaseResponse<Board>> {
    const validatedUuid = validateUUID(uuid, "Board UUID");
    return this.request<BaseResponse<Board>>(
      this.config.ENDPOINTS.BOARD(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async deleteBoard(
    auth: SudojoAuth,
    uuid: string,
  ): Promise<BaseResponse<Board>> {
    const validatedUuid = validateUUID(uuid, "Board UUID");
    return this.request<BaseResponse<Board>>(
      this.config.ENDPOINTS.BOARD(validatedUuid),
      {
        method: "DELETE",
        auth,
      },
    );
  }

  // ===========================================================================
  // Dailies
  // ===========================================================================

  async getDailies(): Promise<BaseResponse<Daily[]>> {
    return this.request<BaseResponse<Daily[]>>(this.config.ENDPOINTS.DAILIES);
  }

  async getRandomDaily(): Promise<BaseResponse<Daily>> {
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILIES_RANDOM,
    );
  }

  async getTodayDaily(): Promise<BaseResponse<Daily>> {
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILIES_TODAY,
    );
  }

  async getDailyByDate(date: string): Promise<BaseResponse<Daily>> {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(
        `Invalid date format: "${date}". Expected YYYY-MM-DD format`,
      );
    }
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILIES_DATE(date),
    );
  }

  async getDaily(uuid: string): Promise<BaseResponse<Daily>> {
    const validatedUuid = validateUUID(uuid, "Daily UUID");
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILY(validatedUuid),
    );
  }

  async createDaily(
    auth: SudojoAuth,
    data: DailyCreateRequest,
  ): Promise<BaseResponse<Daily>> {
    return this.request<BaseResponse<Daily>>(this.config.ENDPOINTS.DAILIES, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
      auth,
    });
  }

  async updateDaily(
    auth: SudojoAuth,
    uuid: string,
    data: DailyUpdateRequest,
  ): Promise<BaseResponse<Daily>> {
    const validatedUuid = validateUUID(uuid, "Daily UUID");
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILY(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async deleteDaily(
    auth: SudojoAuth,
    uuid: string,
  ): Promise<BaseResponse<Daily>> {
    const validatedUuid = validateUUID(uuid, "Daily UUID");
    return this.request<BaseResponse<Daily>>(
      this.config.ENDPOINTS.DAILY(validatedUuid),
      {
        method: "DELETE",
        auth,
      },
    );
  }

  // ===========================================================================
  // Challenges
  // ===========================================================================

  async getChallenges(
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

    return this.request<BaseResponse<Challenge[]>>(endpoint);
  }

  async getRandomChallenge(
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

    return this.request<BaseResponse<Challenge>>(endpoint);
  }

  async getChallenge(uuid: string): Promise<BaseResponse<Challenge>> {
    const validatedUuid = validateUUID(uuid, "Challenge UUID");
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGE(validatedUuid),
    );
  }

  async createChallenge(
    auth: SudojoAuth,
    data: ChallengeCreateRequest,
  ): Promise<BaseResponse<Challenge>> {
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGES,
      {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async updateChallenge(
    auth: SudojoAuth,
    uuid: string,
    data: ChallengeUpdateRequest,
  ): Promise<BaseResponse<Challenge>> {
    const validatedUuid = validateUUID(uuid, "Challenge UUID");
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGE(validatedUuid),
      {
        method: "PUT",
        body: data as unknown as Record<string, unknown>,
        auth,
      },
    );
  }

  async deleteChallenge(
    auth: SudojoAuth,
    uuid: string,
  ): Promise<BaseResponse<Challenge>> {
    const validatedUuid = validateUUID(uuid, "Challenge UUID");
    return this.request<BaseResponse<Challenge>>(
      this.config.ENDPOINTS.CHALLENGE(validatedUuid),
      {
        method: "DELETE",
        auth,
      },
    );
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async getUserSubscription(
    auth: SudojoAuth,
    userId: string,
  ): Promise<BaseResponse<SubscriptionResult>> {
    if (!userId || userId.length === 0 || userId.length > 128) {
      throw new Error(`Invalid userId: "${userId}". Expected 1-128 characters`);
    }
    return this.request<BaseResponse<SubscriptionResult>>(
      this.config.ENDPOINTS.USER_SUBSCRIPTIONS(userId),
      {
        auth,
      },
    );
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export const createSudojoClient = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): SudojoClient => {
  return new SudojoClient(networkClient, config);
};

// =============================================================================
// Utility Exports
// =============================================================================

export { isValidUUID, validateUUID };
