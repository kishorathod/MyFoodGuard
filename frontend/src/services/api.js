import { logError, logInfo } from '../utils/logger.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('token');
  }

  // Get user data from localStorage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Set user data in localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Remove user data from localStorage
  removeUser() {
    localStorage.removeItem('user');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      logInfo(`API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      logInfo(`API Response: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        // Token expired or invalid
        this.removeAuthToken();
        this.removeUser();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        // Try to parse error as JSON, text, or blob
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          try {
            errorData = await response.text();
          } catch {
            errorData = {};
          }
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle different response types
      if (options.responseType === 'blob') {
        return await response.blob();
      } else if (options.responseType === 'text') {
        return await response.text();
      } else {
        return await response.json();
      }
    } catch (error) {
      logError('API Request failed', error, { endpoint, method: options.method });
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }
}

export default new ApiService(); 