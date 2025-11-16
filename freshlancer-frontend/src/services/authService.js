import api from './api';

export const authService = {
  // Register
  register: async (userData) => {
    const response = await api.post('/users/signup', userData);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get current user from backend (fresh data)
  getMe: async () => {
    const response = await api.get('/users/me');
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.patch('/users/updateMe', data);
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return api.patch('/users/updatePassword', {
      passwordCurrent: currentPassword,
      password: newPassword,
      passwordConfirm: newPassword,
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return api.post('/users/forgotPassword', { email });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return api.patch(`/users/resetPassword/${token}`, {
      password,
      passwordConfirm: password,
    });
  },
};
