import api from './api';

export const jobService = {
  // Get all jobs
  getAllJobs: async (params) => {
    return api.get('/jobs', { params });
  },

  // Get single job
  getJob: async (id) => {
    return api.get(`/jobs/${id}`);
  },

  // Create job (client only)
  createJob: async (jobData) => {
    return api.post('/jobs', jobData);
  },

  // Update job
  updateJob: async (id, jobData) => {
    return api.patch(`/jobs/${id}`, jobData);
  },

  // Delete job
  deleteJob: async (id) => {
    return api.delete(`/jobs/${id}`);
  },

  // Get my jobs
  getMyJobs: async () => {
    return api.get('/jobs/me');
  },

  // Close job
  closeJob: async (id) => {
    return api.patch(`/jobs/${id}/close`);
  },

  // Invite student to job
  inviteStudent: async (jobId, studentId) => {
    return api.post(`/jobs/${jobId}/invite`, { studentId });
  },

  // Search jobs
  searchJobs: async (query, params) => {
    return api.get('/jobs/search', { params: { q: query, ...params } });
  },
};
