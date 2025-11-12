import api from './api';

export const verificationService = {
  // Upload verification document
  uploadDocument: async (formData) => {
    return api.post('/verifications/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get my verifications
  getMyVerifications: async () => {
    return api.get('/verifications/me');
  },

  // Get verification status
  getVerificationStatus: async () => {
    return api.get('/verifications/status');
  },

  // Admin: Get all pending verifications
  getPendingVerifications: async () => {
    return api.get('/verifications/pending');
  },

  // Admin: Approve verification
  approveVerification: async (id) => {
    return api.patch(`/verifications/${id}/approve`);
  },

  // Admin: Reject verification
  rejectVerification: async (id, reason) => {
    return api.patch(`/verifications/${id}/reject`, { reason });
  },

  // Admin: Get all verifications
  getAllVerifications: async (params) => {
    return api.get('/verifications', { params });
  },

  // Admin: Get verification stats
  getVerificationStats: async () => {
    return api.get('/verifications/stats');
  },
};
