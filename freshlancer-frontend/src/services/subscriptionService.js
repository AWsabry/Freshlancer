import api from './api';

export const subscriptionService = {
  // Get my subscription
  getMySubscription: async () => {
    return api.get('/subscriptions/me');
  },

  // Check application limit
  checkApplicationLimit: async () => {
    return api.get('/subscriptions/check-limit');
  },

  
  // Upgrade to premium
  upgradeToPremium: async (paymentData) => {
    return api.post('/subscriptions/upgrade', paymentData);
  },

  // Cancel subscription
  cancelSubscription: async (reason) => {
    return api.post('/subscriptions/cancel', { reason });
  },

  // Get subscription history
  getSubscriptionHistory: async () => {
    return api.get('/subscriptions/history');
  },

  // Get usage stats
  getUsageStats: async () => {
    return api.get('/subscriptions/usage-stats');
  },

  // Get subscription pricing (based on user's currency)
  getPricing: async (currency) => {
    return api.get('/subscriptions/pricing', {
      params: currency ? { currency } : {},
    });
  },
};
