import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// env/app/db imports happen after dotenv.config so process.env is populated
// before src/config/env.js reads it.
const { default: connectDB } = await import("./db/index.js");
const { app } = await import("./app.js");
const { env } = await import("./config/env.js");

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.error("Server error:", err);
      throw err;
    });

    app.listen(env.port, () => {
      console.log(`Server is running at port ${env.port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
