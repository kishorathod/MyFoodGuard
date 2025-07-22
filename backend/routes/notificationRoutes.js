import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  getWasteStats,
  getAchievements,
  sendExpiringItemsNotification,
  sendWasteAlertNotification,
  sendWeeklyReport,
  generateReport,
  sendAchievementNotification,
  testEmailConfiguration,
  sendReportByEmail,
  clearAllNotifications,
  deleteNotification,
  markAllAsRead,
  sendTestEmail
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all notifications for the user
router.get("/", getNotifications);

// Mark notification as read
router.put("/:id/read", markNotificationAsRead);

// Mark all notifications as read
router.put("/read-all", markAllAsRead);

// Get notification statistics
router.get("/stats", getWasteStats);

// Get user achievements
router.get("/achievements", getAchievements);

// Email notification endpoints
router.post("/email/expiring/:userId", sendExpiringItemsNotification);
router.post("/email/waste-alert/:userId", sendWasteAlertNotification);
router.post("/email/weekly-report/:userId", sendWeeklyReport);
router.post("/email/achievement/:userId", sendAchievementNotification);

// Report generation endpoints
router.get("/reports/:userId", generateReport);
router.post("/reports/:userId/email", sendReportByEmail);

// Test email configuration
router.post("/email/test", testEmailConfiguration);

// Add test email endpoint for debugging
router.post('/email/test', sendTestEmail);

// Add this route for clearing all notifications
router.delete("/", clearAllNotifications);

// Add this route for deleting a single notification
router.delete('/:id', deleteNotification);

export default router; 