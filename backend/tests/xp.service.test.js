import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { User } from "../src/models/user.model.js";
import { Student } from "../src/models/student.model.js";
import { ActivityEnrollment } from "../src/models/activityEnrollment.model.js";
import { Activity } from "../src/models/activity.model.js";
import { XPTransaction } from "../src/models/xpTransaction.model.js";
import { XPService } from "../src/services/gamification/xp.service.js";
import { XP_SOURCES, ACTIVITY_TYPES } from "../src/constants.js";

// XP transactions require a Mongo transaction, which needs a replica set.
let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri("catalyst_test"));

  // Implicitly creating a collection inside a multi-document transaction can
  // hit a lock-acquisition timeout on a freshly-created replica set. Pre-create
  // every collection XPService's transaction touches so that race can't happen.
  await Promise.all(
    [User, Student, ActivityEnrollment, Activity, XPTransaction].map((model) =>
      model.createCollection(),
    ),
  );
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});

async function createStudent() {
  const user = await User.create({
    email: "student@test.dev",
    username: "student_test",
    fullName: "Test Student",
    password: "Password@123",
    role: "student",
  });
  return Student.create({ user: user._id });
}

describe("XPService.awardXP", () => {
  test("increments student XP and recalculates level", async () => {
    const student = await createStudent();

    await XPService.awardXP(student._id, {
      amount: 300,
      reason: "Completed onboarding",
      source: XP_SOURCES.MILESTONE,
    });

    const updated = await Student.findById(student._id);
    expect(updated.xp).toBe(300);
    expect(updated.level).toBe(2); // crosses the 250 xp threshold

    const transactions = await XPTransaction.find({ student: student._id });
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(300);
  });

  test("caller-level idempotency guard prevents double-counting the same completion", async () => {
    const student = await createStudent();
    const activity = await Activity.create({
      title: "Intro Quiz",
      type: ACTIVITY_TYPES.QUIZ,
      creator: student.user,
      xp: 50,
    });
    const enrollment = await ActivityEnrollment.create({ activity: activity._id, student: student._id });

    async function completeActivityOnce() {
      const fresh = await ActivityEnrollment.findById(enrollment._id);
      if (fresh.xpAwarded) return;
      await XPService.awardXP(student._id, {
        amount: activity.xp,
        reason: `Completed ${activity.title}`,
        source: XP_SOURCES.QUIZ,
        activityId: activity._id,
      });
      fresh.xpAwarded = true;
      fresh.status = "completed";
      await fresh.save();
    }

    await completeActivityOnce();
    await completeActivityOnce(); // simulates a duplicate request/retry

    const updated = await Student.findById(student._id);
    expect(updated.xp).toBe(50);

    const transactions = await XPTransaction.find({ student: student._id });
    expect(transactions).toHaveLength(1);
  });
});
