import apiClient from './apiClient';

const qs = params =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

export const activitiesApi = {
  /** { activities, summary, lastStepSyncAt } */
  today: () => apiClient.get('/activities'),
  detail: id => apiClient.get(`/activities/${id}`),
  /** Free members' active habits; returns the same shape as today() */
  selectHabits: habits => apiClient.put('/activities/selection', { habits }),
  logWater: () => apiClient.post('/activities/water/log'),
  logSleep: hours => apiClient.post('/activities/sleep/log', { hours }),
  startSession: id => apiClient.post(`/activities/${id}/sessions`),
  /** value: km for cycling, optional minutes otherwise */
  finishSession: (sessionId, value) => apiClient.post(`/activities/sessions/${sessionId}/finish`, value === undefined ? {} : { value }),
  cancelSession: sessionId => apiClient.post(`/activities/sessions/${sessionId}/cancel`),
};

export const challengesApi = {
  list: (filter = 'all') => apiClient.get(`/challenges?filter=${filter}`),
  detail: id => apiClient.get(`/challenges/${id}`),
  join: id => apiClient.post(`/challenges/${id}/join`),
};

export const leaderboardApi = {
  get: (period = 'weekly') => apiClient.get(`/leaderboard?period=${period}`),
};

export const badgesApi = {
  list: () => apiClient.get('/badges'),
};

export const statsApi = {
  me: () => apiClient.get('/users/me/stats'),
};

export const referralsApi = {
  get: () => apiClient.get('/referrals'),
};

export const marketplaceApi = {
  categories: () => apiClient.get('/marketplace/categories'),
  rewards: ({ category, q } = {}) => apiClient.get(`/marketplace/rewards?${qs({ category, q })}`),
  reward: id => apiClient.get(`/marketplace/rewards/${id}`),
  redeem: id => apiClient.post(`/marketplace/rewards/${id}/redeem`),
  redemptions: () => apiClient.get('/marketplace/redemptions'),
};

export const notificationsApi = {
  list: () => apiClient.get('/notifications'),
  unreadCount: () => apiClient.get('/notifications/unread-count'),
  read: id => apiClient.patch(`/notifications/${id}/read`),
  readAll: () => apiClient.post('/notifications/read-all'),
  remove: id => apiClient.delete(`/notifications/${id}`),
};

export const transactionsApi = {
  /** group: earned | redeemed | other */
  list: ({ page = 1, limit = 20, group } = {}) => apiClient.get(`/wallet/transactions?${qs({ page, limit, group })}`),
  get: id => apiClient.get(`/wallet/transactions/${id}`),
};
