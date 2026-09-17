import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { listMyEscrows, getEscrow } from "../controllers/escrow.controller.js";
const router = Router(); router.use(requireAuth); router.get("/", listMyEscrows); router.get("/:address", getEscrow); export default router;
