// Minimal Phase-1 seed so the app isn't empty (spec §35/§36). Richer volumes
// (20 students, 5 courses, achievements, milestones, missions, competitions)
// are added in Phase 7 once the entities they reference (courses, activities)
// have real CRUD behind them.
//
// This is also the only place the FIRST admin account is created directly —
// every other admin is created via POST /api/v1/auth/register-admin, which
// requires an existing admin to be logged in.
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { default: connectDB } = await import("../src/db/index.js");
const { User } = await import("../src/models/user.model.js");
const { Student } = await import("../src/models/student.model.js");
const { Admin } = await import("../src/models/admin.model.js");
const { Team } = await import("../src/models/team.model.js");
const { Course } = await import("../src/models/course.model.js");
const { ROLES } = await import("../src/constants.js");

async function upsertUser({ email, username, fullName, password, role }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, username, fullName, password, role });
    console.log(`Created user: ${email}`);
  } else {
    console.log(`User already exists: ${email}`);
  }
  return user;
}

async function run() {
  await connectDB();

  const admin = await upsertUser({
    email: "admin@catalyst.demo",
    username: "catalyst_admin",
    fullName: "Catalyst Admin",
    password: "Password@123",
    role: ROLES.ADMIN,
  });
  if (!(await Admin.findOne({ user: admin._id }))) {
    await Admin.create({ user: admin._id, title: "Programme Manager" });
  }

  let team = await Team.findOne({ name: "Team Alpha" });
  if (!team) {
    team = await Team.create({ name: "Team Alpha", description: "Demo team for Catalyst" });
    console.log("Created team: Team Alpha");
  }

  const demoStudents = [
    { email: "student@catalyst.demo", username: "catalyst_student", fullName: "Alex Rivera" },
    { email: "priya.sharma@catalyst.demo", username: "priya_sharma", fullName: "Priya Sharma" },
    { email: "jordan.lee@catalyst.demo", username: "jordan_lee", fullName: "Jordan Lee" },
  ];

  for (const data of demoStudents) {
    const user = await upsertUser({ ...data, password: "Password@123", role: ROLES.STUDENT });
    const existingStudent = await Student.findOne({ user: user._id });
    if (!existingStudent) {
      await Student.create({ user: user._id, team: team._id, programmeYear: 1 });
    }
  }

  if (!(await Course.findOne({ title: "Leadership Fundamentals" }))) {
    await Course.create({
      title: "Leadership Fundamentals",
      description: "Core leadership skills for the Catalyst programme.",
      category: "Leadership",
      difficulty: "beginner",
      durationHours: 20,
      mandatory: true,
      xpReward: 100,
      createdBy: admin._id,
    });
    console.log("Created course: Leadership Fundamentals");
  }

  console.log("\nSeed complete. Demo accounts (password: Password@123):");
  console.log("  Admin:   admin@catalyst.demo");
  console.log("  Student: student@catalyst.demo\n");
}

run()
  .then(() => mongoose.connection.close())
  .catch((error) => {
    console.error("Seed failed:", error);
    return mongoose.connection.close().finally(() => process.exit(1));
  });
