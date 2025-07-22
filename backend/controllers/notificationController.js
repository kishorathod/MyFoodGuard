import FoodItem from "../models/FoodItem.js";
import User from "../models/User.js";
import emailService from '../services/emailService.js';
import reportService from '../services/reportService.js';
import foodService from '../services/foodService.js';
import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { logInfo, logError } from '../utils/logger.js';
import fs from 'fs';
import Notification from '../models/Notification.js';

// Notification types
const NOTIFICATION_TYPES = {
  EXPIRY_WARNING: 'expiry_warning',
  LOW_STOCK: 'low_stock',
  WASTE_ALERT: 'waste_alert',
  RECIPE_SUGGESTION: 'recipe_suggestion',
  ACHIEVEMENT: 'achievement'
};

// Calculate waste statistics
const calculateWasteStats = (items) => {
  const today = new Date();
  const expiredItems = items.filter(item => new Date(item.expiryDate) < today);
  const expiringSoon = items.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  });
  
  return {
    totalItems: items.length,
    expiredItems: expiredItems.length,
    expiringSoon: expiringSoon.length,
    wastePercentage: items.length > 0 ? (expiredItems.length / items.length) * 100 : 0
  };
};

// Generate smart notifications
export const generateNotifications = async (userId) => {
  try {
    const items = await FoodItem.find({ userId });
    const user = await User.findById(userId);
    const today = new Date();
    const todayStr = today.toDateString();

    // Group items for each notification type
    const expiringItems = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });
    const urgentItems = expiringItems.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    });
    const lowStockItems = items.filter(item => parseInt(item.quantity) <= 2);

    // Helper to get item names
    const getNames = arr => arr.map(i => i.name).filter(Boolean);

    // Only one notification per type per day
    const notifications = [];
    if (expiringItems.length > 0) {
      notifications.push({
        type: NOTIFICATION_TYPES.EXPIRY_WARNING,
        title: urgentItems.length > 0 ? "🚨 Urgent: Items Expiring Today!" : "⚠️ Items Expiring Soon",
        message: urgentItems.length > 0
          ? `${getNames(urgentItems).join(', ')} will expire today. Use them quickly!`
          : `${getNames(expiringItems).join(', ')} will expire within 7 days.`,
        priority: urgentItems.length > 0 ? "high" : "medium",
        items: urgentItems.length > 0 ? urgentItems.map(i => i._id) : expiringItems.map(i => i._id),
        itemNames: urgentItems.length > 0 ? getNames(urgentItems) : getNames(expiringItems),
        timestamp: today
      });
    }
    if (lowStockItems.length > 0) {
      notifications.push({
        type: NOTIFICATION_TYPES.LOW_STOCK,
        title: "📦 Low Stock Alert",
        message: `${getNames(lowStockItems).join(', ')} are running low. Consider restocking.`,
        priority: "medium",
        items: lowStockItems.map(i => i._id),
        itemNames: getNames(lowStockItems),
        timestamp: today
      });
    }
    
    // Check for waste achievements
    const stats = calculateWasteStats(items);
    if (stats.wastePercentage < 10 && items.length >= 5) {
      notifications.push({
        type: NOTIFICATION_TYPES.ACHIEVEMENT,
        title: "🎉 Waste Reduction Champion!",
        message: `You've kept your waste rate below 10%. Great job!`,
        priority: "low",
        timestamp: today
      });
    }
    
    // Check for recipe opportunities
    const itemsForRecipes = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });
    
    if (itemsForRecipes.length >= 3) {
      notifications.push({
        type: NOTIFICATION_TYPES.RECIPE_SUGGESTION,
        title: "🍳 Recipe Opportunity!",
        message: `You have ${itemsForRecipes.length} items expiring soon. Check out recipe suggestions!`,
        priority: "medium",
        items: itemsForRecipes.map(item => item._id),
        itemNames: getNames(itemsForRecipes),
        timestamp: today
      });
    }
    
    return notifications;
    
  } catch (error) {
    console.error("Error generating notifications:", error);
    return [];
  }
};

