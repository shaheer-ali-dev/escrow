import { Router } from "express";
import { getWalletAnalyticsController, getWalletEventsController } from "../controllers/reputation.controller.js";

const router = Router();
router.get("/wallet/:address", getWalletAnalyticsController);
router.get("/wallet/:address/events", getWalletEventsController);

export default router;
