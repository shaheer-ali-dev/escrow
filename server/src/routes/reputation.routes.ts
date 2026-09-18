import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware.js";
import { getWalletAnalyticsController, getWalletEventsController } from "../controllers/reputation.controller.js";
const router = Router(); router.get("/wallet/:address", asyncHandler(getWalletAnalyticsController)); router.get("/wallet/:address/events", asyncHandler(getWalletEventsController)); export default router;
