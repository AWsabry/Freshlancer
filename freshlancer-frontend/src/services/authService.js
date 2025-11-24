import api from './api';

const clearAllCookies = () => {
  if (typeof document === 'undefined') return;

  const cookies = document.cookie ? document.cookie.split(';') : [];

  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
    // Clear cookie for current path
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    // Attempt to clear cookie for current domain as well
    if (typeof window !== 'undefined') {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }
  });
};

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

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    clearAllCookies();
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

  // Upload resume
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post('/users/uploadResume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Update user in localStorage with new resume info
    if (response.data?.resume) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.studentProfile) {
        user.studentProfile.resume = response.data.resume;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }

    return response;
  },

  // Delete resume
  deleteResume: async () => {
    const response = await api.delete('/users/deleteResume');

    // Update user in localStorage to remove resume
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.studentProfile) {
      user.studentProfile.resume = undefined;
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response;
  },
};
