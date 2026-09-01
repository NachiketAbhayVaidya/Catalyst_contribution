import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

let replSet;
let app;

beforeAll(async () => {
  process.env.ADMIN_SIGNUP_CODE = "TEST-CODE-123";

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

describe("Self-service admin signup via invite code", () => {
  test("registering with role STUDENT (or no role) still creates a student, unaffected", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Plain Student", email: "plain.student@catalyst.demo", password: "Password@123" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("STUDENT");
  });

  test("registering with role ADMIN and the correct code creates an admin account", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Invited Admin",
      email: "invited.admin@catalyst.demo",
      password: "Password@123",
      role: "ADMIN",
      adminCode: "TEST-CODE-123",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("ADMIN");

    const { Admin } = await import("../src/models/admin.model.js");
    const admin = await Admin.findOne({ user: res.body.data.user.id });
    expect(admin).not.toBeNull();
  });

  test("registering with role ADMIN and a wrong code is rejected", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Sneaky",
      email: "sneaky@catalyst.demo",
      password: "Password@123",
      role: "ADMIN",
      adminCode: "wrong-code",
    });
    expect(res.status).toBe(403);

    const { User } = await import("../src/models/user.model.js");
    expect(await User.findOne({ email: "sneaky@catalyst.demo" })).toBeNull();
  });

  test("registering with role ADMIN and no code at all is rejected", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "No Code",
      email: "nocode@catalyst.demo",
      password: "Password@123",
      role: "ADMIN",
    });
    expect(res.status).toBe(403);
  });
});
