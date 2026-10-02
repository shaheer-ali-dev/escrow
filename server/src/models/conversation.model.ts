import mongoose, { Schema } from "mongoose";

export interface ConversationDoc {
  clientId: string;
  freelancerId: string;
  escrowAddress?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  clientUnreadCount: number;
  freelancerUnreadCount: number;
  status: "active" | "archived" | "resolved";
  createdAt?: Date;
  updatedAt?: Date;
}

const conversationSchema = new Schema<ConversationDoc>(
  {
    clientId: { type: String, required: true, index: true },
    freelancerId: { type: String, required: true, index: true },
    escrowAddress: { type: String, index: true },
    lastMessage: String,
    lastMessageAt: Date,
    clientUnreadCount: { type: Number, default: 0 },
    freelancerUnreadCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "archived", "resolved"], default: "active", index: true },
  },
  { timestamps: true }
);

conversationSchema.index({ clientId: 1, updatedAt: -1 });
conversationSchema.index({ freelancerId: 1, updatedAt: -1 });
conversationSchema.index({ clientId: 1, freelancerId: 1 }, { unique: true });

export const Conversation = mongoose.model<ConversationDoc>("Conversation", conversationSchema);