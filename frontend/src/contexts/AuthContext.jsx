import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { logInfo, logError } from '../utils/logger.js';

// Create context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authHook = useAuth();

  // Sync auth hook state with context
  useEffect(() => {
    if (authHook.user !== state.user) {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: authHook.user });
    }
  }, [authHook.user, state.user]);

  useEffect(() => {
    if (authHook.loading !== state.loading) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: authHook.loading });
    }
  }, [authHook.loading, state.loading]);

  useEffect(() => {
    if (authHook.error !== state.error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: authHook.error });
    }
  }, [authHook.error, state.error]);

  // Wrapper functions that dispatch actions
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const result = await authHook.login(credentials);
      
      if (result.success) {
        logInfo('Login successful via context');
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
      }
      
      return result;
    } catch (error) {
      logError('Login error in context', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const result = await authHook.register(userData);
      
      if (result.success) {
        logInfo('Registration successful via context');
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
      }
      
      return result;
    } catch (error) {
      logError('Registration error in context', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    try {
      authHook.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      logInfo('Logout successful via context');
    } catch (error) {
      logError('Logout error in context', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Logout failed' });
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Add a function to refresh user from localStorage
  const refreshUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: JSON.parse(userStr) });
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
      }
    } catch (e) {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshToken: authHook.refreshToken,
    getUserProfile: authHook.getUserProfile,
    updateUserProfile: authHook.updateUserProfile,
    refreshUser, // Export refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 