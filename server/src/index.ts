import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import escrowRoutes from "./routes/escrow.routes.js";
import reputationRoutes from "./routes/reputation.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: true }));
app.use("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/escrows", escrowRoutes);
app.use("/api/reputation", reputationRoutes);
app.use(notFound);
app.use(errorHandler);

await connectDatabase();
app.listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
