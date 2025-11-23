import api from './api';

export const offerService = {
  // Get all offers (with filters)
  getAllOffers: async (params = {}) => {
    const response = await api.get('/offers', { params });
    return response.data;
  },

  // Get featured offers
  getFeaturedOffers: async () => {
    const response = await api.get('/offers/featured');
    return response.data;
  },

  // Get single offer
  getOffer: async (id) => {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  },

  // Get offer by coupon code
  getOfferByCoupon: async (code) => {
    const response = await api.get(`/offers/coupon/${code}`);
    return response.data;
  },

  // Redeem offer
  redeemOffer: async (id) => {
    const response = await api.post(`/offers/${id}/redeem`);
    return response.data;
  },

  // Admin: Create offer
  createOffer: async (offerData) => {
    const response = await api.post('/offers', offerData);
    return response.data;
  },

  // Admin: Update offer
  updateOffer: async (id, offerData) => {
    const response = await api.patch(`/offers/${id}`, offerData);
    return response.data;
  },

  // Admin: Delete offer
  deleteOffer: async (id) => {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  },

  // Admin: Toggle offer active status
  toggleOfferActive: async (id) => {
    const response = await api.patch(`/offers/${id}/toggle-active`);
    return response.data;
  },

  // Admin: Get offer statistics
  getOfferStats: async (id) => {
    const response = await api.get(`/offers/${id}/stats`);
    return response.data;
  },
};
