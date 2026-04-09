import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerPassenger = (data) => api.post('/api/auth/register/passenger', data);
export const registerDriver = (data) => api.post('/api/auth/register/driver', data);
export const loginPassenger = (data) => api.post('/api/auth/login/passenger', data);
export const loginDriver = (data) => api.post('/api/auth/login/driver', data);
export const getMe = () => api.get('/api/auth/me');

// Passenger
export const getPassengerProfile = () => api.get('/api/users/profile');
export const updatePassengerProfile = (data) => api.put('/api/users/profile', data);
export const getPassengerRides = (page = 1) => api.get(`/api/users/rides?page=${page}&limit=10`);
export const saveAddress = (data) => api.post('/api/users/saved-addresses', data);
export const deleteAddress = (id) => api.delete(`/api/users/saved-addresses/${id}`);

// Driver
export const getDriverProfile = () => api.get('/api/drivers/profile');
export const updateDriverProfile = (data) => api.put('/api/drivers/profile', data);
export const getDriverRides = (page = 1) => api.get(`/api/drivers/rides?page=${page}&limit=10`);
export const getEarnings = () => api.get('/api/drivers/earnings');
export const getCurrentRide = () => api.get('/api/drivers/current-ride');
export const getDriverStatus = () => api.get('/api/drivers/status');

// Rides
export const estimateFare = (data) => api.post('/api/rides/estimate', data);
export const requestRide = (data) => api.post('/api/rides/request', data);
export const getSharedRides = (vehicleType) => api.get(`/api/rides/shared/available?vehicleType=${vehicleType}`);
export const joinSharedRide = (rideId, data) => api.post(`/api/rides/${rideId}/join`, data);
export const getRideDetails = (rideId) => api.get(`/api/rides/${rideId}`);
export const cancelRide = (rideId, reason) => api.delete(`/api/rides/${rideId}/cancel`, { data: { reason } });
export const rateRide = (rideId, data) => api.post(`/api/rides/${rideId}/rate`, data);
export const getNearbyDrivers = (lat, lng, vehicleType) =>
  api.get(`/api/rides/nearby-drivers?lat=${lat}&lng=${lng}&vehicleType=${vehicleType}&radius=5`);

export default api;
