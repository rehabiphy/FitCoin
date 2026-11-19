import apiClient from './apiClient';

// All responses resolve to the server's `data` object: { user, tokens } for sign-in calls

export const authApi = {
  register: ({ name, email, password, phone, referralCode }) =>
    apiClient.post('/auth/register', { name, email, password, phone, referralCode }, { auth: false }),

  login: ({ email, password }) => apiClient.post('/auth/login', { email, password }, { auth: false }),

  google: idToken => apiClient.post('/auth/google', { idToken }, { auth: false }),

  /** fcmToken: this phone's push token, so the server stops sending it notifications */
  logout: (refreshToken, fcmToken) =>
    apiClient.post('/auth/logout', fcmToken ? { refreshToken, fcmToken } : { refreshToken }, { auth: false }),

  logoutAll: () => apiClient.post('/auth/logout-all'),

  me: () => apiClient.get('/auth/me'),
};

export const userApi = {
  updateProfile: ({ name, phone, avatar }) => apiClient.patch('/users/me', { name, phone, avatar }),

  changePassword: ({ currentPassword, newPassword }) =>
    apiClient.patch('/users/me/password', { currentPassword, newPassword }),
};
