import axios from 'axios';

// Create a configured Axios instance
// All API calls use this instance — never import axios directly
// This way base URL and headers are configured in one place
const api = axios.create({
  // import.meta.env.VITE_API_URL reads from the .env file
  // Falls back to localhost:3000 if not set
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — runs before every request is sent
// Automatically attaches the JWT token to every request
// So we never need to manually add the Authorization header
api.interceptors.request.use((config) => {
  // localStorage.getItem() reads the token we saved on login
  const token = localStorage.getItem('token');
  if (token) {
    // Bearer token format is the standard for JWT authentication
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — runs after every response is received
// Handles auth errors globally so we don't repeat this in every component
api.interceptors.response.use(
  // Success — just return the response unchanged
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Re-throw the error so individual components can handle it too
    return Promise.reject(error);
  }
);

export default api;