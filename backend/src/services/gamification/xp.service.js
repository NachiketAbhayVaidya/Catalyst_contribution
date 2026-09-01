import mongoose from "mongoose";
import { Student } from "../../models/student.model.js";
import { XPTransaction } from "../../models/xpTransaction.model.js";
import { ApiError } from "../../utils/apierror.js";
import { LevelService } from "./level.service.js";

// Idempotency is the CALLER's responsibility (e.g. ActivityEnrollment.xpAwarded,
// QuizAttempt.xpAwarded, MissionProgress.xpAwarded) — this service just records
// the ledger entry and updates the running total atomically. Never call this
// twice for the same completion.
export const XPService = {
  /**
   * @param {string} studentId
   * @param {{ amount: number, reason: string, source: string, activityId?: string|null,
   *           adminOverride?: { isOverride: boolean, admin: string, note?: string },
   *           session?: import("mongoose").ClientSession }} params
   */
  async awardXP(studentId, { amount, reason, source, activityId = null, adminOverride, session }) {
    if (!Number.isFinite(amount) || amount === 0) {
      throw new ApiError(400, "XP amount must be a non-zero number");
    }

    const ownSession = !session;
    const dbSession = session ?? (await mongoose.startSession());

    try {
      if (ownSession) dbSession.startTransaction();

      const [transaction] = await XPTransaction.create(
        [
          {
            student: studentId,
            amount,
            reason,
            source,
            activity: activityId,
            adminOverride: adminOverride ?? { isOverride: false },
          },
        ],
        { session: dbSession },
      );

      const student = await Student.findByIdAndUpdate(
        studentId,
        { $inc: { xp: amount } },
        { returnDocument: "after", session: dbSession },
      );

      if (!student) {
        throw new ApiError(404, "Student not found");
      }

      const newLevel = LevelService.calculateLevel(student.xp);
      if (newLevel !== student.level) {
        student.level = newLevel;
        await student.save({ session: dbSession });
      }

      if (ownSession) await dbSession.commitTransaction();

      return { transaction, student };
    } catch (error) {
      if (ownSession) await dbSession.abortTransaction();
      throw error;
    } finally {
      if (ownSession) dbSession.endSession();
    }
  },

  async revokeXP(studentId, { amount, reason, source, activityId = null, adminOverride }) {
    if (amount <= 0) {
      throw new ApiError(400, "Revoke amount must be positive");
    }
    return this.awardXP(studentId, {
      amount: -amount,
      reason,
      source,
      activityId,
      adminOverride,
    });
  },

  async getHistory(studentId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      XPTransaction.find({ student: studentId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      XPTransaction.countDocuments({ student: studentId }),
    ]);
    return { entries, total, page, limit };
  },
};
