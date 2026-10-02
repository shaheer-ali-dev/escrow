import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";

export async function getOrCreateConversation(clientId: string, freelancerId: string, escrowAddress?: string) {
  let conversation = await Conversation.findOne({
    $or: [
      { clientId, freelancerId },
      { clientId: freelancerId, freelancerId: clientId },
    ],
  });

  if (!conversation) {
    conversation = await Conversation.create({
      clientId: clientId < freelancerId ? clientId : freelancerId,
      freelancerId: clientId < freelancerId ? freelancerId : clientId,
      escrowAddress,
      status: "active",
    });
  }

  return conversation;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderRole: "client" | "freelancer",
  recipientId: string,
  content: string,
  attachmentUri?: string,
  escrowAddress?: string,
  milestoneId?: string
) {
  const message = await Message.create({
    conversationId,
    senderId,
    senderRole,
    recipientId,
    content,
    attachmentUri,
    escrowAddress,
    milestoneId,
    isRead: false,
  });

  const conversation = await Conversation.findById(conversationId);
  const updateData: any = {
    lastMessage: content,
    lastMessageAt: new Date(),
  };

  if (senderRole === "client") {
    updateData.freelancerUnreadCount = (conversation?.freelancerUnreadCount || 0) + 1;
  } else {
    updateData.clientUnreadCount = (conversation?.clientUnreadCount || 0) + 1;
  }

  await Conversation.findByIdAndUpdate(conversationId, updateData);

  return message;
}

export async function getConversations(userId: string, role: "client" | "freelancer") {
  const query = role === "client" ? { clientId: userId } : { freelancerId: userId };
  return Conversation.find(query).sort({ updatedAt: -1 }).lean();
}

export async function getMessages(conversationId: string, limit = 50, skip = 0) {
  return Message.find({ conversationId }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  await Message.updateMany(
    { conversationId, recipientId: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return;

  const updateData: any = {};
  if (conversation.clientId === userId) {
    updateData.clientUnreadCount = 0;
  } else {
    updateData.freelancerUnreadCount = 0;
  }

  return Conversation.findByIdAndUpdate(conversationId, updateData, { new: true });
}

export async function getUnreadCount(userId: string, role: "client" | "freelancer") {
  const query = role === "client" ? { clientId: userId } : { freelancerId: userId };
  const field = role === "client" ? "clientUnreadCount" : "freelancerUnreadCount";

  const conversations = await Conversation.find(query).select(field).lean();
  return conversations.reduce((sum: number, conv: any) => sum + (conv[field] || 0), 0);
}

export async function archiveConversation(conversationId: string) {
  return Conversation.findByIdAndUpdate(conversationId, { status: "archived" }, { new: true });
}