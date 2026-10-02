import { Notification } from "../models/notification.model.js";

export async function createNotification(
  userId: string,
  type: "milestone_completed" | "evaluation_ready" | "dispute_raised" | "payment_released" | "admin_alert",
  title: string,
  message: string,
  link?: string
) {
  return Notification.create({
    userId,
    type,
    title,
    message,
    link,
    read: false,
  });
}

export async function getNotifications(userId: string) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function markAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(
    notificationId,
    { read: true, readAt: new Date() },
    { new: true }
  );
}

export async function getUnreadCount(userId: string) {
  return Notification.countDocuments({ userId, read: false });
}

export async function deleteNotification(notificationId: string) {
  return Notification.findByIdAndDelete(notificationId);
}