// Get all notifications for user (persistent) with pagination
export const getNotifications = async (req, res) => {
  try {
    const items = await FoodItem.find({ userId: req.user._id });
    const today = new Date();

    // Group items for each notification type
    const expiringItems = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });
    const lowStockItems = items.filter(item => parseInt(item.quantity) <= 2);

    // Helper to get item names
    const getNames = arr => arr.map(i => i.name).filter(Boolean);

    const notifications = [];
    if (expiringItems.length > 0) {
      notifications.push({
        type: 'expiry_warning',
        title: '⚠️ Items Expiring Soon',
        message: `${getNames(expiringItems).join(', ')} will expire within 7 days.`,
        priority: 'medium',
        items: expiringItems.map(i => i._id),
        itemNames: getNames(expiringItems),
        timestamp: today
      });
    }
    if (lowStockItems.length > 0) {
      notifications.push({
        type: 'low_stock',
        title: '📦 Low Stock Alert',
        message: `${getNames(lowStockItems).join(', ')} are running low. Consider restocking.`,
        priority: 'medium',
        items: lowStockItems.map(i => i._id),
        itemNames: getNames(lowStockItems),
        timestamp: today
      });
    }

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to get notifications" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ 
      message: "Notification marked as read",
      notification 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ 
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

// Delete notification (persistent)
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.deleteOne({ _id: id, userId: req.user._id });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// Create notification (for testing)
export const createNotification = async (req, res) => {
  try {
    const { type, title, message, priority } = req.body;
    
    const notification = {
      type: type || NOTIFICATION_TYPES.EXPIRY_WARNING,
      title: title || "Test Notification",
      message: message || "This is a test notification",
      priority: priority || "medium",
      timestamp: new Date()
    };
    
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
};

// Legacy functions for backward compatibility
export const getUserNotifications = async (req, res) => {
  return getNotifications(req, res);
};

export const markNotificationAsRead = async (req, res) => {
  return markAsRead(req, res);
};

// Get waste statistics
export const getWasteStats = async (req, res) => {
  try {
    const items = await FoodItem.find({ userId: req.user._id });
    const stats = calculateWasteStats(items);
    
    // Calculate monthly trends
    const monthlyStats = await calculateMonthlyStats(req.user._id);
    
    res.json({
      current: stats,
      monthly: monthlyStats
    });
  } catch (error) {
    console.error("Error getting waste stats:", error);
    res.status(500).json({ message: "Failed to get waste statistics" });
  }
};

// Calculate monthly statistics
const calculateMonthlyStats = async (userId) => {
  try {
    const items = await FoodItem.find({ userId });
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Items added this month
    const addedThisMonth = items.filter(item => 
      new Date(item.addedAt) >= thisMonth
    ).length;
    
    // Items expired this month
    const expiredThisMonth = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= thisMonth && expiryDate < today;
    }).length;
    
    // Items expiring this month
    const expiringThisMonth = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate < new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }).length;
    
    return {
      added: addedThisMonth,
      expired: expiredThisMonth,
      expiring: expiringThisMonth,
      wasteRate: addedThisMonth > 0 ? (expiredThisMonth / addedThisMonth) * 100 : 0
    };
  } catch (error) {
    console.error("Error calculating monthly stats:", error);
    return {
      added: 0,
      expired: 0,
      expiring: 0,
      wasteRate: 0
    };
  }
};

// Get achievements
export const getAchievements = async (req, res) => {
  try {
    const items = await FoodItem.find({ userId: req.user._id });
    const user = await User.findById(req.user._id);
    
    const achievements = [];
    const today = new Date();
    
    // Calculate various metrics
    const totalItems = items.length;
    const expiredItems = items.filter(item => new Date(item.expiryDate) < today);
    const wasteRate = totalItems > 0 ? (expiredItems.length / totalItems) * 100 : 0;
    
    // First item achievement
    if (totalItems >= 1) {
      achievements.push({
        id: "first_item",
        title: "First Steps",
        description: "Add your first food item",
        unlocked: true,
        progress: 100,
        icon: "🍎",
        points: 10
      });
    }
    
    // Waste warrior achievement
    if (wasteRate < 10 && totalItems >= 5) {
      achievements.push({
        id: "waste_warrior",
        title: "Waste Warrior",
        description: "Keep waste rate below 10%",
        unlocked: true,
        progress: 100,
        icon: "🛡️",
        points: 50
      });
    }
    
    // Inventory pro achievement
    if (totalItems >= 20) {
      achievements.push({
        id: "inventory_pro",
        title: "Inventory Pro",
        description: "Track 20+ items simultaneously",
        unlocked: true,
        progress: 100,
        icon: "📦",
        points: 75
      });
    }
    
    // Perfect week achievement
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const itemsAddedThisWeek = items.filter(item => 
      new Date(item.addedAt) >= thisWeek
    ).length;
    
    if (itemsAddedThisWeek >= 5) {
      achievements.push({
        id: "perfect_week",
        title: "Perfect Week",
        description: "Add 5+ items in a week",
        unlocked: true,
        progress: 100,
        icon: "⭐",
        points: 100
      });
    }
    
    // Calculate total points
    const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
    const level = Math.floor(totalPoints / 100) + 1;
    const experience = totalPoints % 100;
    
    res.json({
      achievements,
      stats: {
        totalPoints,
        level,
        experience,
        totalItems,
        wasteRate
      }
    });
    
  } catch (error) {
    console.error("Error getting achievements:", error);
    res.status(500).json({ message: "Failed to get achievements" });
  }
};

