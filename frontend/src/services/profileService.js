import api from '../config/api';

const profileService = {
  getProfile: async (userId) => {
    try {
      const response = await api.get(`/profile/${userId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/profile/update', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile'
      };
    }
  },

  createReview: async (reviewData) => {
    try {
      const response = await api.post('/profile/reviews', reviewData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create review'
      };
    }
  },

  getReviews: async (userId) => {
    try {
      const response = await api.get(`/profile/${userId}/reviews`);
      return { 
        success: true, 
        data: Array.isArray(response.data.data) ? response.data.data : []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch reviews',
        data: []
      };
    }
  }
};

export default profileService;