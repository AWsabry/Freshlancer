import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: !!authService.getCurrentUser(),

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const response = await authService.login(email, password);
    set({ user: response.data.user, isAuthenticated: true });
    return response;
  },

  register: async (userData) => {
    const response = await authService.register(userData);
    set({ user: response.data.user, isAuthenticated: true });
    return response;
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (userData) => set((state) => ({
    user: { ...state.user, ...userData }
  })),
}));
