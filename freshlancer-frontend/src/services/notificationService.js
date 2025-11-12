import api from './api';

export const notificationService = {
  // Get my notifications
  getMyNotifications: async (params) => {
    return api.get('/notifications', { params });
  },

  // Get single notification
  getNotification: async (id) => {
    return api.get(`/notifications/${id}`);
  },

  // Get unread count
  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },

  // Mark as read
  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: async () => {
    return api.patch('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: async (id) => {
    return api.delete(`/notifications/${id}`);
  },

  // Delete all read
  deleteAllRead: async () => {
    return api.delete('/notifications/read');
  },

  // Get notification settings
  getNotificationSettings: async () => {
    return api.get('/notifications/settings');
  },

  // Update notification settings
  updateNotificationSettings: async (settings) => {
    return api.patch('/notifications/settings', settings);
  },
};
