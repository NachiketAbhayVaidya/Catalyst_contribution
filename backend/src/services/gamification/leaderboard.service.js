import { Student } from "../../models/student.model.js";
import { Team } from "../../models/team.model.js";
import { LeaderboardSnapshot } from "../../models/leaderboardSnapshot.model.js";

// Phase 1: all_time individual/team leaderboards, rebuilt on demand from live
// XP totals. Weekly/monthly windows (requiring time-bounded XP aggregation
// off XPTransaction) are wired in Phase 4.
export const LeaderboardService = {
  async rebuildAllTimeIndividual(limit = 100) {
    const students = await Student.find({}).sort({ xp: -1 }).limit(limit).select("xp");

    const entries = students.map((s, index) => ({
      student: s._id,
      xp: s.xp,
      rank: index + 1,
    }));

    return LeaderboardSnapshot.findOneAndUpdate(
      { scope: "individual", period: "all_time" },
      { entries, generatedAt: new Date() },
      { upsert: true, returnDocument: "after" },
    );
  },

  async rebuildAllTimeTeam(limit = 50) {
    const teams = await Team.find({ archivedAt: null }).sort({ xp: -1 }).limit(limit).select("xp");

    const entries = teams.map((t, index) => ({
      team: t._id,
      xp: t.xp,
      rank: index + 1,
    }));

    return LeaderboardSnapshot.findOneAndUpdate(
      { scope: "team", period: "all_time" },
      { entries, generatedAt: new Date() },
      { upsert: true, returnDocument: "after" },
    );
  },

  async updateLeaderboard() {
    const [individual, team] = await Promise.all([
      this.rebuildAllTimeIndividual(),
      this.rebuildAllTimeTeam(),
    ]);
    return { individual, team };
  },
};
