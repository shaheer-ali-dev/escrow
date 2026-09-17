import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { verifyWallet } from "../controllers/wallet.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/wallet/verify", verifyWallet);

export default router;
