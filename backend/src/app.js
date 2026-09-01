import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import "./models/index.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
