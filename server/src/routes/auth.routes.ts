import { Router } from "express";
import { login, signup, googleStart, googleCallback } from "../controllers/auth.controller.js";
const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);
export default router;
