import { useState } from "react";
import { FiEdit, FiTrash2, FiGift, FiEye, FiCalendar, FiPackage, FiTrendingUp, FiAlertTriangle } from "react-icons/fi";

export default function InventoryTable({ items, onEdit, onDelete, onDonate, onConsume }) {
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === "expiryDate") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "expired", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", icon: FiAlertTriangle };
    } else if (diffDays <= 3) {
      return { status: "urgent", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", icon: FiAlertTriangle };
    } else if (diffDays <= 7) {
      return { status: "warning", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: FiCalendar };
    } else {
      return { status: "good", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", icon: FiTrendingUp };
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      dairy: "🥛",
      fruits: "🍎",
      vegetables: "🥬",
      meat: "🥩",
      grains: "🌾",
      beverages: "🥤",
      snacks: "🍿",
      other: "📦"
    };
    return icons[category] || "📦";
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No items in inventory
        </h3>
        <p className="text-gray-500 dark:text-gray-500 mb-6">
          Start by adding your first food item to begin tracking
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Inventory ({items.length} items)
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="quantity">Quantity</option>
            <option value="expiryDate">Expiry Date</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedItems.map((item) => {
                const name = typeof item.name === 'string' ? item.name : '';
                const description = typeof item.description === 'string' ? item.description : 'No description';
                const category = typeof item.category === 'string' ? item.category : 'other';
                const quantity = typeof item.quantity === 'number' || typeof item.quantity === 'string' ? item.quantity : '';
                const unit = typeof item.unit === 'string' ? item.unit : 'units';
                const expiryDate = item.expiryDate ? new Date(item.expiryDate) : new Date();
                const expiryStatus = getExpiryStatus(item.expiryDate);
                const StatusIcon = expiryStatus.icon;

                return (
                  <tr key={item._id || name + Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {name.length > 0 ? name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {name || 'Unnamed'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {description}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(category)}</span>
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {category}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiPackage className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {quantity} {unit}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) + ' days left' : 'No date'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.bg}`}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${expiryStatus.color}`} />
                        <span className={expiryStatus.color}>
                          {expiryStatus.status === "expired" && "Expired"}
                          {expiryStatus.status === "urgent" && "Urgent"}
                          {expiryStatus.status === "warning" && "Warning"}
                          {expiryStatus.status === "good" && "Good"}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors p-1 rounded"
                          title="Edit item"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onDonate(item)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors p-1 rounded"
                          title="Donate item"
                        >
                          <FiGift className="h-4 w-4" />
                        </button>
                        {/* Mark as Consumed button: only show if not expired or already consumed */}
                        {item.status !== 'consumed' && expiryStatus.status !== 'expired' && (
                          <button
                            onClick={() => onConsume(item)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors p-1 rounded"
                            title="Mark as Consumed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (item._id) {
                              onDelete(item._id);
                            } else {
                              alert('Cannot delete: Item ID is missing.');
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors p-1 rounded"
                          title="Delete item"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiPackage className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Items</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiTrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Good Status</p>
              <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                {items.filter(item => getExpiryStatus(item.expiryDate).status === "good").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiCalendar className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Expiring Soon</p>
              <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                {items.filter(item => {
                  const status = getExpiryStatus(item.expiryDate);
                  return status.status === "warning" || status.status === "urgent";
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Expired</p>
              <p className="text-lg font-semibold text-red-900 dark:text-red-100">
                {items.filter(item => getExpiryStatus(item.expiryDate).status === "expired").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