// Calculate streak days
const calculateStreakDays = (items) => {
  // This would calculate consecutive days of app usage
  // For now, return a mock value
  return 7;
}; 

// Send expiring items notification
export const sendExpiringItemsNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    // Get user details
    const userResult = await authService.getUserProfile(userId);
    if (!userResult.success) {
      return errorResponse(res, null, 'User not found', 404);
    }

    // Get expiring items
    const expiringResult = await foodService.getExpiringItems(userId, days);
    if (!expiringResult.success) {
      return errorResponse(res, null, expiringResult.error, expiringResult.statusCode || 500);
    }

    if (expiringResult.data.length === 0) {
      return successResponse(res, { message: 'No expiring items found' }, 'No expiring items to notify about');
    }

    // Send email notification
    const emailResult = await emailService.sendExpiringItemsNotification(userResult.data, expiringResult.data);
    
    if (emailResult.success) {
      logInfo('Expiring items notification sent', { userId, itemsCount: expiringResult.data.length });
      return successResponse(res, { 
        message: 'Notification sent successfully',
        itemsCount: expiringResult.data.length,
        messageId: emailResult.messageId
      }, 'Expiring items notification sent');
    } else {
      return errorResponse(res, null, emailResult.error, 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to send expiring items notification');
  }
};

// Send waste alert notification
export const sendWasteAlertNotification = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const userResult = await authService.getUserProfile(userId);
    if (!userResult.success) {
      return errorResponse(res, null, 'User not found', 404);
    }

    // Get food statistics
    const statsResult = await foodService.getFoodStats(userId);
    if (!statsResult.success) {
      return errorResponse(res, null, statsResult.error, statsResult.statusCode || 500);
    }

    const stats = statsResult.data;
    const wastePercentage = stats.totalItems > 0 ? (stats.expiredItems / stats.totalItems) * 100 : 0;

    // Only send alert if waste percentage is high (more than 20%)
    if (wastePercentage < 20) {
      return successResponse(res, { message: 'Waste percentage is acceptable' }, 'No waste alert needed');
    }

    const wasteStats = {
      totalItems: stats.totalItems,
      expiredItems: stats.expiredItems,
      wastePercentage,
      wastedValue: stats.expiredItems * 5 // Estimated $5 per item
    };

    // Send email notification
    const emailResult = await emailService.sendWasteAlertNotification(userResult.data, wasteStats);
    
    if (emailResult.success) {
      logInfo('Waste alert notification sent', { userId, wastePercentage });
      return successResponse(res, { 
        message: 'Waste alert sent successfully',
        wastePercentage: wastePercentage.toFixed(1),
        messageId: emailResult.messageId
      }, 'Waste alert notification sent');
    } else {
      return errorResponse(res, null, emailResult.error, 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to send waste alert notification');
  }
};

// Send weekly report
export const sendWeeklyReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const userResult = await authService.getUserProfile(userId);
    if (!userResult.success) {
      return errorResponse(res, null, 'User not found', 404);
    }

    // Get food items and statistics
    const [itemsResult, statsResult] = await Promise.all([
      foodService.getAllFoodItems(userId),
      foodService.getFoodStats(userId)
    ]);

    if (!itemsResult.success) {
      return errorResponse(res, null, itemsResult.error, itemsResult.statusCode || 500);
    }

    if (!statsResult.success) {
      return errorResponse(res, null, statsResult.error, statsResult.statusCode || 500);
    }

    const items = itemsResult.data;
    const stats = statsResult.data;

    // Calculate report data
    const today = new Date();
    const consumedItems = items.filter(item => new Date(item.expiryDate) < today).length;
    const wastedItems = stats.expiredItems;
    const wastePercentage = items.length > 0 ? (wastedItems / items.length) * 100 : 0;
    const moneySaved = items.length * 3 - wastedItems * 5; // Estimated savings

    const reportData = {
      totalItems: items.length,
      consumedItems,
      wastedItems,
      wastePercentage,
      moneySaved: Math.max(0, moneySaved),
      achievements: [
        'Completed weekly food tracking',
        'Reduced food waste',
        'Improved inventory management'
      ],
      recommendations: [
        'Plan meals before shopping',
        'Store food properly to extend shelf life',
        'Use our AI predictions for optimal quantities',
        'Check expiration dates regularly'
      ]
    };

    // Send email notification
    const emailResult = await emailService.sendWeeklyReport(userResult.data, reportData);
    
    if (emailResult.success) {
      logInfo('Weekly report sent', { userId });
      return successResponse(res, { 
        message: 'Weekly report sent successfully',
        messageId: emailResult.messageId,
        reportData
      }, 'Weekly report sent');
    } else {
      return errorResponse(res, null, emailResult.error, 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to send weekly report');
  }
};

