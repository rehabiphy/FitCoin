import apiClient from './apiClient';

export const premiumApi = {
  /** { plan, status, habits, canPurchase } — plan values are set in the admin panel */
  get: () => apiClient.get('/premium'),
  /** { user, plan, status, habits, canPurchase } */
  upgrade: () => apiClient.post('/premium/upgrade'),
};
