import axios from 'axios';
import { isTokenExpired } from '../utils/jwtUtils';

const PUBLIC_URLS = ['/api/user/login', '/api/user/register', '/api/user/forgot-password', '/api/user/verify-otp', '/api/user/reset-password'];

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const isPublic = PUBLIC_URLS.some((url) => config.url?.startsWith(url));

  if (!isPublic) {
    let token = localStorage.getItem('token');

    if (!token) {
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('logoutReason', 'expired');
        window.location.href = '/login';
      }
      return Promise.reject(new axios.Cancel('No token'));
    }

    // Clean token if it already has Bearer prefix from backend
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
      localStorage.setItem('token', token); // Update storage with clean token
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('logoutReason', 'expired');
        window.location.href = '/login';
      }
      return Promise.reject(new axios.Cancel('Token expired'));
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('logoutReason', 'expired');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials) => {
  const response = await apiClient.post('/api/user/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  await apiClient.post('/api/user/register', userData);
};

export const updateUserInfo = async (id, info) => {
  await apiClient.patch(`/api/user/update-info/${id}`, info);
};

export const getUserInfo = async (id) => {
  try {
    const response = await apiClient.get(`/api/user/get-info/${id}`);
    fetch('http://localhost:9999', { method: 'POST', body: JSON.stringify({ type: 'success', data: response.data }) }).catch(() => {});
    return response.data;
  } catch (error) {
    const token = localStorage.getItem('token');
    fetch('http://localhost:9999', { method: 'POST', body: JSON.stringify({ type: 'error', id, tokenPrefix: token?.substring(0, 15), status: error.response?.status, data: error.response?.data }) }).catch(() => {});
    throw error;
  }
};

export const getAllUsers = async () => {
  const response = await apiClient.get('/api/user/get-all-users');
  return response.data;
};

export const deleteUser = async (id) => {
  await apiClient.delete(`/api/user/${id}`);
};

export const forgotPassword = async (email, requestId) => {
  const response = await apiClient.post('/api/user/forgot-password', null, {
    params: { email, requestId },
  });
  return response.data;
};

export const verifyOtp = async (requestId, otp) => {
  const response = await apiClient.post('/api/user/verify-otp', null, {
    params: { requestId, otp },
  });
  return response.data;
};

export const resetPassword = async (email, newPassword) => {
  const response = await apiClient.post('/api/user/reset-password', null, {
    params: { email, newPassword },
  });
  return response.data;
};

export default apiClient;
