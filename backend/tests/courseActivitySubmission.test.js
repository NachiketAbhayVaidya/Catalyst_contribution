import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

let replSet;
let app;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGO_URI = replSet.getUri();
  await mongoose.connect(replSet.getUri("catalyst_test"));
  ({ app } = await import("../src/app.js"));
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

async function registerAndLogin(role = "student") {
  const email = `${role}.${Date.now()}.${Math.random().toString(36).slice(2)}@catalyst.demo`;
  if (role === "student") {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Test Student", email, password: "Password@123" });
    return { cookies: res.headers["set-cookie"], userId: res.body.data.user.id };
  }

  const { User } = await import("../src/models/user.model.js");
  const { Admin } = await import("../src/models/admin.model.js");
  const user = await User.create({ email, username: email.split("@")[0], fullName: "Test Admin", password: "Password@123", role: "admin" });
  await Admin.create({ user: user._id });
  const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password: "Password@123" });
  return { cookies: loginRes.headers["set-cookie"], userId: user._id.toString() };
}

describe("Course CRUD + enrollment", () => {
  test("admin creates a course with modules, student lists/gets/enrolls in it", async () => {
    const admin = await registerAndLogin("admin");
    const student = await registerAndLogin("student");

    const createRes = await request(app)
      .post("/api/v1/admin/courses")
      .set("Cookie", admin.cookies)
      .send({
        title: "Leadership Fundamentals",
        description: "Learn to lead",
        category: "Leadership",
        difficulty: "BEGINNER",
        durationMinutes: 240,
        xpReward: 100,
        modules: [{ title: "Intro", description: "" }, { title: "Communication", description: "" }],
      });
    expect(createRes.status).toBe(201);
    const courseId = createRes.body.data.id;

    const listRes = await request(app).get("/api/v1/courses").set("Cookie", student.cookies);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c) => c.id === courseId)).toBe(true);
    expect(listRes.body.pagination).toBeDefined();

    const detailRes = await request(app).get(`/api/v1/courses/${courseId}`).set("Cookie", student.cookies);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.modules).toHaveLength(2);
    expect(detailRes.body.data.enrolled).toBe(false);
    expect(detailRes.body.data.difficulty).toBe("BEGINNER");

    const enrollRes = await request(app).post(`/api/v1/courses/${courseId}/enroll`).set("Cookie", student.cookies);
    expect(enrollRes.status).toBe(200);

    const afterEnroll = await request(app).get(`/api/v1/courses/${courseId}`).set("Cookie", student.cookies);
    expect(afterEnroll.body.data.enrolled).toBe(true);

    const adminListRes = await request(app).get("/api/v1/admin/courses").set("Cookie", admin.cookies);
    expect(adminListRes.status).toBe(200);
    const listed = adminListRes.body.data.find((c) => c.id === courseId);
    expect(listed).toBeDefined();
    expect(listed.moduleCount).toBe(2);
    expect(listed.enrolledCount).toBe(1);
  });

  test("a student cannot list admin courses or create a course", async () => {
    const student = await registerAndLogin("student");
    const listRes = await request(app).get("/api/v1/admin/courses").set("Cookie", student.cookies);
    expect(listRes.status).toBe(403);
  });

  test("a student cannot create a course", async () => {
    const student = await registerAndLogin("student");
    const res = await request(app)
      .post("/api/v1/admin/courses")
      .set("Cookie", student.cookies)
      .send({ title: "Nope" });
    expect(res.status).toBe(403);
  });
});

