import { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiAlertTriangle, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

export default function ExpiryCalendar({ items }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getItemsForDate = (date) => {
    return items.filter(item => {
      const itemDate = new Date(item.expiryDate);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "expired", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" };
    } else if (diffDays <= 3) {
      return { status: "urgent", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" };
    } else if (diffDays <= 7) {
      return { status: "warning", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" };
    } else {
      return { status: "good", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" };
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push(date);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Modern color/status mapping
  const statusStyles = {
    expired: {
      color: "text-red-700 dark:text-red-300",
      bg: "bg-red-100 dark:bg-red-900/60",
      badge: "bg-red-200 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700",
      icon: <FiAlertTriangle className="inline mr-1 text-red-500" />,
      label: "Expired"
    },
    urgent: {
      color: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-100 dark:bg-orange-900/60",
      badge: "bg-orange-200 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700",
      icon: <FiAlertTriangle className="inline mr-1 text-orange-500" />,
      label: "Expiring Soon"
    },
    warning: {
      color: "text-yellow-800 dark:text-yellow-200",
      bg: "bg-yellow-100 dark:bg-yellow-900/60",
      badge: "bg-yellow-200 dark:bg-yellow-900/80 text-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700",
      icon: <FiClock className="inline mr-1 text-yellow-500" />,
      label: "Expiring"
    },
    good: {
      color: "text-emerald-800 dark:text-emerald-200",
      bg: "bg-emerald-100 dark:bg-emerald-900/60",
      badge: "bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700",
      icon: <FiCheckCircle className="inline mr-1 text-emerald-500" />,
      label: "Fresh"
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expiry Calendar</h2>
        </div>

        <div className="text-center py-12">
          <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Items to Track
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Add some food items to see their expiry dates on the calendar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Expiry Calendar</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
            aria-label="Previous month"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold text-foreground min-w-[150px] text-center">
            {formatDate(currentDate)}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
            aria-label="Next month"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        {Object.entries(statusStyles).map(([key, val]) => (
          <div key={key} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded ${val.bg}`}></div>
            <span className="text-gray-600 dark:text-gray-400">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 bg-emerald-50 dark:bg-emerald-900/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-200 tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-3 border-b border-r border-gray-200 dark:border-gray-700"></div>;
            }

            const dayItems = getItemsForDate(date);
            const hasExpiringItems = dayItems.length > 0;
            const today = isToday(date);
            const selected = isSelected(date);

            return (
              <div
                key={index}
                className={`p-2 sm:p-3 border-b border-r border-gray-200 dark:border-gray-700 min-h-[80px] sm:min-h-[100px] cursor-pointer transition-colors rounded-none
                  ${selected ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400' : today ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10'}
                `}
                onClick={() => setSelectedDate(date)}
                tabIndex={0}
                aria-label={`Day ${date.getDate()}${hasExpiringItems ? ', has expiring items' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${today ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>{date.getDate()}</span>
                  {today && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                </div>
                {hasExpiringItems && (
                  <div className="space-y-1">
                    {dayItems.slice(0, 2).map((item, itemIndex) => {
                      const status = getExpiryStatus(item.expiryDate);
                      const style = statusStyles[status.status];
                      return (
                        <div
                          key={itemIndex}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge} truncate flex items-center gap-1`}
                          title={item.name}
                        >
                          {style.icon}{item.name}
                        </div>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">+{dayItems.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-200">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
              aria-label="Close details"
            >
              <FiX className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {getItemsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getItemsForDate(selectedDate).map((item) => {
                const status = getExpiryStatus(item.expiryDate);
                const style = statusStyles[status.status];
                const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={item._id} className={`flex items-center justify-between p-3 rounded-lg ${style.bg}`}>
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg`}>{style.icon}</span>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {item.name}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{style.label}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} {item.unit || 'units'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${style.color}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days expired` : `${daysLeft} days left`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No items expiring on this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 