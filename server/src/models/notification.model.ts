import mongoose, { Schema } from "mongoose";

export interface NotificationDoc {
  userId: string;
  type: "milestone_completed" | "evaluation_ready" | "dispute_raised" | "payment_released" | "admin_alert";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["milestone_completed", "evaluation_ready", "dispute_raised", "payment_released", "admin_alert"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
  },
  { timestamps: true }
);

export const Notification = mongoose.model<NotificationDoc>(
  "Notification",
  notificationSchema
);