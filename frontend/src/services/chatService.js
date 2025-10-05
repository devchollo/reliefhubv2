import api from '../config/api';

const chatService = {
  getChats: async () => {
    try {
      const response = await api.get('/chats');
      return { 
        success: true, 
        data: Array.isArray(response.data.data) ? response.data.data : []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch chats',
        data: []
      };
    }
  },

  getChatByRequest: async (requestId) => {
    try {
      const response = await api.get(`/chats/request/${requestId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch chat'
      };
    }
  },

  sendMessage: async (chatId, content) => {
    try {
      const response = await api.post(`/chats/${chatId}/messages`, { content });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message'
      };
    }
  },

  markAsRead: async (chatId) => {
    try {
      await api.put(`/chats/${chatId}/read`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark as read'
      };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/chats/unread-count');
      return { 
        success: true, 
        data: response.data.unreadCount || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch unread count',
        data: 0
      };
    }
  }
};

export default chatService;