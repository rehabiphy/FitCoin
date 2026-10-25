import apiClient from './apiClient';

/** Minutes east of UTC on this phone (IST = 330) so the server knows the user's local date. */
export const tzOffset = () => -new Date().getTimezoneOffset();

export const stepsApi = {
  /** days: [{ date: 'YYYY-MM-DD', steps }] -> { days, fitAwarded, today, wallet } */
  sync: days => apiClient.post('/steps/sync', { tzOffset: tzOffset(), source: 'android_sensor', days }),

  today: () => apiClient.get(`/steps/today?tzOffset=${tzOffset()}`),

  history: (days = 7) => apiClient.get(`/steps/history?days=${days}&tzOffset=${tzOffset()}`),
};

export const walletApi = {
  summary: () => apiClient.get(`/wallet?tzOffset=${tzOffset()}`),

  transactions: ({ page = 1, limit = 20, type } = {}) =>
    apiClient.get(`/wallet/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),

  transaction: id => apiClient.get(`/wallet/transactions/${encodeURIComponent(id)}`),
};
