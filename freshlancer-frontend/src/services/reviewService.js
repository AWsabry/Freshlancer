import api from './api';

export const reviewService = {
  // Create review
  createReview: async (reviewData) => {
    return api.post('/reviews', reviewData);
  },

  // Get reviews for user
  getReviewsForUser: async (userId) => {
    return api.get(`/reviews/user/${userId}`);
  },

  // Get my reviews (reviews I wrote)
  getMyReviews: async () => {
    return api.get('/reviews/me');
  },

  // Get reviews about me
  getReviewsAboutMe: async () => {
    return api.get('/reviews/about-me');
  },

  // Respond to review
  respondToReview: async (id, text) => {
    return api.post(`/reviews/${id}/respond`, { text });
  },

  // Vote review as helpful
  voteHelpful: async (id) => {
    return api.post(`/reviews/${id}/vote-helpful`);
  },

  // Remove vote
  removeVote: async (id) => {
    return api.delete(`/reviews/${id}/vote`);
  },

  // Report review
  reportReview: async (id, reason) => {
    return api.post(`/reviews/${id}/report`, { reason });
  },

  // Admin: Get reported reviews
  getReportedReviews: async () => {
    return api.get('/reviews/reported');
  },

  // Admin: Hide review
  hideReview: async (id, reason) => {
    return api.patch(`/reviews/${id}/hide`, { reason });
  },
};
