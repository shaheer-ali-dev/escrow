import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import escrowRoutes from "./routes/escrow-full.routes.js";
import reputationRoutes from "./routes/reputation.routes.js";
import workSubmissionRoutes from "./routes/work-submission.routes.js";
import evaluationRoutes from "./routes/evaluation.routes.js";
import { startIndexer } from "./services/indexer.worker.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({ windowMs: 900000, limit: 200, standardHeaders: true }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/reputation", reputationRoutes);
app.use("/api/work-submissions", workSubmissionRoutes);
app.use("/api/evaluations", evaluationRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDatabase();
  if (env.ENABLE_INDEXER) {
    startIndexer();
  }
  app.listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});