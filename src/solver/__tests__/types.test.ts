import { describe, it, expect } from "vitest";
import type {
  ClientConfig,
  GenerateOptions,
  SolverAreaType,
  SolverBoard,
  SolverCellActions,
  SolverColor,
  SolverHintArea,
  SolverHintCell,
  SolverHintStep,
  SolverPencilmarks,
  SolveOptions,
  ValidateOptions,
} from "../types";

describe("Types", () => {
  describe("SolverAreaType", () => {
    it("should accept valid area types", () => {
      const row: SolverAreaType = "row";
      const column: SolverAreaType = "column";
      const block: SolverAreaType = "block";

      expect(row).toBe("row");
      expect(column).toBe("column");
      expect(block).toBe("block");
    });
  });

  describe("SolverColor", () => {
    it("should accept valid colors", () => {
      const colors: SolverColor[] = [
        "none",
        "clear",
        "gray",
        "blue",
        "green",
        "yellow",
        "orange",
        "red",
        "white",
        "black",
      ];

      expect(colors).toHaveLength(10);
    });
  });

  describe("SolverHintArea", () => {
    it("should allow creating valid SolverHintArea objects", () => {
      const area: SolverHintArea = {
        type: "row",
        color: "blue",
        index: 0,
      };

      expect(area.type).toBe("row");
      expect(area.color).toBe("blue");
      expect(area.index).toBe(0);
    });
  });

  describe("SolverCellActions", () => {
    it("should allow creating valid SolverCellActions objects", () => {
      const actions: SolverCellActions = {
        select: "5",
        unselect: "",
        add: "123",
        remove: "456",
        highlight: "789",
      };

      expect(actions.select).toBe("5");
      expect(actions.add).toBe("123");
    });
  });

  describe("SolverHintCell", () => {
    it("should allow creating valid SolverHintCell objects", () => {
      const cell: SolverHintCell = {
        row: 0,
        column: 5,
        color: "green",
        fill: true,
        actions: {
          select: "5",
          unselect: "",
          add: "",
          remove: "",
          highlight: "",
        },
      };

      expect(cell.row).toBe(0);
      expect(cell.column).toBe(5);
      expect(cell.fill).toBe(true);
    });
  });

  describe("SolverPencilmarks", () => {
    it("should allow creating valid SolverPencilmarks objects", () => {
      const pencilmark: SolverPencilmarks = {
        auto: true,
        pencilmarks: "123,456,789",
      };

      expect(pencilmark.auto).toBe(true);
      expect(pencilmark.pencilmarks).toBe("123,456,789");
    });
  });

  describe("SolverBoard", () => {
    it("should allow creating valid SolverBoard objects", () => {
      const board: SolverBoard = {
        original:
          "040002008100400000080000140070105000508000602000209030069000070000006004700500090",
        user: null,
        solution:
          "345672918126489753789351246237145869518763492694298137462918375951836724873524691",
        pencilmarks: null,
      };

      expect(board.original).toHaveLength(81);
      expect(board.solution).toHaveLength(81);
      expect(board.user).toBeNull();
    });

    it("should allow pencilmarks to be set", () => {
      const board: SolverBoard = {
        original:
          "040002008100400000080000140070105000508000602000209030069000070000006004700500090",
        user: "000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        solution: null,
        pencilmarks: {
          auto: true,
          pencilmarks: "123,,,,,,,,,",
        },
      };

      expect(board.pencilmarks?.auto).toBe(true);
    });
  });

  describe("SolverHintStep", () => {
    it("should allow creating valid SolverHintStep objects", () => {
      const step: SolverHintStep = {
        title: "Hidden Single",
        text: "The number 5 can only go in one place in row 1",
        areas: [{ type: "row", color: "blue", index: 0 }],
        cells: [
          {
            row: 0,
            column: 5,
            color: "green",
            fill: false,
            actions: {
              select: "5",
              unselect: "",
              add: "",
              remove: "",
              highlight: "",
            },
          },
        ],
      };

      expect(step.title).toBe("Hidden Single");
      expect(step.areas).toHaveLength(1);
      expect(step.cells).toHaveLength(1);
    });
  });

  describe("SolveOptions", () => {
    it("should require original and user", () => {
      const options: SolveOptions = {
        original:
          "040002008100400000080000140070105000508000602000209030069000070000006004700500090",
        user: "000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      };

      expect(options.original).toHaveLength(81);
      expect(options.user).toHaveLength(81);
    });

    it("should allow optional parameters", () => {
      const options: SolveOptions = {
        original:
          "040002008100400000080000140070105000508000602000209030069000070000006004700500090",
        user: "000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        autoPencilmarks: true,
        pencilmarks: "123,456,789",
        filters: "test",
      };

      expect(options.autoPencilmarks).toBe(true);
      expect(options.pencilmarks).toBe("123,456,789");
      expect(options.filters).toBe("test");
    });
  });

  describe("ValidateOptions", () => {
    it("should require original", () => {
      const options: ValidateOptions = {
        original:
          "040002008100400000080000140070105000508000602000209030069000070000006004700500090",
      };

      expect(options.original).toHaveLength(81);
    });
  });

  describe("GenerateOptions", () => {
    it("should allow empty options", () => {
      const options: GenerateOptions = {};

      expect(options.symmetrical).toBeUndefined();
    });

    it("should allow symmetrical option", () => {
      const options: GenerateOptions = {
        symmetrical: true,
      };

      expect(options.symmetrical).toBe(true);
    });
  });

  describe("ClientConfig", () => {
    it("should require baseUrl", () => {
      const config: ClientConfig = {
        baseUrl: "http://localhost:5000",
      };

      expect(config.baseUrl).toBe("http://localhost:5000");
    });

    it("should allow optional timeout", () => {
      const config: ClientConfig = {
        baseUrl: "http://localhost:5000",
        timeout: 5000,
      };

      expect(config.timeout).toBe(5000);
    });
  });
});
