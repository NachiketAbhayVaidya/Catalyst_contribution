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

// Matches client/src/api/auth.js's request shape exactly: {name, email, password}.
const credentials = {
  name: "Flow Student",
  email: "flow@catalyst.demo",
  password: "Password@123",
};

async function loginAndGetCookies(creds = credentials) {
  await request(app).post("/api/v1/auth/register").send(creds);
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: creds.email, password: creds.password });
  return loginRes.headers["set-cookie"];
}

describe("Auth flow", () => {
  test("registers a student and returns the frontend-shaped user + tokens", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      name: credentials.name,
      email: credentials.email,
      role: "STUDENT",
    });
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  test("rejects registration with a too-short password using the frontend error envelope", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...credentials, password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("logs in and can access /auth/me with the cookie", async () => {
    const cookies = await loginAndGetCookies();
    const meRes = await request(app).get("/api/v1/auth/me").set("Cookie", cookies);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(credentials.email);
    expect(meRes.body.data.role).toBe("STUDENT");
  });

  test("me works with a Bearer token too (frontend uses localStorage, not cookies)", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send(credentials);
    const token = registerRes.body.data.accessToken;
    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(credentials.email);
  });

  test("rejects wrong password", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: "WrongPassword1" });
    expect(res.status).toBe(401);
  });

  test("POST /auth/refresh (frontend's path, not /refresh-token) works", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send(credentials);
    const refreshToken = registerRes.body.data.refreshToken;
    const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test("a student token is rejected on an admin-only route", async () => {
    const cookies = await loginAndGetCookies();
    const res = await request(app).get("/api/v1/admin/analytics/overview").set("Cookie", cookies);
    expect(res.status).toBe(403);
  });
});

describe("Change password", () => {
  test("changes the password when the current password is correct, then old password stops working", async () => {
    const cookies = await loginAndGetCookies();

    const changeRes = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: credentials.password, newPassword: "NewPassword@456" });
    expect(changeRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: "NewPassword@456" });
    expect(newLoginRes.status).toBe(200);
  });

  test("rejects change-password with an incorrect current password", async () => {
    const cookies = await loginAndGetCookies();
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: "WrongCurrent1", newPassword: "NewPassword@456" });
    expect(res.status).toBe(401);
  });

  test("requires authentication", async () => {
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .send({ currentPassword: "x", newPassword: "NewPassword@456" });
    expect(res.status).toBe(401);
  });
});

describe("Admin account creation", () => {
  const adminCreds = {
    name: "Admin One",
    email: "admin.one@catalyst.demo",
    password: "Password@123",
  };

  async function createAndLoginAdmin() {
    const { User } = await import("../src/models/user.model.js");
    const { Admin } = await import("../src/models/admin.model.js");
    const user = await User.create({
      email: adminCreds.email,
      username: "admin_one",
      fullName: adminCreds.name,
      password: adminCreds.password,
      role: "admin",
    });
    await Admin.create({ user: user._id });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminCreds.email, password: adminCreds.password });
    return loginRes.headers["set-cookie"];
  }

  test("an existing admin can create another admin account", async () => {
    const adminCookies = await createAndLoginAdmin();

    const res = await request(app)
      .post("/api/v1/auth/register-admin")
      .set("Cookie", adminCookies)
      .send({
        name: "Admin Two",
        email: "admin.two@catalyst.demo",
        password: "Password@123",
        title: "Trainer",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("ADMIN");
  });

  test("a student cannot create an admin account", async () => {
    const studentCookies = await loginAndGetCookies();

    const res = await request(app)
      .post("/api/v1/auth/register-admin")
      .set("Cookie", studentCookies)
      .send({
        name: "Sneaky Admin",
        email: "sneaky.admin@catalyst.demo",
        password: "Password@123",
      });

    expect(res.status).toBe(403);
  });

  test("register-admin requires authentication", async () => {
    const res = await request(app).post("/api/v1/auth/register-admin").send({
      name: "No Auth Admin",
      email: "noauth.admin@catalyst.demo",
      password: "Password@123",
    });
    expect(res.status).toBe(401);
  });
});
