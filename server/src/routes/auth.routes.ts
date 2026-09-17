import { Router } from "express";
import { signupUser, loginUser } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { verifyWallet } from "../controllers/wallet.controller.js";
import { listEscrows, getSingleEscrow } from "../controllers/escrow.controller.js";
import { getWalletAnalyticsController, getWalletEventsController } from "../controllers/reputation.controller.js";

const router = Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/google", (_req, res) => res.status(501).json({ error: "Google OAuth not configured yet. Add credentials and callback URL." }));
router.get("/google/callback", (_req, res) => res.status(501).json({ error: "Google OAuth callback not configured yet." }));

router.get("/profile", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);
router.post("/profile/wallet/verify", requireAuth, verifyWallet);

router.get("/escrows", requireAuth, listEscrows);
router.get("/escrows/:address", requireAuth, getSingleEscrow);

router.get("/wallet/:address", getWalletAnalyticsController);
router.get("/wallet/:address/events", getWalletEventsController);

export default router;
