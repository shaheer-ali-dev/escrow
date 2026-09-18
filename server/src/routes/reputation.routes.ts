import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware.js";
import { getWalletProfile, scanWalletProfile, getEvidence } from "../controllers/wallet-profile.controller.js";

const router = Router();
router.get("/wallet/:address/profile", asyncHandler(getWalletProfile));
router.post("/wallet/:address/scan", asyncHandler(scanWalletProfile));
router.get("/wallet/:address/activity", asyncHandler(getWalletProfile));
router.get("/wallet/:address/trading", asyncHandler(getWalletProfile));
router.get("/wallet/:address/risk", asyncHandler(getWalletProfile));
router.get("/wallet/:address/evidence", asyncHandler(getEvidence));
export default router;