// Generate and download report
export const generateReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'pdf', type = 'waste', startDate, endDate } = req.query;

    // Auto-expire items before generating report
    await autoExpireItems(userId);

    // Get food items and statistics
    const [itemsResult, statsResult] = await Promise.all([
      foodService.getAllFoodItems(userId),
      foodService.getFoodStats(userId)
    ]);

    // --- DEBUG LOGGING ---
    console.log('[Report] userId:', userId);
    let items = [];
    if (itemsResult.success) {
      items = itemsResult.data.items || [];
      console.log(`[Report] Items fetched: ${items.length}`);
      items.slice(0, 5).forEach((item, idx) => {
        console.log(`[Report] Item ${idx + 1}:`, item.name, item.expiryDate, item.status);
      });
    } else {
      console.log('[Report] Failed to fetch items:', itemsResult.error);
    }
    // --- END DEBUG LOGGING ---

    if (!itemsResult.success) {
      return errorResponse(res, null, itemsResult.error, itemsResult.statusCode || 500);
    }

    if (!statsResult.success) {
      return errorResponse(res, null, statsResult.error, statsResult.statusCode || 500);
    }

    const stats = statsResult.data;

    // Fix: define today before using it
    const today = new Date();

    // Extra debug: log all item dates
    items.forEach((item, idx) => {
      console.log(`[Report] Item ${idx + 1}: name=${item.name}, addedAt=${item.addedAt}, expiryDate=${item.expiryDate}, status=${item.status}`);
    });

    // Filter items by date range if and only if BOTH are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Filter by addedAt or expiryDate within range
      items = items.filter(item => {
        const addedAt = item.addedAt ? new Date(item.addedAt) : null;
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
        // Include if either addedAt or expiryDate is within the range
        return (
          (addedAt && addedAt >= start && addedAt <= end) ||
          (expiryDate && expiryDate >= start && expiryDate <= end)
        );
      });
      console.log(`[Report] Items after date filter: ${items.length}`);
    } else {
      // No date filter: include all items
      console.log('[Report] No date filter applied, including all items');
    }

    // Calculate report data
    const consumedItems = items.filter(item => item.status === "consumed");
    const wastedItems = items.filter(item => item.status === "expired" || item.status === "wasted");
    const wastePercentage = items.length > 0 ? (wastedItems.length / items.length) * 100 : 0;
    // Money saved: sum of price*quantity for consumed
    const moneySaved = consumedItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    // Potential saved: total value - wasted value
    const totalValue = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    const wastedValue = wastedItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    const potentialSaved = totalValue - wastedValue;

    // Calculate waste by category
    const wasteByCategory = {};
    items.forEach(item => {
      if (new Date(item.expiryDate) < today) {
        wasteByCategory[item.category] = (wasteByCategory[item.category] || 0) + 1;
      }
    });

    const wasteByCategoryArray = Object.entries(wasteByCategory).map(([name, count]) => ({
      name,
      count,
      percentage: (count / wastedItems) * 100
    }));

    const reportData = {
      totalItems: items.length,
      consumedItems: consumedItems.length,
      wastedItems: wastedItems.length,
      wastePercentage,
      moneySaved: Math.max(0, moneySaved),
      potentialSaved: Math.max(0, potentialSaved),
      items,
      wasteByCategory: wasteByCategoryArray,
      expiringItems: items.filter(item => {
        const daysLeft = Math.ceil((new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft >= 0;
      }),
      recommendations: [
        'Plan meals before shopping',
        'Store food properly to extend shelf life',
        'Use AI predictions for optimal quantities',
        'Check expiration dates regularly',
        'Freeze items before they expire'
      ]
    };

    let reportResult;

    // Generate report based on format
    switch (format.toLowerCase()) {
      case 'pdf':
        reportResult = await reportService.generatePDFReport(userId, reportData, type);
        break;
      case 'excel':
        reportResult = await reportService.generateExcelReport(userId, reportData, type);
        break;
      case 'csv':
        reportResult = await reportService.generateCSVReport(userId, reportData, type);
        break;
      case 'json':
        reportResult = await reportService.generateComprehensiveReport(userId, reportData);
        break;
      default:
        return errorResponse(res, null, 'Unsupported format. Use pdf, excel, csv, or json', 400);
    }

    if (!reportResult.success) {
      return errorResponse(res, null, reportResult.error, 500);
    }

    // Set headers for file download
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${reportResult.filename}"`);

    if (format.toLowerCase() === 'json') {
      // Send JSON as a string
      res.send(JSON.stringify(reportResult.data, null, 2));
    } else {
      // Send file
      const fileStream = fs.createReadStream(reportResult.filepath);
      fileStream.pipe(res);
    }

    logInfo('Report generated and downloaded', { userId, format, type, filename: reportResult.filename });
  } catch (error) {
    return errorResponse(res, error, 'Failed to generate report');
  }
};

