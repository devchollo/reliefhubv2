import api from '../config/api';

const transactionService = {
  // Get all transactions (with filters)
  getAllTransactions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/transactions?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transactions'
      };
    }
  },

  // Get single transaction
  getTransaction: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transaction'
      };
    }
  },

  // Get my transactions
  getMyTransactions: async () => {
    try {
      const response = await api.get('/transactions/my-transactions');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch your transactions'
      };
    }
  },

  // Confirm delivery (recipient)
  confirmDelivery: async (id, confirmationData) => {
    try {
      const response = await api.post(`/transactions/${id}/confirm`, confirmationData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to confirm delivery'
      };
    }
  },

  // Rate transaction
  rateTransaction: async (id, rating, feedback) => {
    try {
      const response = await api.post(`/transactions/${id}/rate`, { rating, feedback });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit rating'
      };
    }
  },

  // Get transaction statistics
  getStats: async () => {
    try {
      const response = await api.get('/transactions/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch statistics'
      };
    }
  }
};

export default transactionService;