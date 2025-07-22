import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { logInfo, logError } from '../utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated && currentUser) {
          setUser(currentUser);
          logInfo('User authenticated on mount', { userId: currentUser._id });
        } else {
          setUser(null);
          logInfo('No authenticated user found on mount');
        }
      } catch (error) {
        logError('Error initializing auth state', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Attempting login', { email: credentials.email });
      
      const result = await authService.login(credentials);
      
      if (result.success) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        logInfo('Login successful', { userId: currentUser?._id });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        logError('Login failed', null, { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Login error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Attempting registration', { email: userData.email });
      
      const result = await authService.register(userData);
      
      if (result.success) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        logInfo('Registration successful', { userId: currentUser?._id });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        logError('Registration failed', null, { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Registration error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      logInfo('Attempting logout');
      
      await authService.logout();
      setUser(null);
      setError(null);
      
      logInfo('Logout successful');
    } catch (error) {
      logError('Logout error', error);
      // Still clear local state even if backend logout fails
      setUser(null);
      setError(null);
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      if (result.success) {
        logInfo('Token refreshed successfully');
        return { success: true, token: result.token };
      } else {
        logError('Token refresh failed', null, { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      logError('Token refresh error', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get user profile function
  const getUserProfile = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        return { success: true, data: currentUser };
      } else {
        return { success: false, error: 'No authenticated user' };
      }
    } catch (error) {
      logError('Get user profile error', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Update user profile function
  const updateUserProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Attempting profile update', { fields: Object.keys(profileData) });
      
      const result = await authService.updateUserProfile(profileData);
      
      if (result.success) {
        // Update local state with new user data
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        logInfo('Profile update successful', { userId: currentUser?._id });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        logError('Profile update failed', null, { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Profile update error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    getUserProfile,
    updateUserProfile,
  };
}; 