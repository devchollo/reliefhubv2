import api from '../config/api';

const requestService = {
  // Get all requests (with filters)
  getAllRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.urgency) params.append('urgency', filters.urgency);
      
      const response = await api.get(`/requests?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch requests'
      };
    }
  },

  // Get single request
  getRequest: async (id) => {
    try {
      const response = await api.get(`/requests/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch request'
      };
    }
  },

  // Create new request
  createRequest: async (requestData) => {
    try {
      const response = await api.post('/requests', requestData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create request'
      };
    }
  },

  // Update request
  updateRequest: async (id, updates) => {
    try {
      const response = await api.put(`/requests/${id}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update request'
      };
    }
  },

  // Delete request
  deleteRequest: async (id) => {
    try {
      await api.delete(`/requests/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete request'
      };
    }
  },

  // Accept request (donor/volunteer)
  acceptRequest: async (id) => {
    try {
      const response = await api.post(`/requests/${id}/accept`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to accept request'
      };
    }
  },

  // Complete request
  completeRequest: async (id, completionData) => {
    try {
      const response = await api.post(`/requests/${id}/complete`, completionData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to complete request'
      };
    }
  },

  // Get my requests (created by me)
  getMyRequests: async () => {
    try {
      const response = await api.get('/requests/my-requests');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch your requests'
      };
    }
  },

  // Get accepted requests (I'm helping with)
  getAcceptedRequests: async () => {
    try {
      const response = await api.get('/requests/accepted');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch accepted requests'
      };
    }
  }
};

export default requestService;