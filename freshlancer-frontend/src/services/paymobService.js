import api from './api';

export const paymobService = {
  /**
   * Check payment status by intention ID (read-only)
   * @param {string} intentionId - The payment intention ID from Paymob
   * @returns {Promise} Payment status data
   */
  
  
  
  checkPaymentStatus: async (intentionId) => {
    try {
      console.log('Checking payment status for intention ID:', intentionId);
      const response = await api.get(`/paymob/payment-status?id=${intentionId}`);
      console.log('Payment status response:', response);
      return response; // api.js interceptor already unwraps response.data
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },
};

export default paymobService;
