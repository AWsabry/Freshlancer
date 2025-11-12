import api from './api';

export const profileService = {
  // Get anonymized profile
  getAnonymizedProfile: async (studentId, jobPostId) => {
    return api.post('/profiles/anonymized', { studentId, jobPostId });
  },

  // Unlock full profile (costs points)
  unlockProfile: async (studentId, jobPostId) => {
    return api.post('/profiles/unlock', { studentId, jobPostId });
  },

  // Check if profile is unlocked
  checkProfileAccess: async (studentId, jobPostId) => {
    return api.post('/profiles/check-access', { studentId, jobPostId });
  },

  // Get my unlocked profiles
  getMyUnlockedProfiles: async () => {
    return api.get('/profiles/unlocked');
  },

  // Get profile views (student)
  getMyProfileViews: async () => {
    return api.get('/profiles/views/me');
  },

  // Get profile view stats
  getProfileViewStats: async () => {
    return api.get('/profiles/stats');
  },
};
