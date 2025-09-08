import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiPlus, FiSearch, FiFilter, FiCamera, FiBarChart2, FiAward, FiCalendar, FiBell, FiGift, FiUsers, FiHeart, FiX, FiHome, FiTrendingUp, FiSmile, FiDownload, FiCheck, FiShield } from "react-icons/fi";
import Navbar from "../components/dashboard/Navbar";
import InventoryTable from "../components/dashboard/InventoryTable";
import AddEditForm from "../components/dashboard/AddEditForm";
import ExpiringAlert from "../components/dashboard/ExpiringAlert";
import RecipesGrid from "../components/dashboard/RecipesGrid";
import AnalyticsChart from "../components/dashboard/AnalyticsChart";
import SmartRecipes from "../components/dashboard/SmartRecipes";
import CameraOCR from "../components/dashboard/CameraOCR";
import Gamification from "../components/dashboard/Gamification";
import ExpiryCalendar from "../components/dashboard/ExpiryCalendar";
import ReportDownload from "../components/dashboard/ReportDownload";
import { toast } from 'react-hot-toast';
import foodService from "../services/foodService";
import clsx from 'clsx';

// Helper: Safe date parsing
function safeDate(date) {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}
// Helper: Ensure item has valid status
function ensureStatus(item) {
  return { ...item, status: item.status || 'active' };
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [notifications, setNotifications] = useState([]);
  const [donationItems, setDonationItems] = useState([]);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check authentication on component mount
  useEffect(() => {
    // Remove Google OAuth redirect logic from here, keep only authentication and data fetching
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    console.log("🔍 Auth Check - Token:", token ? "exists" : "missing");
    console.log("🔍 Auth Check - User:", user ? "exists" : "missing");
    
    if (!token || !user) {
      console.log("No authentication found, redirecting to login");
      navigate("/login");
      return;
    }

    // Validate token format
    try {
      const userData = JSON.parse(user);
      console.log("🔍 Auth Check - User Data:", userData);
      if (!userData.email) {
        console.log("Invalid user data, redirecting to login");
        navigate("/login");
        return;
      }
    } catch (error) {
      console.log("Error parsing user data, redirecting to login");
      navigate("/login");
      return;
    }

    console.log("✅ Authentication validated, fetching data...");
    // Ensure fetchItems is called after login as well as on mount
    fetchItems();
    fetchNotifications();
  }, [navigate]);

  // Fetch items from backend
  const fetchItems = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      const token = localStorage.getItem("token");
      
      console.log("🔍 Fetching items with token:", token ? "exists" : "missing");
      
      if (!token) {
        console.error("No authentication token found");
        navigate("/login");
        return;
      }

      const response = await fetch("/api/food", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔍 API Response Status:", response.status);
      console.log("🔍 API Response Headers:", Object.fromEntries(response.headers.entries()));

      if (response.status === 401) {
        console.error("Token expired or invalid");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 API Response Data:", data);
        setItems(Array.isArray(data.data) ? data.data : (data.data?.items || [])); // Support both array and paginated
      } else {
        console.error("Failed to fetch items:", response.status);
        const errorText = await response.text();
        console.log("🔍 API Error Response:", errorText);
        if (response.status === 404) {
          setAuthError(true);
        }
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new item
  const addItem = async (itemData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ensureStatus(itemData)),
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      if (response.ok) {
        const newItem = await response.json();
        setItems([...items, ensureStatus(newItem.data || newItem)]);
        setShowAddForm(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to add item: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Failed to add item. Please try again.");
    }
  };

  // Update item
  const updateItem = async (id, itemData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/food/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ensureStatus(itemData)),
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(item => item._id === id ? ensureStatus(updatedItem.data || updatedItem) : item));
        setEditingItem(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to update item: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Failed to update item. Please try again.");
    }
  };

  // Delete item
  const deleteItem = async (id) => {
    if (!id) {
      toast.error("Invalid item ID. Cannot delete.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/food/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      if (response.ok) {
        setItems(items.filter(item => item._id !== id));
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to delete item: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Failed to delete item. Please try again.");
    }
  };

  // Mark item as consumed and update in dashboard
  const consumeItem = async (item) => {
    if (!item || !item._id) {
      toast.error("Invalid item. Cannot mark as consumed.");
      return;
    }
    try {
      const result = await foodService.markAsConsumed(item._id);
      if (result.success) {
        // Update the item in the items array to status 'consumed'
        setItems(items.map(i => i._id === item._id ? { ...i, status: 'consumed' } : i));
        toast.success("Item marked as consumed!");
      } else {
        toast.error(result.error || "Failed to mark item as consumed.");
      }
    } catch (error) {
      toast.error("Failed to mark item as consumed. Please try again.");
    }
  };

  // Handle expiry date detection from camera
  const handleExpiryDateDetected = (expiryDate) => {
    setShowAddForm(true);
    localStorage.setItem("detectedExpiryDate", expiryDate);
  };

  // Get expiring items for smart recipes
  const getExpiringItems = () => {
    const today = new Date();
    return items.filter(item => {
      const expiryDate = safeDate(item.expiryDate);
      if (!expiryDate) return false;
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });
  };

  // Calculate statistics based on real data
  const calculateStats = (data) => {
    const today = new Date();
    const expiredItems = data.filter(item => new Date(item.expiryDate) < today);
    const expiringSoon = data.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });

    // Improved money saved logic: use 'consumed' status if available, else fallback to estimate
    let moneySaved = 0;
    if (data.length > 0 && data[0].status !== undefined) {
      // If status field exists, use it
      const consumedItems = data.filter(item => item.status === 'consumed');
      moneySaved = consumedItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + (price * item.quantity);
      }, 0);
    } else {
      // Fallback: estimate as total value minus expired value
      const totalValue = data.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + (price * item.quantity);
      }, 0);
      const wastedValue = expiredItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + (price * item.quantity);
      }, 0);
      moneySaved = totalValue - wastedValue;
    }

    return {
      totalItems: data.length,
      expiredItems: expiredItems.length,
      expiringSoon: expiringSoon.length,
      wastePercentage: data.length > 0 ? (expiredItems.length / data.length) * 100 : 0,
      currentStreak: data.length > 0 ? Math.min(data.length, 7) : 0,
      maxItems: data.length > 0 ? Math.max(...data.map(item => item.quantity), 0) : 0,
      recipesTried: 0, // Will be updated based on actual recipe usage
      moneySaved: Math.max(0, moneySaved),
      wasteCount: expiredItems.length,
      earlyChecks: data.length > 0 ? Math.floor(data.length / 2) : 0
    };
  };

  // Use only active items for inventory table, but all items for stats
  const activeItems = items.filter(item => !item.status || item.status === 'active');
  const stats = calculateStats(items);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.error("Token expired or invalid");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Ensure notifications is always an array
        setNotifications(Array.isArray(data) ? data : data.data || data.notifications || []);
      } else {
        // Only show real notifications, no dummy data
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  // Donation functions
  const addToDonation = (item) => {
    setDonationItems([...donationItems, item]);
  };

  const removeFromDonation = (itemId) => {
    setDonationItems(donationItems.filter(item => item._id !== itemId));
  };

  const submitDonation = async () => {
    try {
      // TODO: Implement backend donation tracking
      setDonationItems([]);
      setShowDonationModal(false);
    } catch (error) {
      toast.error("Error submitting donation.");
    }
  };

  // Filter items for dashboard: only show active (unconsumed) items
  const filteredItems = activeItems.filter(item => {
    const name = item && item.name ? item.name : "";
    const category = item && item.category ? item.category : "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-950 dark:via-gray-900 dark:to-blue-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-950 dark:via-gray-900 dark:to-blue-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please log in to access your dashboard and manage your food inventory.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state for new users
  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-950 dark:via-gray-900 dark:to-blue-950">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
          {/* Hero Mascot */}
          <div className="mb-8 flex flex-col items-center">
            <div className="text-7xl mb-4 animate-bounce-slow">🥦</div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-700 dark:text-white mb-2 text-center drop-shadow-xl">Welcome to FoodGuard!</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl text-center">
              Start your journey to reduce food waste. Add your first food item to begin tracking and get AI-powered insights to help you save money and the planet.
            </p>
            {/* Onboarding Checklist */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200 mb-3 flex items-center gap-2"><FiCheck className="inline" /> Getting Started Checklist</h3>
              <ul className="list-disc list-inside text-emerald-800 dark:text-emerald-100 space-y-1">
                <li>Add your first food item or scan a label</li>
                <li>Track expiry dates and get smart reminders</li>
                <li>Explore analytics, recipes, and donation options</li>
                <li>Save money and help the planet!</li>
              </ul>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4 w-full">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:from-emerald-600 hover:to-green-600 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-700 dark:hover:to-green-800 transition-all flex items-center justify-center space-x-2"
              >
                <FiPlus className="h-6 w-6" />
                <span>Add Your First Item</span>
              </button>
              <button
                onClick={() => setShowCamera(true)}
                className="border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center space-x-2"
              >
                <FiCamera className="h-6 w-6" />
                <span>Scan Item (Camera/OCR)</span>
              </button>
            </div>
            {/* Privacy Callout */}
            <div className="mt-2 mb-8 text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
              <span className="inline-flex items-center gap-1"><FiShield className="inline h-4 w-4" /> Your data is private and secure. Only you can see your inventory.</span>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-emerald-100 dark:border-emerald-900 hover:shadow-2xl transition-shadow">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-700 dark:text-emerald-200">AI-Powered Tracking</h3>
              <p className="text-muted-foreground">
                Get smart predictions about food expiry and usage patterns.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-blue-100 dark:border-blue-900 hover:shadow-2xl transition-shadow">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-200">Analytics & Insights</h3>
              <p className="text-muted-foreground">
                Track your waste reduction progress with beautiful analytics.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-orange-100 dark:border-orange-900 hover:shadow-2xl transition-shadow">
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-lg font-semibold mb-2 text-orange-700 dark:text-orange-200">Food Donation</h3>
              <p className="text-muted-foreground">
                Donate surplus food to local communities and shelters.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <button
              onClick={() => setActiveTab("history")}
              className="card p-4 hover:shadow-lg transition-shadow text-center"
            >
              <FiBarChart2 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold">View Analytics</h4>
            </button>
            <button
              onClick={() => setActiveTab("recipes")}
              className="card p-4 hover:shadow-lg transition-shadow text-center"
            >
              <FiAward className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-semibold">Smart Recipes</h4>
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className="card p-4 hover:shadow-lg transition-shadow text-center"
            >
              <FiCalendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-semibold">Expiry Calendar</h4>
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className="card p-4 hover:shadow-lg transition-shadow text-center"
            >
              <FiAward className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h4 className="font-semibold">Achievements</h4>
            </button>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <AddEditForm
            item={editingItem}
            onSubmit={editingItem ? (data) => updateItem(editingItem._id, data) : addItem}
            onClose={() => {
              setShowAddForm(false);
              setEditingItem(null);
            }}
          />
        )}

        {/* Camera OCR Modal */}
        {showCamera && (
          <CameraOCR
            onExpiryDateDetected={handleExpiryDateDetected}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    );
  }

  // Get user name and greeting based on time
  let userName = "User";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      userName = userObj.name || userObj.email?.split("@")[0] || "User";
    }
  } catch (e) {}

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  // Add a new tab for Analytics/History
  const dashboardTabs = [
    { id: "inventory", label: "Inventory", icon: FiPlus },
    { id: "history", label: "Analytics/History", icon: FiBarChart2 },
    { id: "recipes", label: "Recipes", icon: FiAward },
    { id: "calendar", label: "Calendar", icon: FiCalendar },
    { id: "achievements", label: "Achievements", icon: FiAward },
    { id: "reports", label: "Reports", icon: FiDownload }
  ];

  // Main dashboard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-pink-50 dark:from-green-950 dark:via-gray-900 dark:to-blue-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stunning Greeting */}
        <div className="mb-10">
          <div className={clsx(
            'relative overflow-hidden rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl border-4 border-transparent animate-fade-in group',
            'bg-gradient-to-r from-emerald-100 via-blue-100 to-pink-100',
            'dark:bg-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
          >
            {/* Floating Emoji */}
            <div className="relative z-10 flex items-center gap-4">
              <span className="text-5xl md:text-6xl animate-bounce-slow drop-shadow-xl">🌱</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-white drop-shadow-2xl tracking-tight mb-1 animate-fade-in-up">
                  {getGreeting()}, <span className="capitalize text-emerald-600 dark:text-emerald-200">{userName}</span>!
                </h1>
                <p className="text-base md:text-lg text-emerald-800 dark:text-emerald-100 font-medium animate-fade-in-up delay-100">
                  Welcome back to <span className="font-extrabold text-emerald-700 dark:text-white">FoodGuard</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Stat Cards */}
        <div className={clsx(
          'rounded-2xl border shadow-md p-4 mb-8 mt-8',
          'bg-gradient-to-r from-white via-blue-50 to-emerald-50 border-blue-100',
          'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
        >
          {/* In dark mode, use solid dark backgrounds for cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className={clsx(
              'rounded-xl shadow-md p-6 flex flex-col items-center border',
              'bg-gradient-to-r from-emerald-100 via-blue-100 to-pink-100 border-blue-200',
              'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
            >
              <div className="text-2xl font-bold text-blue-500">{stats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className={clsx(
              'rounded-xl shadow-md p-6 flex flex-col items-center border',
              'bg-gradient-to-br from-pink-100 via-white to-yellow-100 border-pink-200',
              'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
            >
              <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
            <div className={clsx(
              'rounded-xl shadow-md p-6 flex flex-col items-center border',
              'bg-gradient-to-br from-green-100 via-white to-blue-100 border-green-200',
              'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
            >
              <div className="text-2xl font-bold text-green-500">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className={clsx(
              'rounded-xl shadow-md p-6 flex flex-col items-center border',
              'bg-gradient-to-br from-purple-100 via-white to-pink-100 border-purple-200',
              'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
            >
              <div className="text-2xl font-bold text-purple-500">₹{stats.moneySaved?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-muted-foreground">Money Saved</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={clsx(
          'flex items-center space-x-1 rounded-lg p-1 mb-8 border',
          'bg-gradient-to-r from-emerald-100 via-blue-100 to-pink-100 border-emerald-200',
          'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
        >
          {dashboardTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm
                  ${activeTab === tab.id
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900 scale-105"
                    : "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-900 dark:hover:text-white"}
                `}
              >
                <Icon className="h-6 w-6" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "inventory" && (
          <>
            {/* Add Food Item & Donate Food Buttons */}
            <div className="flex justify-end mb-6 space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:from-emerald-600 hover:to-green-600 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-700 dark:hover:to-green-800 transition-all flex items-center space-x-2"
              >
                <FiPlus className="h-5 w-5" />
                <span>Add Food Item</span>
              </button>
              <button
                onClick={() => setShowCamera(true)}
                className="border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center space-x-2"
              >
                <FiCamera className="h-5 w-5" />
                <span>Scan Item (Camera/OCR)</span>
              </button>
              <button
                onClick={() => setShowDonationModal(true)}
                className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:from-emerald-500 hover:to-blue-600 dark:from-emerald-700 dark:to-blue-700 dark:hover:from-emerald-800 dark:hover:to-blue-800 transition-all flex items-center space-x-2"
              >
                <FiGift className="h-5 w-5" />
                <span>Donate Food</span>
              </button>
            </div>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                <option value="dairy">Dairy</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="meat">Meat</option>
                <option value="grains">Grains</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="other">Other</option>
              </select>
            </div>
            {/* Inventory Table */}
            <div className="mb-8">
              <div className={clsx(
                'rounded-2xl border shadow-md p-4 mb-8',
                'bg-gradient-to-r from-emerald-100 via-blue-100 to-pink-100 border-blue-100',
                'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
              >
                <InventoryTable
                  items={filteredItems}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setShowAddForm(true);
                  }}
                  onDelete={deleteItem}
                  onDonate={(item) => {
                    addToDonation(item);
                    setShowDonationModal(true);
                  }}
                  onConsume={consumeItem}
                />
              </div>
            </div>
            {/* Expiring Alerts */}
            <div className="mb-8">
              <div className={clsx(
                'rounded-2xl border shadow-md p-4 mb-8',
                'bg-gradient-to-r from-emerald-100 via-blue-100 to-pink-100 border-yellow-100',
                'dark:bg-gray-950 dark:border-gray-950 dark:bg-none dark:from-none dark:via-none dark:to-none')}
              >
                <ExpiringAlert items={activeItems} />
              </div>
            </div>
          </>
        )}
        {activeTab === "history" && (
          <AnalyticsChart data={items} />
        )}
        {activeTab === "recipes" && (
          <div className="space-y-6">
            <SmartRecipes expiringItems={activeItems.filter(item => {
              const today = new Date();
              const expiryDate = new Date(item.expiryDate);
              const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays >= 0;
            })} />
            <RecipesGrid />
          </div>
        )}

        {activeTab === "calendar" && (
          <ExpiryCalendar items={activeItems} />
        )}

        {activeTab === "achievements" && (
          <Gamification stats={stats} />
        )}

        {activeTab === "reports" && (
          <ReportDownload />
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <AddEditForm
          item={editingItem}
          onSubmit={editingItem ? (data) => updateItem(editingItem._id, data) : addItem}
          onClose={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Camera OCR Modal */}
      {showCamera && (
        <CameraOCR
          onExpiryDateDetected={handleExpiryDateDetected}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Donate Food</h2>
                <button
                  onClick={() => setShowDonationModal(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              {donationItems.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <span className="text-6xl mb-4">🎁</span>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Items Selected</h3>
                  <p className="text-lg text-muted-foreground mb-6 max-w-md">
                    You haven't selected any items to donate yet.<br />
                    Go back to your inventory and choose items to help local communities and shelters!
                  </p>
                  <button
                    onClick={() => setShowDonationModal(false)}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:from-green-600 hover:to-blue-600 transition-colors"
                  >
                    Back to Inventory
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-3">Selected Items</h3>
                      <div className="space-y-2">
                        {donationItems.map((item) => (
                          <div key={item._id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} | Expires: {new Date(item.expiryDate).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromDonation(item._id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Donation Centers</h3>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="font-medium">Local Food Bank</div>
                          <div className="text-sm text-muted-foreground">Accepts all food types</div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="font-medium">Community Shelter</div>
                          <div className="text-sm text-muted-foreground">Fresh produce preferred</div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="font-medium">Senior Center</div>
                          <div className="text-sm text-muted-foreground">Non-perishable items</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={submitDonation}
                      className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiHeart className="h-4 w-4" />
                      <span>Submit Donation</span>
                    </button>
                    <button
                      onClick={() => setShowDonationModal(false)}
                      className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
