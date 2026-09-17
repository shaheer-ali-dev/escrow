import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "passport";
import { connectDatabase } from "./config/database.js";
import { configurePassport } from "./config/passport.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import escrowRoutes from "./routes/escrow.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
configurePassport();

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/escrows", escrowRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

await connectDatabase();
app.listen(env.PORT, () => console.log(`Server listening on port ${env.PORT}`));
