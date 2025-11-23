import api from './api';

export const conversationService = {
  // Get my conversations
  getMyConversations: async () => {
    return api.get('/conversations');
  },

  // Get single conversation
  getConversation: async (id) => {
    return api.get(`/conversations/${id}`);
  },

  // Create conversation (client/admin only)
  createConversation: async (participantId, initialMessage) => {
    return api.post('/conversations', { participantId, initialMessage });
  },

  // Send message
  sendMessage: async (conversationId, text, attachments) => {
    return api.post(`/conversations/${conversationId}/messages`, {
      text,
      attachments,
    });
  },

  // Mark as read
  markAsRead: async (conversationId) => {
    return api.patch(`/conversations/${conversationId}/read`);
  },

  // Archive conversation
  archiveConversation: async (conversationId) => {
    return api.post(`/conversations/${conversationId}/archive`);
  },

  // Get unread count
  getUnreadCount: async () => {
    return api.get('/conversations/unread-count');
  },

  // Report conversation
  reportConversation: async (conversationId, reason) => {
    return api.post(`/conversations/${conversationId}/report`, { reason });
  },
};
