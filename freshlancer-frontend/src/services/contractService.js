import api from './api';

export const contractService = {
  // Create contract (client only)
  createContract: async (contractData) => {
    return api.post('/contracts', contractData);
  },

  // Get my contracts
  getMyContracts: async (params) => {
    return api.get('/contracts/me', { params });
  },

  // Get single contract
  getContract: async (id) => {
    return api.get(`/contracts/${id}`);
  },

  // Accept contract terms
  acceptContract: async (id) => {
    return api.patch(`/contracts/${id}/accept`);
  },

  // Submit milestone (student)
  submitMilestone: async (contractId, milestoneId, deliverables) => {
    return api.post(`/contracts/${contractId}/milestones/${milestoneId}/submit`, {
      deliverables,
    });
  },

  // Approve milestone (client)
  approveMilestone: async (contractId, milestoneId) => {
    return api.patch(`/contracts/${contractId}/milestones/${milestoneId}/approve`);
  },

  // Release milestone payment (client)
  releaseMilestonePayment: async (contractId, milestoneId) => {
    return api.post(`/contracts/${contractId}/milestones/${milestoneId}/release-payment`);
  },

  // Cancel contract
  cancelContract: async (id, reason) => {
    return api.post(`/contracts/${id}/cancel`, { reason });
  },
};
