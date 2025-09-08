import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with interceptors
const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token available');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          token: token
        });

        if (response.data.success) {
          // Update token in localStorage
          localStorage.setItem('token', response.data.token);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return authApi(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth service methods
export const authService = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Login with email/password
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      if (response.data.success || response.data.token) {
        const token = response.data.token || response.data.data?.token;
        const user = response.data.user || response.data.data?.user;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      if (response.data.success || response.data.token) {
        const token = response.data.token || response.data.data?.token;
        const user = response.data.user || response.data.data?.user;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      // Call logout endpoint
      await authApi.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Refresh token manually
  refreshToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        token: token
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        return { success: true, token: response.data.token };
      }

      return { success: false, error: 'Token refresh failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Token refresh failed' 
      };
    }
  },

  // Check token validity
  checkTokenValidity: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { valid: false, reason: 'No token' };
      }

      // Try to make a request to a protected endpoint
      const response = await authApi.get('/auth/profile');
      return { valid: true };
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, reason: 'Token expired' };
      }
      return { valid: false, reason: 'Network error' };
    }
  },

  // Auto-refresh token if needed
  ensureValidToken: async () => {
    const validity = await authService.checkTokenValidity();
    
    if (!validity.valid && validity.reason === 'Token expired') {
      const refreshResult = await authService.refreshToken();
      if (!refreshResult.success) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
    }
    
    return validity.valid;
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    try {
      const response = await authApi.put('/auth/profile', profileData);
      if (response.data && (response.data.success || response.data.user)) {
        // Update localStorage with new user data
        const user = response.data.user || response.data.data?.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return { success: true, data: response.data };
      }
      return { success: false, error: response.data?.message || 'Profile update failed' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed',
      };
    }
  }
};

// Export the configured axios instance for other services
export default authApi; 