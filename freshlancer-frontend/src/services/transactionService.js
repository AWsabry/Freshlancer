import api from './api';

export const transactionService = {
  // Get my transactions
  getMyTransactions: async (params) => {
    return api.get('/transactions/me', { params });
  },

  // Get single transaction
  getTransaction: async (id) => {
    return api.get(`/transactions/${id}`);
  },

  // Get transaction summary
  getTransactionSummary: async () => {
    return api.get('/transactions/summary');
  },

  // Admin: Get all transactions
  getAllTransactions: async (params) => {
    return api.get('/transactions', { params });
  },

  // Admin: Get revenue stats
  getRevenueStats: async (startDate, endDate) => {
    return api.get('/transactions/revenue-stats', {
      params: { startDate, endDate },
    });
  },

  // Admin: Process refund
  processRefund: async (id, reason) => {
    return api.post(`/transactions/${id}/refund`, { reason });
  },

  // Admin: Update transaction status
  updateTransactionStatus: async (id, status, adminNotes) => {
    return api.patch(`/transactions/${id}/status`, { status, adminNotes });
  },
};
