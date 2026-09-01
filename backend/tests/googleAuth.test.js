import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

// Must be registered before app.js (and everything it imports) is loaded,
// since ESM resolves imports once at module-load time.
let verifyIdTokenMock;
jest.unstable_mockModule("google-auth-library", () => {
  verifyIdTokenMock = jest.fn();
  return {
    OAuth2Client: class {
      async verifyIdToken(args) {
        return verifyIdTokenMock(args);
      }
    },
  };
});

function mockPayload(overrides = {}) {
  return {
    email: "google.user@catalyst.demo",
    email_verified: true,
    name: "Google User",
    picture: "https://example.com/avatar.png",
    ...overrides,
  };
}

let replSet;
let app;

beforeAll(async () => {
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";

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
  verifyIdTokenMock.mockReset();
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});

describe("POST /auth/google", () => {
  test("creates a new student account from a verified Google credential", async () => {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => mockPayload() });

    const res = await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      name: "Google User",
      email: "google.user@catalyst.demo",
      role: "STUDENT",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(res.body.data.accessToken).toBeDefined();

    const { Student } = await import("../src/models/student.model.js");
    const { User } = await import("../src/models/user.model.js");
    const user = await User.findOne({ email: "google.user@catalyst.demo" });
    expect(await Student.findOne({ user: user._id })).not.toBeNull();
  });

  test("links to an existing password-based account with the same email instead of duplicating", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Existing User", email: "existing@catalyst.demo", password: "Password@123" });
    const existingUserId = registerRes.body.data.user.id;

    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => mockPayload({ email: "existing@catalyst.demo", name: "Existing User" }),
    });

    const res = await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(existingUserId);

    const { User } = await import("../src/models/user.model.js");
    expect(await User.countDocuments({ email: "existing@catalyst.demo" })).toBe(1);
  });

  test("rejects an unverified email", async () => {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => mockPayload({ email_verified: false }) });
    const res = await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });
    expect(res.status).toBe(401);
  });

  test("rejects a credential Google itself rejects", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("Wrong number of segments"));
    const res = await request(app).post("/api/v1/auth/google").send({ credential: "garbage" });
    expect(res.status).toBe(401);
  });

  test("requires a credential in the body", async () => {
    const res = await request(app).post("/api/v1/auth/google").send({});
    expect(res.status).toBe(400);
  });
});