// Utility to auto-expire items before report generation
async function autoExpireItems(userId) {
  const now = new Date();
  await FoodItem.updateMany(
    { userId, status: 'active', expiryDate: { $lt: now } },
    { $set: { status: 'expired' } }
  );
}

// Get content type for different formats
const getContentType = (format) => {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
};

// Send achievement notification
export const sendAchievementNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { achievement } = req.body;

    if (!achievement || !achievement.title || !achievement.description) {
      return errorResponse(res, null, 'Achievement data is required', 400);
    }

    // Get user details
    const userResult = await authService.getUserProfile(userId);
    if (!userResult.success) {
      return errorResponse(res, null, 'User not found', 404);
    }

    // Send email notification
    const emailResult = await emailService.sendAchievementNotification(userResult.data, achievement);
    
    if (emailResult.success) {
      logInfo('Achievement notification sent', { userId, achievement: achievement.title });
      return successResponse(res, { 
        message: 'Achievement notification sent successfully',
        messageId: emailResult.messageId
      }, 'Achievement notification sent');
    } else {
      return errorResponse(res, null, emailResult.error, 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to send achievement notification');
  }
};

// Test email configuration
export const testEmailConfiguration = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, null, 'Email address is required', 400);
    }

    const testResult = await emailService.sendEmail(
      email,
      '🧪 Food Waste Tracker - Email Test',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🧪 Email Configuration Test</h2>
          <p>Hello!</p>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>If you received this email, your notification system is properly configured.</p>
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            Generated on: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    );

    if (testResult.success) {
      logInfo('Email configuration test successful', { email });
      return successResponse(res, { 
        message: 'Test email sent successfully',
        messageId: testResult.messageId
      }, 'Email configuration test successful');
    } else {
      return errorResponse(res, null, testResult.error, 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to send test email');
  }
}; 

