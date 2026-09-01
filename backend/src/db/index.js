import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { env } from "../config/env.js";

// mongoose.connect(uri, { dbName }) sets the database regardless of whether
// the URI already has a path/query string (e.g. "...mongodb.net/?appName=x") —
// naive string concatenation of "/${DB_NAME}" breaks on that shape.
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(env.mongoUri, { dbName: DB_NAME });
    console.log(`\nMongoDB connected: ${connectionInstance.connection.host}\n`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
