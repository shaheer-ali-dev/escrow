import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import {
  sendMessageEndpoint,
  getConversationsEndpoint,
  getMessagesEndpoint,
  markAsReadEndpoint,
  getUnreadCountEndpoint,
  archiveConversationEndpoint,
} from "../controllers/message.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/send", asyncHandler(sendMessageEndpoint));
router.get("/conversations", asyncHandler(getConversationsEndpoint));
router.get("/:conversationId", asyncHandler(getMessagesEndpoint));
router.patch("/:conversationId/read", asyncHandler(markAsReadEndpoint));
router.get("/unread/count", asyncHandler(getUnreadCountEndpoint));
router.patch("/:conversationId/archive", asyncHandler(archiveConversationEndpoint));

export default router;