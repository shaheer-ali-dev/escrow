import mongoose, { Schema } from "mongoose";

export interface MessageDoc {
  conversationId: string;
  senderId: string;
  senderRole: "client" | "freelancer";
  recipientId: string;
  content: string;
  attachmentUri?: string;
  escrowAddress?: string;
  milestoneId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<MessageDoc>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderRole: { type: String, enum: ["client", "freelancer"], required: true },
    recipientId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    attachmentUri: String,
    escrowAddress: { type: String, index: true },
    milestoneId: String,
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export const Message = mongoose.model<MessageDoc>("Message", messageSchema);