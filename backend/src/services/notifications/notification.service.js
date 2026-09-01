import { Notification } from "../../models/notification.model.js";
import { NotificationPreference } from "../../models/notificationPreference.model.js";

export const NotificationService = {
  async notify(userId, { type, title, message, link = null }) {
    const preference = await NotificationPreference.findOne({ user: userId });
    if (preference?.mutedTypes?.includes(type)) {
      return null;
    }
    return Notification.create({ user: userId, type, title, message, link });
  },

  async listForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const filter = { user: userId, ...(unreadOnly ? { read: false } : {}) };
    const skip = (page - 1) * limit;
    const [entries, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, read: false }),
    ]);
    return { entries, total, unreadCount, page, limit };
  },

  async markRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { returnDocument: "after" },
    );
  },
};
