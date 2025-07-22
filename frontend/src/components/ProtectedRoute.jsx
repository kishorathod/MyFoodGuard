import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService.js';
import toast from 'react-hot-toast';

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a tick to allow localStorage to update
      await new Promise(res => setTimeout(res, 0));
      const authenticated = authService.isAuthenticated();
      if (!authenticated) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      const isValid = await authService.ensureValidToken();
      setIsAuthenticated(isValid);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    toast.error('Session expired or authentication required. Please log in again.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
} 