import apiService from './api.js';
import { logInfo, logError, logSuccess } from '../utils/logger.js';

class NotificationService {
  // Send expiring items notification
  async sendExpiringItemsNotification(userId, days = 7) {
    try {
      logInfo('Sending expiring items notification', { userId, days });
      
      const response = await apiService.post(`/notifications/email/expiring/${userId}?days=${days}`);
      
      if (response.success) {
        logSuccess('Expiring items notification sent successfully', { userId, itemsCount: response.itemsCount });
        return { success: true, data: response };
      } else {
        logError('Failed to send expiring items notification', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Send expiring items notification error', error);
      return { success: false, error: error.message };
    }
  }

  // Send waste alert notification
  async sendWasteAlertNotification(userId) {
    try {
      logInfo('Sending waste alert notification', { userId });
      
      const response = await apiService.post(`/notifications/email/waste-alert/${userId}`);
      
      if (response.success) {
        logSuccess('Waste alert notification sent successfully', { userId, wastePercentage: response.wastePercentage });
        return { success: true, data: response };
      } else {
        logError('Failed to send waste alert notification', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Send waste alert notification error', error);
      return { success: false, error: error.message };
    }
  }

  // Send weekly report
  async sendWeeklyReport(userId) {
    try {
      logInfo('Sending weekly report', { userId });
      
      const response = await apiService.post(`/notifications/email/weekly-report/${userId}`);
      
      if (response.success) {
        logSuccess('Weekly report sent successfully', { userId });
        return { success: true, data: response };
      } else {
        logError('Failed to send weekly report', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Send weekly report error', error);
      return { success: false, error: error.message };
    }
  }

  // Send achievement notification
  async sendAchievementNotification(userId, achievement) {
    try {
      logInfo('Sending achievement notification', { userId, achievement: achievement.title });
      
      const response = await apiService.post(`/notifications/email/achievement/${userId}`, { achievement });
      
      if (response.success) {
        logSuccess('Achievement notification sent successfully', { userId, achievement: achievement.title });
        return { success: true, data: response };
      } else {
        logError('Failed to send achievement notification', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Send achievement notification error', error);
      return { success: false, error: error.message };
    }
  }

  // Generate and download report
  async generateReport(userId, format = 'pdf', type = 'waste') {
    try {
      logInfo('Generating report', { userId, format, type });
      
      const response = await apiService.get(`/notifications/reports/${userId}?format=${format}&type=${type}`, {
        responseType: 'blob'
      });
      
      if (response) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_report_${userId}_${Date.now()}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        logSuccess('Report downloaded successfully', { userId, format, type });
        return { success: true };
      } else {
        logError('Failed to generate report', null, { userId, format, type });
        return { success: false, error: 'Failed to generate report' };
      }
    } catch (error) {
      logError('Generate report error', error, { userId, format, type });
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testEmailConfiguration(email) {
    try {
      logInfo('Testing email configuration', { email });
      
      const response = await apiService.post('/notifications/email/test', { email });
      
      if (response.success) {
        logSuccess('Email configuration test successful', { email });
        return { success: true, data: response };
      } else {
        logError('Email configuration test failed', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Test email configuration error', error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications
  async getNotifications() {
    try {
      logInfo('Fetching notifications');
      
      const response = await apiService.get('/notifications');
      
      if (response.success) {
        logSuccess('Notifications fetched successfully', { count: response.data.length });
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch notifications', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get notifications error', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      logInfo('Marking notification as read', { notificationId });
      
      const response = await apiService.put(`/notifications/${notificationId}/read`);
      
      if (response.success) {
        logSuccess('Notification marked as read', { notificationId });
        return { success: true, data: response };
      } else {
        logError('Failed to mark notification as read', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Mark notification as read error', error);
      return { success: false, error: error.message };
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      logInfo('Fetching notification statistics');
      
      const response = await apiService.get('/notifications/stats');
      
      if (response.success) {
        logSuccess('Notification statistics fetched successfully');
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch notification statistics', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get notification statistics error', error);
      return { success: false, error: error.message };
    }
  }

  // Get achievements
  async getAchievements() {
    try {
      logInfo('Fetching achievements');
      
      const response = await apiService.get('/notifications/achievements');
      
      if (response.success) {
        logSuccess('Achievements fetched successfully', { count: response.data.length });
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch achievements', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get achievements error', error);
      return { success: false, error: error.message };
    }
  }

  // Download report
  async downloadReport(reportType, format, startDate, endDate, userId) {
    try {
      logInfo('Downloading report', { reportType, format, startDate, endDate, userId });
      const isJson = format === 'json';
      
      // Build query parameters, only include dates if they are provided
      let queryParams = `type=${reportType}&format=${format}`;
      if (startDate && endDate) {
        queryParams += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await apiService.get(
        `/notifications/reports/${userId}?${queryParams}`,
        { responseType: isJson ? 'text' : 'blob' }
      );
      if (response) {
        let blob;
        let filename;
        
        if (startDate && endDate) {
          filename = `${reportType}_report_${startDate}_to_${endDate}.${format}`;
        } else {
          filename = `${reportType}_report_all_time.${format}`;
        }
        
        if (isJson) {
          // Ensure pretty JSON and correct MIME type
          let jsonString = response;
          try {
            // If response is already a string, try to pretty-print it
            const parsed = JSON.parse(response);
            jsonString = JSON.stringify(parsed, null, 2);
          } catch (e) {
            // If not valid JSON, just use as is
          }
          blob = new Blob([jsonString], { type: 'application/json' });
        } else {
          blob = new Blob([response]);
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        logSuccess('Report downloaded successfully', { reportType, format, startDate, endDate, userId });
        return { success: true };
      } else {
        logError('Failed to download report', null, { reportType, format, startDate, endDate, userId });
        return { success: false, error: 'Failed to download report' };
      }
    } catch (error) {
      logError('Download report error', error, { reportType, format, startDate, endDate, userId });
      return { success: false, error: error.message };
    }
  }

  // Send report via email
  async sendEmailReport(reportType, startDate, endDate, userId) {
    try {
      logInfo('Sending report via email', { reportType, startDate, endDate, userId });
      
      // Build request body, only include dates if they are provided
      const requestBody = { reportType };
      if (startDate && endDate) {
        requestBody.startDate = startDate;
        requestBody.endDate = endDate;
      }
      
      const response = await apiService.post(`/notifications/reports/${userId}/email`, requestBody);
      if (response.success) {
        logSuccess('Report sent via email successfully', { reportType, startDate, endDate, userId });
        return { success: true, data: response };
      } else {
        logError('Failed to send report via email', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Send email report error', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotificationService(); 