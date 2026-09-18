import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware.js";
import { scanWalletController, getWalletAnalyticsController, getWalletEventsController } from "../controllers/reputation.controller.js";

const router = Router();
router.post("/wallet/:address/scan", asyncHandler(scanWalletController));
router.get("/wallet/:address", asyncHandler(getWalletAnalyticsController));
router.get("/wallet/:address/events", asyncHandler(getWalletEventsController));
export default router;
