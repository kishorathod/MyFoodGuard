import { useState } from "react";
import { FiAlertTriangle, FiX, FiClock, FiCalendar, FiTrendingUp } from "react-icons/fi";

export default function ExpiringAlert({ items }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  // Only show alerts for active (unconsumed) items
  const activeItems = items.filter(item => !item.status || item.status === 'active');

  const getExpiringItems = () => {
    const today = new Date();
    return activeItems.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    }).sort((a, b) => {
      const aDays = Math.ceil((new Date(a.expiryDate) - today) / (1000 * 60 * 60 * 24));
      const bDays = Math.ceil((new Date(b.expiryDate) - today) / (1000 * 60 * 60 * 24));
      return aDays - bDays;
    });
  };

  const getExpiredItems = () => {
    const today = new Date();
    return activeItems.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate < today;
    });
  };

  const getAlertType = (item) => {
    const today = new Date();
    const expiryDate = new Date(item.expiryDate);
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { type: "expired", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", icon: FiAlertTriangle };
    } else if (diffDays <= 1) {
      return { type: "urgent", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", icon: FiAlertTriangle };
    } else if (diffDays <= 3) {
      return { type: "warning", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", icon: FiClock };
    } else {
      return { type: "info", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", icon: FiCalendar };
    }
  };

  const dismissAlert = (itemId) => {
    setDismissedAlerts(prev => [...prev, itemId]);
  };

  const expiringItems = getExpiringItems();
  const expiredItems = getExpiredItems();
  const allAlerts = [...expiredItems, ...expiringItems].filter(item => !dismissedAlerts.includes(item._id));

  if (allAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Expired Items */}
      {expiredItems.filter(item => !dismissedAlerts.includes(item._id)).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  ⚠️ Expired Items ({expiredItems.filter(item => !dismissedAlerts.includes(item._id)).length})
                </h3>
                <div className="space-y-2">
                  {expiredItems
                    .filter(item => !dismissedAlerts.includes(item._id))
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item._id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 font-semibold text-sm">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Expired {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => dismissAlert(item._id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
                {expiredItems.filter(item => !dismissedAlerts.includes(item._id)).length > 3 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    +{expiredItems.filter(item => !dismissedAlerts.includes(item._id)).length - 3} more expired items
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Items */}
      {expiringItems.filter(item => !dismissedAlerts.includes(item._id)).length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <FiClock className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⏰ Expiring Soon ({expiringItems.filter(item => !dismissedAlerts.includes(item._id)).length})
                </h3>
                <div className="space-y-2">
                  {expiringItems
                    .filter(item => !dismissedAlerts.includes(item._id))
                    .slice(0, 3)
                    .map((item) => {
                      const alertType = getAlertType(item);
                      const AlertIcon = alertType.icon;
                      const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

                      return (
                        <div key={item._id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${alertType.bg} rounded-full flex items-center justify-center`}>
                              <AlertIcon className={`h-4 w-4 ${alertType.color}`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Expires {new Date(item.expiryDate).toLocaleDateString()} ({daysLeft} days left)
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => dismissAlert(item._id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>
                {expiringItems.filter(item => !dismissedAlerts.includes(item._id)).length > 3 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    +{expiringItems.filter(item => !dismissedAlerts.includes(item._id)).length - 3} more expiring items
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {allAlerts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FiTrendingUp className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Quick Actions
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Consider using these items in recipes or donating them to reduce waste
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
