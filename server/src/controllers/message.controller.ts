import type { Request, Response } from "express";
import { z } from "zod";
import {
  getOrCreateConversation,
  sendMessage,
  getConversations,
  getMessages,
  markMessagesAsRead,
  getUnreadCount,
  archiveConversation,
} from "../services/message.service.js";

const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  senderRole: z.enum(["client", "freelancer"]),
  content: z.string().min(1).max(5000),
  attachmentUri: z.string().url().optional(),
  escrowAddress: z.string().optional(),
  milestoneId: z.string().optional(),
});

const getMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export async function sendMessageEndpoint(req: Request, res: Response) {
  try {
    const data = sendMessageSchema.parse(req.body);
    const userId = req.auth!.userId;

    const conversation = await getOrCreateConversation(
      data.senderRole === "client" ? userId : data.recipientId,
      data.senderRole === "client" ? data.recipientId : userId,
      data.escrowAddress
    );

    const message = await sendMessage(
      conversation._id!.toString(),
      userId,
      data.senderRole,
      data.recipientId,
      data.content,
      data.attachmentUri,
      data.escrowAddress,
      data.milestoneId
    );

    return res.status(201).json({ message, conversationId: conversation._id });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getConversationsEndpoint(req: Request, res: Response) {
  try {
    const userId = req.auth!.userId;
    const role = (req.query.role as "client" | "freelancer") || "client";

    const conversations = await getConversations(userId, role);
    return res.json(conversations);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getMessagesEndpoint(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { limit, skip } = getMessagesSchema.parse(req.query);

    const messages = await getMessages(conversationId, limit, skip);
    return res.json(messages);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function markAsReadEndpoint(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const userId = req.auth!.userId;

    const updated = await markMessagesAsRead(conversationId, userId);
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getUnreadCountEndpoint(req: Request, res: Response) {
  try {
    const userId = req.auth!.userId;
    const role = (req.query.role as "client" | "freelancer") || "client";

    const count = await getUnreadCount(userId, role);
    return res.json({ unreadCount: count });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function archiveConversationEndpoint(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;

    const archived = await archiveConversation(conversationId);
    return res.json(archived);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}