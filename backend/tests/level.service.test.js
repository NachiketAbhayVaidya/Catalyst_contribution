import { describe, expect, test } from "@jest/globals";
import { LevelService } from "../src/services/gamification/level.service.js";

describe("LevelService", () => {
  test("calculates level 1 at 0 xp", () => {
    expect(LevelService.calculateLevel(0)).toBe(1);
  });

  test("calculates the correct level at exact thresholds", () => {
    expect(LevelService.calculateLevel(250)).toBe(2);
    expect(LevelService.calculateLevel(500)).toBe(3);
    expect(LevelService.calculateLevel(1000)).toBe(4);
  });

  test("stays at the highest matching level between thresholds", () => {
    expect(LevelService.calculateLevel(1499)).toBe(4);
    expect(LevelService.calculateLevel(1500)).toBe(5);
  });

  test("returns the next threshold to reach", () => {
    const next = LevelService.getNextThreshold(300);
    expect(next.level).toBe(3);
    expect(next.minXp).toBe(500);
  });

  test("returns null when already at the max configured level", () => {
    expect(LevelService.getNextThreshold(999999)).toBeNull();
  });
});
