import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSun, FiMoon, FiLogOut, FiUser, FiBell, FiHome, FiSettings, FiX, FiCheck, FiTrash2, FiPlusCircle } from "react-icons/fi";
import UserProfileModal from "./UserProfileModal";
import notificationService from '../../services/notificationService';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Apply dark mode on mount and when it changes
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchAllNotifications();
  }, [navigate]);

  // Exportable for use after inventory changes
  const fetchAllNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Only show live notifications, no manual actions
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Helper to get item names from notification
  const getItemNames = (notif) => {
    if (!notif.itemNames || notif.itemNames.length === 0) return notif.message;
    return notif.itemNames.join(', ');
  };

  // Helper to get a human-readable notification title
  const getNotificationTitle = (notif) => {
    if (notif.type === 'expiry_warning' && notif.itemNames && notif.itemNames.length > 0) {
      return `${notif.itemNames.join(', ')} ${notif.itemNames.length === 1 ? 'is' : 'are'} expiring soon`;
    }
    if (notif.type === 'low_stock' && notif.itemNames && notif.itemNames.length > 0) {
      return `${notif.itemNames.join(', ')} ${notif.itemNames.length === 1 ? 'is' : 'are'} low in stock`;
    }
    return notif.title;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    user = null;
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <FiHome className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FoodGuard
              </span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 transition-colors font-medium"
              >
                Home
              </Link>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Notifications"
              >
                <FiBell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {safeNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {safeNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Notifications</h3>
                    {safeNotifications.length > 0 && (
                      <button onClick={() => { setNotifications([]); }} title="Clear all" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><FiTrash2 /></button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><FiX className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : safeNotifications.length > 0 ? (
                      safeNotifications.map((notification, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{getNotificationTitle(notification)}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{getItemNames(notification)}</div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleString()}</div>
                          </div>
                          <button onClick={() => setNotifications(safeNotifications.filter((_, i) => i !== idx))} title="Delete" className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 ml-2"><FiTrash2 /></button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <FiSun className="h-5 w-5 text-yellow-500" />
              ) : (
                <FiMoon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* User Menu or Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || "User"}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                    
                    <button
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfileModal(true);
                      }}
                    >
                      <FiSettings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                    >
                      <FiLogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (if needed) */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/dashboard"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </nav>
  );
}
