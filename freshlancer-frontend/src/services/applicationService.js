import api from './api';

export const applicationService = {
  // Apply to job
  applyToJob: async (applicationData) => {
    const { jobPost, ...data } = applicationData;
    return api.post(`/applications/apply/${jobPost}`, data);
  },

  // Get my applications
  getMyApplications: async (params) => {
    return api.get('/applications', { params });
  },

  // Get single application
  getApplication: async (id) => {
    return api.get(`/applications/${id}`);
  },

  // Get applications for my job (client)
  getJobApplications: async (jobId) => {
    return api.get(`/applications/job/${jobId}`);
  },

  // Withdraw application
  withdrawApplication: async (id) => {
    return api.patch(`/applications/${id}/withdraw`);
  },

  // Client: Accept application
  acceptApplication: async (id) => {
    return api.patch(`/applications/${id}/accept`);
  },

  // Client: Reject application
  rejectApplication: async (id, reason) => {
    return api.patch(`/applications/${id}/reject`, { reason });
  },

  // Client: Shortlist application
  shortlistApplication: async (id) => {
    return api.patch(`/applications/${id}/shortlist`);
  },

  // Client: Unlock student contact (costs 10 points)
  unlockContact: async (id) => {
    return api.patch(`/applications/${id}/unlock-contact`);
  },
};
