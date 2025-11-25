import api from './api';

export const adminService = {
  // Dashboard stats
  getDashboardStats: async () => {
    return api.get('/admin/stats');
  },

  // Users management
  getAllUsers: async (params = {}) => {
    return api.get('/admin/users', { params });
  },

  getUserById: async (id) => {
    return api.get(`/admin/users/${id}`);
  },

  toggleUserSuspension: async (id, reason) => {
    return api.patch(`/admin/users/${id}/suspend`, { reason });
  },

  toggleUserVerification: async (id) => {
    return api.patch(`/admin/users/${id}/verify`);
  },

  deleteUser: async (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // Applications overview
  getAllApplications: async (params = {}) => {
    return api.get('/admin/applications', { params });
  },

  // Jobs overview
  getAllJobs: async (params = {}) => {
    return api.get('/admin/jobs', { params });
  },

  // Students verification management
  getStudentsWithVerification: async (params = {}) => {
    return api.get('/admin/students/verification', { params });
  },

  approveVerificationDocument: async (documentId, adminNotes = '') => {
    return api.patch(`/admin/verifications/${documentId}/approve`, { adminNotes });
  },

  rejectVerificationDocument: async (documentId, rejectionReason, adminNotes = '') => {
    return api.patch(`/admin/verifications/${documentId}/reject`, { rejectionReason, adminNotes });
  },
};
