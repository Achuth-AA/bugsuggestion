import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('idToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  confirm:       (data) => api.post('/auth/confirm', data),
  login:         (data) => api.post('/auth/login', data),
  forgotPassword:(data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const ridesAPI = {
  search:      (params) => api.get('/rides/search', { params }),
  create:      (data)   => api.post('/rides', data),
  getById:     (id)     => api.get(`/rides/${id}`),
  myRides:     ()       => api.get('/rides/driver/my'),
  cancel:      (id)     => api.patch(`/rides/${id}/cancel`),
};

export const bookingsAPI = {
  book:        (data)   => api.post('/bookings', data),
  cancel:      (data)   => api.post('/bookings/cancel', data),
  myBookings:  ()       => api.get('/bookings/my'),
  rideBookings:(rideId) => api.get(`/bookings/ride/${rideId}`),
};

export const usersAPI = {
  me:              ()     => api.get('/users/me'),
  update:          (data) => api.patch('/users/me', data),
  uploadPhoto:     (form) => api.post('/users/me/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const adminAPI = {
  stats:           ()       => api.get('/admin/stats'),
  users:           (params) => api.get('/admin/users', { params }),
  deactivateUser:  (id)     => api.patch(`/admin/users/${id}/deactivate`),
  activateUser:    (id)     => api.patch(`/admin/users/${id}/activate`),
  rides:           (params) => api.get('/admin/rides', { params }),
  deleteRide:      (id)     => api.delete(`/admin/rides/${id}`),
};

export default api;
