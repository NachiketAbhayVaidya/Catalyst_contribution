import { levelForXp, nextLevelThreshold } from "../../config/levels.config.js";

export const LevelService = {
  calculateLevel(xp) {
    return levelForXp(xp);
  },
  getNextThreshold(xp) {
    return nextLevelThreshold(xp);
  },
};