export const sendReportByEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reportType = 'waste', startDate, endDate } = req.body;

    // Auto-expire items before generating report
    await autoExpireItems(userId);

    // 1. Get user details
    const userResult = await authService.getUserProfile(userId);
    if (!userResult.success) {
      return errorResponse(res, null, 'User not found', 404);
    }
    const user = userResult.data;

    // 2. Get food items and statistics (copy from generateReport)
    const [itemsResult, statsResult] = await Promise.all([
      foodService.getAllFoodItems(userId),
      foodService.getFoodStats(userId)
    ]);
    if (!itemsResult.success) {
      return errorResponse(res, null, itemsResult.error, itemsResult.statusCode || 500);
    }
    if (!statsResult.success) {
      return errorResponse(res, null, statsResult.error, statsResult.statusCode || 500);
    }
    let items = [];
    if (itemsResult.success) {
      items = itemsResult.data.items || [];
    }
    const stats = statsResult.data;
    const today = new Date();

    // Filter items by date range if and only if BOTH are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Filter by addedAt or expiryDate within range
      items = items.filter(item => {
        const addedAt = item.addedAt ? new Date(item.addedAt) : null;
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
        // Include if either addedAt or expiryDate is within the range
        return (
          (addedAt && addedAt >= start && addedAt <= end) ||
          (expiryDate && expiryDate >= start && expiryDate <= end)
        );
      });
      console.log(`[Email Report] Items after date filter: ${items.length}`);
    } else {
      // No date filter: include all items
      console.log('[Email Report] No date filter applied, including all items');
    }

    // Calculate consumed and wasted items as arrays
    const consumedItemsArr = items.filter(item => new Date(item.expiryDate) < today);
    const wastedItemsArr = items.filter(item => item.status === "expired" || item.status === "wasted");
    const wastePercentage = items.length > 0 ? (wastedItemsArr.length / items.length) * 100 : 0;
    // Money saved: sum of price*quantity for consumed
    const moneySaved = consumedItemsArr.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    // Potential saved: total value - wasted value
    const totalValue = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    const wastedValue = wastedItemsArr.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    const potentialSaved = totalValue - wastedValue;
    const wasteByCategory = {};
    items.forEach(item => {
      if (new Date(item.expiryDate) < today) {
        wasteByCategory[item.category] = (wasteByCategory[item.category] || 0) + 1;
      }
    });
    const wasteByCategoryArray = Object.entries(wasteByCategory).map(([name, count]) => ({
      name,
      count,
      percentage: (count / wastedItemsArr.length) * 100
    }));
    const reportData = {
      totalItems: items.length,
      consumedItems: consumedItemsArr.length,
      wastedItems: wastedItemsArr.length,
      wastePercentage,
      moneySaved: Math.max(0, moneySaved),
      potentialSaved: Math.max(0, potentialSaved),
      items,
      wasteByCategory: wasteByCategoryArray,
      expiringItems: items.filter(item => {
        const daysLeft = Math.ceil((new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft >= 0;
      }),
      recommendations: [
        'Plan meals before shopping',
        'Store food properly to extend shelf life',
        'Use AI predictions for optimal quantities',
        'Check expiration dates regularly',
        'Freeze items before they expire'
      ]
    };

    // 3. Generate the PDF report
    const reportResult = await reportService.generatePDFReport(userId, reportData, reportType);
    if (!reportResult.success) {
      return errorResponse(res, null, reportResult.error, 500);
    }

    // 4. Send the email with the PDF attached
    let emailResult;
    try {
      emailResult = await emailService.sendEmail(
        user.email,
        `Your ${reportType} report`,
        `<p>Attached is your requested ${reportType} report.</p>`,
        '',
        [{ filename: reportResult.filename, path: reportResult.filepath }]
      );
    } catch (emailError) {
      logError('Error sending report email', emailError);
      return res.status(500).json({ success: false, message: emailError.message || 'Failed to send report via email', error: emailError });
    }

    if (emailResult && emailResult.success) {
      // Try to delete the file, but do not throw if it fails
      try {
        const fs = await import('fs/promises');
        await fs.unlink(reportResult.filepath);
      } catch (cleanupError) {
        logError('Error deleting report file after email send', cleanupError);
        // Do not throw or return error here
      }
      logInfo('Report sent via email successfully', { userId, email: user.email });
      return res.json({ success: true, message: 'Report sent via email!' });
    } else {
      logError('Report email failed after sendEmail', emailResult?.error);
      return res.status(500).json({ success: false, message: emailResult?.error || 'Failed to send report via email', error: emailResult });
    }
  } catch (error) {
    logError('sendReportByEmail controller error', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send report via email', error });
  }
}; 

// Clear all notifications (persistent)
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear notifications" });
  }
}; 

// Add a test email endpoint for debugging
export const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, null, 'Email address is required', 400);
    }
    const testResult = await emailService.sendEmail(
      email,
      '🧪 Food Waste Tracker - Email Test',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🧪 Email Configuration Test</h2>
        <p>Hello!</p>
        <p>This is a test email to verify that your email configuration is working correctly.</p>
        <p>If you received this email, your notification system is properly configured.</p>
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          Generated on: ${new Date().toLocaleString()}
        </p>
      </div>`
    );
    if (testResult.success) {
      logInfo('Test email sent successfully', { email });
      return successResponse(res, { message: 'Test email sent successfully', messageId: testResult.messageId }, 'Test email sent');
    } else {
      logError('Test email failed', testResult.error, { email });
      return errorResponse(res, null, testResult.error, 500);
    }
  } catch (error) {
    logError('Test email endpoint error', error);
    return errorResponse(res, error, 'Failed to send test email');
  }
}; 