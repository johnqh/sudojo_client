import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockNetworkClient } from "@sudobility/di/mocks";
import { SudojoClient } from "../sudojo-client";

const TEST_TOKEN = "test-token-123";
const BASE_URL = "https://test-sudojo.example.com";
const VALID_UUID = "12345678-1234-1234-1234-123456789abc";

describe("SudojoClient", () => {
  let client: SudojoClient;
  let mockNetworkClient: MockNetworkClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    client = new SudojoClient(mockNetworkClient, BASE_URL);
  });

  afterEach(() => {
    mockNetworkClient.reset();
  });

  describe("initialization", () => {
    it("should create instance successfully", () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(SudojoClient);
    });

    it("should initialize with different base URL", () => {
      const clientWithDifferentUrl = new SudojoClient(
        mockNetworkClient,
        "https://different.example.com",
      );
      expect(clientWithDifferentUrl).toBeDefined();
      expect(clientWithDifferentUrl).toBeInstanceOf(SudojoClient);
    });
  });

  describe("health check", () => {
    it("should get health status successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          name: "sudojo_api",
          version: "1.0.0",
          status: "ok",
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getHealth();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe("ok");
      expect(mockNetworkClient.wasUrlCalled(`${BASE_URL}/`)).toBe(true);
    });
  });

  describe("levels", () => {
    it("should get all levels successfully", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            index: 1,
            title: "Beginner",
            text: "Basic techniques",
            requires_subscription: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/levels`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLevels(TEST_TOKEN);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.title).toBe("Beginner");
      expect(
        mockNetworkClient.wasUrlCalled(`${BASE_URL}/api/v1/levels`),
      ).toBe(true);
    });

    it("should get a specific level by UUID", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Beginner",
          text: "Basic techniques",
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLevel(TEST_TOKEN, VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.data?.uuid).toBe(VALID_UUID);
    });

    it("should create a level with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 5,
          title: "New Level",
          text: null,
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/levels`,
        { data: mockResponse },
        "POST",
      );

      const result = await client.createLevel(TEST_TOKEN, {
        index: 5,
        title: "New Level",
        text: null,
        requires_subscription: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("New Level");
      expect(
        mockNetworkClient.wasUrlCalled(`${BASE_URL}/api/v1/levels`, "POST"),
      ).toBe(true);
    });

    it("should update a level with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Updated Level",
          text: "Updated description",
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "PUT",
      );

      const result = await client.updateLevel(TEST_TOKEN, VALID_UUID, {
        title: "Updated Level",
        text: "Updated description",
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Updated Level");
    });

    it("should delete a level with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Deleted Level",
          text: null,
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "DELETE",
      );

      const result = await client.deleteLevel(TEST_TOKEN, VALID_UUID);

      expect(result.success).toBe(true);
    });
  });

  describe("techniques", () => {
    it("should get all techniques", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            level_uuid: null,
            index: 1,
            title: "Hidden Singles",
            text: "Basic technique",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/techniques`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getTechniques(TEST_TOKEN);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should filter techniques by level_uuid", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/techniques?level_uuid=${VALID_UUID}`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getTechniques(TEST_TOKEN, {
        level_uuid: VALID_UUID,
      });

      expect(result.success).toBe(true);
    });

    it("should create a technique", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          index: 1,
          title: "New Technique",
          text: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/techniques`,
        { data: mockResponse },
        "POST",
      );

      const result = await client.createTechnique(TEST_TOKEN, {
        level_uuid: VALID_UUID,
        index: 1,
        title: "New Technique",
        text: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("New Technique");
    });
  });

  describe("learning", () => {
    it("should get all learning entries", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            technique_uuid: VALID_UUID,
            index: 1,
            language_code: "en",
            text: "Learn this",
            image_url: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/learning`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLearning(TEST_TOKEN);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should filter learning by technique_uuid and language", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/learning?technique_uuid=${VALID_UUID}&language_code=en`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLearning(TEST_TOKEN, {
        technique_uuid: VALID_UUID,
        language_code: "en",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("boards", () => {
    it("should get all boards", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            original: "0".repeat(81),
            solution: "1".repeat(81),
            difficulty: 3,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/boards`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getBoards(TEST_TOKEN);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should get a random board", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          original: "0".repeat(81),
          solution: "1".repeat(81),
          difficulty: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/boards/random`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomBoard(TEST_TOKEN);

      expect(result.success).toBe(true);
      expect(result.data?.uuid).toBe(VALID_UUID);
    });

    it("should create a board", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          original: "0".repeat(81),
          solution: "1".repeat(81),
          difficulty: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/boards`,
        { data: mockResponse },
        "POST",
      );

      const result = await client.createBoard(TEST_TOKEN, {
        original: "0".repeat(81),
        solution: "1".repeat(81),
        difficulty: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data?.difficulty).toBe(5);
    });
  });

  describe("dailies", () => {
    it("should get all dailies", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            board_uuid: VALID_UUID,
            date: "2025-01-15",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/dailies`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getDailies(TEST_TOKEN);

      expect(result.success).toBe(true);
    });

    it("should get a random daily", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          board_uuid: VALID_UUID,
          date: "2025-01-15",
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/dailies/random`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomDaily(TEST_TOKEN);

      expect(result.success).toBe(true);
    });

    it("should get today's daily", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          board_uuid: VALID_UUID,
          date: "2025-01-15",
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/dailies/today`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getTodayDaily(TEST_TOKEN);

      expect(result.success).toBe(true);
    });

    it("should get daily by date", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          board_uuid: VALID_UUID,
          date: "2025-01-15",
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/dailies/date/2025-01-15`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getDailyByDate(TEST_TOKEN, "2025-01-15");

      expect(result.success).toBe(true);
    });
  });

  describe("challenges", () => {
    it("should get all challenges", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            difficulty: 3,
            board_uuid: null,
            level_uuid: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/challenges`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getChallenges(TEST_TOKEN);

      expect(result.success).toBe(true);
    });

    it("should filter challenges by level_uuid and difficulty", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/challenges?level_uuid=${VALID_UUID}&difficulty=5`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getChallenges(TEST_TOKEN, {
        level_uuid: VALID_UUID,
        difficulty: "5",
      });

      expect(result.success).toBe(true);
    });

    it("should get a random challenge", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          difficulty: 3,
          board_uuid: null,
          level_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/challenges/random`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomChallenge(TEST_TOKEN);

      expect(result.success).toBe(true);
    });

    it("should create a challenge", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          difficulty: 3,
          board_uuid: null,
          level_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/challenges`,
        { data: mockResponse },
        "POST",
      );

      const result = await client.createChallenge(TEST_TOKEN, {
        difficulty: 3,
        board_uuid: null,
        level_uuid: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("users", () => {
    it("should get user subscription with authentication", async () => {
      const userId = "user-123";
      const mockResponse = {
        success: true,
        data: {
          hasSubscription: true,
          entitlements: [{ identifier: "premium", isActive: true }],
          subscriptionStartedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/users/${userId}/subscriptions`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getUserSubscription(TEST_TOKEN, userId);

      expect(result.success).toBe(true);
      expect(result.data?.hasSubscription).toBe(true);
    });

    it("should get user subscription without active subscription", async () => {
      const userId = "user-456";
      const mockResponse = {
        success: true,
        data: {
          hasSubscription: false,
          entitlements: [],
          subscriptionStartedAt: null,
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${BASE_URL}/api/v1/users/${userId}/subscriptions`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getUserSubscription(TEST_TOKEN, userId);

      expect(result.success).toBe(true);
      expect(result.data?.hasSubscription).toBe(false);
    });
  });
});