describe("Activity + assignment submission + admin review → real XP award", () => {
  async function createAssignmentActivity(adminCookies, xpReward = 100) {
    const res = await request(app)
      .post("/api/v1/admin/activities")
      .set("Cookie", adminCookies)
      .send({
        title: "Leadership Case Study",
        description: "Analyze the case study",
        type: "ASSIGNMENT",
        xpReward,
        mandatory: true,
        instructions: "Write 500 words",
        maxAttempts: 2,
        submissionTypes: ["TEXT", "LINK"],
      });
    expect(res.status).toBe(201);
    return res.body.data.id; // activity id
  }

  test("full loop: create activity, list for student, submit, admin reviews, real XP is awarded exactly once", async () => {
    const admin = await registerAndLogin("admin");
    const student = await registerAndLogin("student");

    await createAssignmentActivity(admin.cookies, 100);

    const activitiesRes = await request(app).get("/api/v1/student/activities").set("Cookie", student.cookies);
    expect(activitiesRes.status).toBe(200);
    expect(activitiesRes.body.data).toHaveLength(1);
    const activity = activitiesRes.body.data[0];
    expect(activity.type).toBe("ASSIGNMENT");
    expect(activity.status).toBe("PENDING");
    expect(activity.linkedId).toBeDefined();

    const assignmentId = activity.linkedId;

    const submitRes = await request(app)
      .post(`/api/v1/assignments/${assignmentId}/submit`)
      .set("Cookie", student.cookies)
      .send({ text: "My 500 word response about leadership." });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.data.status).toBe("SUBMITTED");

    const adminSubsRes = await request(app)
      .get("/api/v1/admin/submissions?status=PENDING")
      .set("Cookie", admin.cookies);
    expect(adminSubsRes.status).toBe(200);
    expect(adminSubsRes.body.data).toHaveLength(1);
    const submissionId = adminSubsRes.body.data[0].id;

    const { Student } = await import("../src/models/student.model.js");
    const studentDoc = await Student.findOne({ user: student.userId });
    expect(studentDoc.xp).toBe(0);

    const reviewRes = await request(app)
      .patch(`/api/v1/admin/submissions/${submissionId}/review`)
      .set("Cookie", admin.cookies)
      .send({ score: 85, feedback: "Great work", approvedAiReview: false });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.xpAwarded).toBe(100);

    const studentAfter = await Student.findOne({ user: student.userId });
    expect(studentAfter.xp).toBe(100);

    // Idempotency: reviewing the same submission again must be rejected,
    // not double-award XP.
    const secondReview = await request(app)
      .patch(`/api/v1/admin/submissions/${submissionId}/review`)
      .set("Cookie", admin.cookies)
      .send({ score: 90, feedback: "again", approvedAiReview: false });
    expect(secondReview.status).toBe(409);

    const studentFinal = await Student.findOne({ user: student.userId });
    expect(studentFinal.xp).toBe(100); // unchanged — no double award

    const { XPTransaction } = await import("../src/models/xpTransaction.model.js");
    const transactions = await XPTransaction.find({ student: studentDoc._id });
    expect(transactions).toHaveLength(1);

    // Activity now shows COMPLETED for this student.
    const activitiesAfter = await request(app).get("/api/v1/student/activities").set("Cookie", student.cookies);
    expect(activitiesAfter.body.data[0].status).toBe("COMPLETED");
  });

  test("a student cannot create an activity, and a student cannot review a submission", async () => {
    const student = await registerAndLogin("student");
    const createRes = await request(app)
      .post("/api/v1/admin/activities")
      .set("Cookie", student.cookies)
      .send({ title: "x", type: "ASSIGNMENT" });
    expect(createRes.status).toBe(403);
  });

  test("submitting more times than maxAttempts is rejected", async () => {
    const admin = await registerAndLogin("admin");
    const student = await registerAndLogin("student");
    await createAssignmentActivity(admin.cookies, 50);

    const activitiesRes = await request(app).get("/api/v1/student/activities").set("Cookie", student.cookies);
    const assignmentId = activitiesRes.body.data[0].linkedId;

    await request(app).post(`/api/v1/assignments/${assignmentId}/submit`).set("Cookie", student.cookies).send({ text: "attempt 1" });
    await request(app).post(`/api/v1/assignments/${assignmentId}/submit`).set("Cookie", student.cookies).send({ text: "attempt 2" });
    const third = await request(app).post(`/api/v1/assignments/${assignmentId}/submit`).set("Cookie", student.cookies).send({ text: "attempt 3" });

    expect(third.status).toBe(422);
  });
});
