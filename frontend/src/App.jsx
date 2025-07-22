import React from "react";
import { Routes, Route, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { authService } from "./services/authService";
import { AuthProvider } from './contexts/AuthContext';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
            {(import.meta.env.MODE === 'development') && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-secondary rounded text-xs overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // --- BEGIN: Handle Google OAuth redirect globally ---
    const urlToken = searchParams.get('token');
    const userParam = searchParams.get('user');
    if (urlToken && userParam && location.pathname === "/dashboard") {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("token", urlToken);
        localStorage.setItem("user", JSON.stringify(user));
        window.history.replaceState({}, document.title, "/dashboard");
        window.location.reload(); // Force reload to ensure state is fresh
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    // --- END: Handle Google OAuth redirect globally ---
  }, [location, searchParams]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleError = (event) => {
      console.error("Global error:", event.error);
      setHasError(true);
    };

    // Set up automatic token refresh
    const setupTokenRefresh = () => {
      // Check token validity every 5 minutes
      const tokenCheckInterval = setInterval(async () => {
        if (authService.isAuthenticated()) {
          try {
            await authService.ensureValidToken();
          } catch (error) {
            console.error('Token refresh error:', error);
          }
        }
      }, 5 * 60 * 1000); // 5 minutes

      // Cleanup on unmount
      return () => clearInterval(tokenCheckInterval);
    };

    const cleanup = setupTokenRefresh();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      setHasError(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleError);
      cleanup();
    };
  }, []);

  // Handle network status
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-orange-500 text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold mb-4">No Internet Connection</h1>
          <p className="text-muted-foreground mb-6">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle global errors
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">💥</div>
          <h1 className="text-2xl font-bold mb-4">Application Error</h1>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app-container">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
