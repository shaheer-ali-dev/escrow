import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { verifyWallet } from "../controllers/wallet.controller.js";
const router = Router(); router.use(requireAuth); router.get("/", asyncHandler(getProfile)); router.patch("/", asyncHandler(updateProfile)); router.post("/wallet/verify", asyncHandler(verifyWallet)); export default router;
