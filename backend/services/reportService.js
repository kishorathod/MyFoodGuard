import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import FoodItem from '../models/FoodItem.js';
import emailService from './emailService.js';
import { logInfo, logError } from '../utils/logger.js';

class ReportService {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.ensureReportsDirectory();
  }

  // Ensure reports directory exists
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generate PDF report
  async generatePDFReport(userId, reportData, reportType = 'waste') {
    try {
      // Ensure reports directory exists before every report
      this.ensureReportsDirectory();
      const doc = new PDFDocument();
      const filename = `${reportType}_report_${userId}_${Date.now()}.pdf`;
      const filepath = path.join(this.reportsDir, filename);
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add header
      doc.fontSize(24).text('Food Waste Tracker Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Add report content based on type
      if (reportType === 'waste') {
        this.addWasteReportContent(doc, reportData);
      } else if (reportType === 'inventory') {
        this.addInventoryReportContent(doc, reportData);
      } else if (reportType === 'analytics') {
        this.addAnalyticsReportContent(doc, reportData);
      }

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          logInfo('PDF report generated successfully', { filename, userId, filepath });
          resolve({ success: true, filepath, filename });
        });
        stream.on('error', (error) => {
          logError('PDF generation failed', error, { userId, filename, filepath, stack: error.stack });
          reject(error);
        });
      });
    } catch (error) {
      logError('PDF report generation error', error, { userId, stack: error.stack });
      return { success: false, error: error.message };
    }
  }

  // Add waste report content to PDF
  addWasteReportContent(doc, data) {
    doc.fontSize(18).text('Waste Analysis Report', { underline: true });
    doc.moveDown();

    // Summary section
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Items: ${data.totalItems}`);
    doc.text(`Items Consumed: ${data.consumedItems}`);
    doc.text(`Items Wasted: ${data.wastedItems}`);
    doc.text(`Waste Percentage: ${typeof data.wastePercentage === 'number' ? data.wastePercentage.toFixed(1) : '0.0'}%`);
    doc.text(`Money Saved: $${typeof data.moneySaved === 'number' ? data.moneySaved.toFixed(2) : '0.00'}`);
    if (typeof data.potentialSaved === 'number') {
      doc.text(`Potential Saved: $${data.potentialSaved.toFixed(2)}`);
    }
    doc.moveDown();

    // Waste by category
    if (data.wasteByCategory && data.wasteByCategory.length > 0) {
      doc.fontSize(14).text('Waste by Category', { underline: true });
      doc.moveDown();
      data.wasteByCategory.forEach(category => {
        doc.fontSize(12).text(`${category.name}: ${category.count} items (${typeof category.percentage === 'number' ? category.percentage.toFixed(1) : '0.0'}%)`);
      });
      doc.moveDown();
    }

    // --- NEW: Food Item Details Table ---
    if (data.items && data.items.length > 0) {
      doc.fontSize(14).text('All Food Items', { underline: true });
      doc.moveDown(0.5);
      doc.font('Courier').fontSize(10);
      // Table column positions
      const startX = doc.x;
      let y = doc.y;
      const colX = [startX, startX+80, startX+170, startX+210, startX+250, startX+340];
      // Header
      doc.text('Name', colX[0], y);
      doc.text('Category', colX[1], y);
      doc.text('Qty', colX[2], y);
      doc.text('Unit', colX[3], y);
      doc.text('Expiry Date', colX[4], y);
      doc.text('Status', colX[5], y);
      y += 15;
      // Rows
      data.items.forEach(item => {
        const status = item.status || (new Date(item.expiryDate) < new Date() ? 'Expired' : 'Active');
        doc.text(item.name, colX[0], y);
        doc.text(String(item.category || ''), colX[1], y);
        doc.text(String(item.quantity), colX[2], y);
        doc.text(String(item.unit || ''), colX[3], y);
        doc.text(new Date(item.expiryDate).toLocaleDateString(), colX[4], y);
        doc.text(status, colX[5], y);
        y += 13;
      });
      doc.moveDown();
      doc.font('Helvetica'); // Reset font
    }
    // --- END NEW ---

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      doc.fontSize(14).text('Recommendations', { underline: true });
      doc.moveDown();
      data.recommendations.forEach((rec, index) => {
        doc.fontSize(12).text(`${index + 1}. ${rec}`);
      });
    }
  }

  // Add inventory report content to PDF
  addInventoryReportContent(doc, data) {
    doc.fontSize(18).text('Inventory Report', { underline: true });
    doc.moveDown();

    // Current inventory
    doc.fontSize(14).text('Current Inventory', { underline: true });
    doc.moveDown();

    if (data.items && data.items.length > 0) {
      doc.font('Courier').fontSize(10);
      const startX = doc.x;
      let y = doc.y;
      const colX = [startX, startX+80, startX+170, startX+210, startX+250, startX+340];
      doc.text('Name', colX[0], y);
      doc.text('Category', colX[1], y);
      doc.text('Qty', colX[2], y);
      doc.text('Unit', colX[3], y);
      doc.text('Expiry Date', colX[4], y);
      doc.text('Status', colX[5], y);
      y += 15;
      data.items.forEach(item => {
        const status = item.status || (new Date(item.expiryDate) < new Date() ? 'Expired' : 'Active');
        doc.text(item.name, colX[0], y);
        doc.text(String(item.category || ''), colX[1], y);
        doc.text(String(item.quantity), colX[2], y);
        doc.text(String(item.unit || ''), colX[3], y);
        doc.text(new Date(item.expiryDate).toLocaleDateString(), colX[4], y);
        doc.text(status, colX[5], y);
        y += 13;
      });
      doc.moveDown();
      doc.font('Helvetica');
    }

    // Expiring items
    if (data.expiringItems && data.expiringItems.length > 0) {
      doc.fontSize(14).text('Items Expiring Soon', { underline: true });
      doc.moveDown();
      data.expiringItems.forEach(item => {
        const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        doc.fontSize(12).text(`• ${item.name} - ${daysLeft} days left`);
      });
    }
  }

  // Add analytics report content to PDF
  addAnalyticsReportContent(doc, data) {
    doc.fontSize(18).text('Analytics Report', { underline: true });
    doc.moveDown();

    // Trends
    doc.fontSize(14).text('Waste Trends', { underline: true });
    doc.moveDown();

    if (data.trends && data.trends.length > 0) {
      data.trends.forEach(trend => {
        doc.fontSize(12).text(`${trend.period}: ${trend.wastePercentage.toFixed(1)}% waste`);
      });
      doc.moveDown();
    }

    // Achievements
    if (data.achievements && data.achievements.length > 0) {
      doc.fontSize(14).text('Achievements', { underline: true });
      doc.moveDown();

      data.achievements.forEach(achievement => {
        doc.fontSize(12).text(`🏆 ${achievement.title}`);
        doc.fontSize(10).text(`   ${achievement.description}`);
        doc.moveDown(0.5);
      });
    }
  }

  // Generate Excel report
  async generateExcelReport(userId, reportData, reportType = 'waste') {
    try {
      const workbook = new ExcelJS.Workbook();
      const filename = `${reportType}_report_${userId}_${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);

      // Add summary worksheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 20 },
        { header: 'Value', key: 'value', width: 15 }
      ];

      summarySheet.addRow({ metric: 'Total Items', value: reportData.totalItems });
      summarySheet.addRow({ metric: 'Items Consumed', value: reportData.consumedItems });
      summarySheet.addRow({ metric: 'Items Wasted', value: reportData.wastedItems });
      summarySheet.addRow({ metric: 'Waste Percentage', value: `${reportData.wastePercentage.toFixed(1)}%` });
      summarySheet.addRow({ metric: 'Money Saved', value: `$${reportData.moneySaved.toFixed(2)}` });

      // Add items worksheet
      if (reportData.items && reportData.items.length > 0) {
        const itemsSheet = workbook.addWorksheet('Items');
        itemsSheet.columns = [
          { header: 'Name', key: 'name', width: 20 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Quantity', key: 'quantity', width: 10 },
          { header: 'Unit', key: 'unit', width: 10 },
          { header: 'Expiry Date', key: 'expiryDate', width: 15 },
          { header: 'Status', key: 'status', width: 15 }
        ];

        reportData.items.forEach(item => {
          const status = new Date(item.expiryDate) < new Date() ? 'Expired' : 'Active';
          itemsSheet.addRow({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            expiryDate: new Date(item.expiryDate).toLocaleDateString(),
            status
          });
        });
      }

      // Add waste by category worksheet
      if (reportData.wasteByCategory && reportData.wasteByCategory.length > 0) {
        const categorySheet = workbook.addWorksheet('Waste by Category');
        categorySheet.columns = [
          { header: 'Category', key: 'name', width: 20 },
          { header: 'Count', key: 'count', width: 10 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ];

        reportData.wasteByCategory.forEach(category => {
          categorySheet.addRow({
            name: category.name,
            count: category.count,
            percentage: `${category.percentage.toFixed(1)}%`
          });
        });
      }

      await workbook.xlsx.writeFile(filepath);
      logInfo('Excel report generated successfully', { filename, userId });
      return { success: true, filepath, filename };
    } catch (error) {
      logError('Excel report generation error', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Generate CSV report
  async generateCSVReport(userId, reportData, reportType = 'waste') {
    try {
      const filename = `${reportType}_report_${userId}_${Date.now()}.csv`;
      const filepath = path.join(this.reportsDir, filename);

      let csvData = [];
      
      if (reportType === 'waste') {
        csvData = [
          { metric: 'Total Items', value: reportData.totalItems },
          { metric: 'Items Consumed', value: reportData.consumedItems },
          { metric: 'Items Wasted', value: reportData.wastedItems },
          { metric: 'Waste Percentage', value: `${reportData.wastePercentage.toFixed(1)}%` },
          { metric: 'Money Saved', value: `$${reportData.moneySaved.toFixed(2)}` }
        ];

        // Add items data
        if (reportData.items && reportData.items.length > 0) {
          csvData.push({ metric: '', value: '' }); // Empty row
          csvData.push({ metric: 'Items Details', value: '' });
          csvData.push({ metric: 'Name', value: 'Category', quantity: 'Quantity', unit: 'Unit', expiryDate: 'Expiry Date', status: 'Status' });
          
          reportData.items.forEach(item => {
            const status = new Date(item.expiryDate) < new Date() ? 'Expired' : 'Active';
            csvData.push({
              metric: item.name,
              value: item.category,
              quantity: item.quantity,
              unit: item.unit,
              expiryDate: new Date(item.expiryDate).toLocaleDateString(),
              status
            });
          });
        }
      }

      const parser = new Parser();
      const csv = parser.parse(csvData);
      
      fs.writeFileSync(filepath, csv);
      logInfo('CSV report generated successfully', { filename, userId });
      return { success: true, filepath, filename };
    } catch (error) {
      logError('CSV report generation error', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Generate comprehensive report
  async generateComprehensiveReport(userId, reportData) {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        userId,
        summary: {
          totalItems: reportData.totalItems,
          consumedItems: reportData.consumedItems,
          wastedItems: reportData.wastedItems,
          wastePercentage: reportData.wastePercentage,
          moneySaved: reportData.moneySaved
        },
        items: reportData.items || [],
        wasteByCategory: reportData.wasteByCategory || [],
        trends: reportData.trends || [],
        achievements: reportData.achievements || [],
        recommendations: reportData.recommendations || []
      };

      const filename = `comprehensive_report_${userId}_${Date.now()}.json`;
      const filepath = path.join(this.reportsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      logInfo('Comprehensive report generated successfully', { filename, userId });
      return { success: true, filepath, filename };
    } catch (error) {
      logError('Comprehensive report generation error', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Get report file
  getReportFile(filename) {
    const filepath = path.join(this.reportsDir, filename);
    if (fs.existsSync(filepath)) {
      return { success: true, filepath };
    }
    return { success: false, error: 'Report file not found' };
  }

  // Clean old reports (older than 7 days)
  async cleanOldReports() {
    try {
      const files = fs.readdirSync(this.reportsDir);
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      files.forEach(file => {
        const filepath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filepath);
          logInfo('Old report file deleted', { file });
        }
      });
    } catch (error) {
      logError('Error cleaning old reports', error);
    }
  }

  // Generate personalized report data for a user
  async generateUserReport(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's food items from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const foodItems = await FoodItem.find({
        userId: userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Calculate statistics
      const totalItems = foodItems.length;
      const consumedItems = foodItems.filter(item => item.status === 'consumed');
      const wastedItems = foodItems.filter(item => item.status === 'wasted' || item.status === 'expired');
      const wastePercentage = totalItems > 0 ? (wastedItems.length / totalItems) * 100 : 0;
      // Money saved: sum of price*quantity for consumed
      const moneySaved = consumedItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
      // Potential saved: total value - wasted value
      const totalValue = foodItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
      const wastedValue = wastedItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
      const potentialSaved = totalValue - wastedValue;

      // Generate achievements
      const achievements = this.generateAchievements(wastePercentage, consumedItems.length, totalItems);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(wastePercentage, foodItems);

      return {
        user,
        reportData: {
          totalItems,
          consumedItems: consumedItems.length,
          wastedItems: wastedItems.length,
          wastePercentage,
          moneySaved,
          potentialSaved,
          achievements,
          recommendations,
          period: 'Last 30 Days'
        }
      };
    } catch (error) {
      logError('Error generating user report', error);
      throw error;
    }
  }

  // Generate achievements based on user performance
  generateAchievements(wastePercentage, consumedItems, totalItems) {
    const achievements = [];

    if (wastePercentage < 10) {
      achievements.push('🏆 Waste Warrior: Less than 10% food waste!');
    }
    if (wastePercentage < 5) {
      achievements.push('🌟 Zero Waste Hero: Exceptional waste reduction!');
    }
    if (consumedItems >= 20) {
      achievements.push('📊 Active Tracker: Tracked 20+ items this month');
    }
    if (totalItems >= 50) {
      achievements.push('📈 Dedicated User: Comprehensive food tracking');
    }
    if (wastePercentage === 0 && totalItems > 0) {
      achievements.push('🎯 Perfect Score: Zero waste this month!');
    }

    return achievements.length > 0 ? achievements : ['Keep tracking to unlock achievements!'];
  }

  // Generate personalized recommendations
  generateRecommendations(wastePercentage, foodItems) {
    const recommendations = [];

    if (wastePercentage > 20) {
      recommendations.push('Plan meals before shopping to reduce impulse buys');
      recommendations.push('Check expiration dates regularly and use items before they expire');
      recommendations.push('Store food properly to extend shelf life');
    }

    if (wastePercentage > 10) {
      recommendations.push('Use our AI predictions to buy optimal quantities');
      recommendations.push('Freeze items before they expire');
      recommendations.push('Create meal plans based on what you have');
    }

    // Category-specific recommendations
    const categories = foodItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const mostWastedCategory = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostWastedCategory) {
      recommendations.push(`Focus on reducing waste in ${mostWastedCategory[0]} category`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue your excellent waste reduction habits!');
      recommendations.push('Share your tips with friends and family');
    }

    return recommendations;
  }

  // Send automatic welcome report for new Google users
  async sendWelcomeReport(userId) {
    try {
      const { user, reportData } = await this.generateUserReport(userId);
      
      const subject = `🎉 Welcome to Food Waste Tracker - Your Personalized Report`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🎉 Welcome to Food Waste Tracker!</h2>
          <p>Hello ${user.name},</p>
          <p>Welcome to your personalized food waste tracking experience! We're excited to help you reduce food waste and save money.</p>
          
          <div style="background-color: #e8f5e8; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">🌱 Your Mission:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #155724;">
              <li>Track your food items and their expiration dates</li>
              <li>Reduce food waste through smart planning</li>
              <li>Save money by using food before it expires</li>
              <li>Get AI-powered recommendations for optimal purchases</li>
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📊 Getting Started:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Add your first food item to start tracking</li>
              <li>Set up your household preferences</li>
              <li>Enable notifications for expiring items</li>
              <li>Check your weekly reports for insights</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">💡 Pro Tips:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Take photos of your receipts for easy item entry</li>
              <li>Use our recipe suggestions for items nearing expiration</li>
              <li>Set up weekly reminders to check your inventory</li>
              <li>Share your progress with family members</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Tracking Now
            </a>
          </p>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            You'll receive weekly reports and important notifications at ${user.email}. 
            You can manage your email preferences in your account settings.
          </p>
        </div>
      `;

      const result = await emailService.sendEmail(user.email, subject, html);
      
      if (result.success) {
        logInfo('Welcome report sent successfully', { userId, email: user.email });
      } else {
        logError('Failed to send welcome report', { userId, email: user.email, error: result.error });
      }

      return result;
    } catch (error) {
      logError('Error sending welcome report', error, { userId });
      throw error;
    }
  }

  // Send automatic report for returning users
  async sendAutomaticReport(userId) {
    try {
      const { user, reportData } = await this.generateUserReport(userId);
      
      const subject = `📊 Your Food Waste Report - ${new Date().toLocaleDateString()}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">📊 Your Food Waste Report</h2>
          <p>Hello ${user.name},</p>
          <p>Here's your personalized food waste summary:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📈 ${reportData.period} Summary:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Total items tracked: ${reportData.totalItems}</li>
              <li>Items consumed: ${reportData.consumedItems}</li>
              <li>Items wasted: ${reportData.wastedItems + reportData.expiredItems}</li>
              <li>Waste percentage: ${reportData.wastePercentage.toFixed(1)}%</li>
              <li>Money impact: $${reportData.moneySaved.toFixed(2)}</li>
            </ul>
          </div>
          
          ${reportData.achievements.length > 0 ? `
            <div style="background-color: #e8f5e8; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">🎯 Achievements:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #155724;">
                ${reportData.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">💡 Recommendations:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Report
            </a>
          </p>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            This is an automated report from your Food Waste Tracker. 
            You can manage your email preferences in your account settings.
          </p>
        </div>
      `;

      const result = await emailService.sendEmail(user.email, subject, html);
      
      if (result.success) {
        logInfo('Automatic report sent successfully', { userId, email: user.email });
      } else {
        logError('Failed to send automatic report', { userId, email: user.email, error: result.error });
      }

      return result;
    } catch (error) {
      logError('Error sending automatic report', error, { userId });
      throw error;
    }
  }
}

export default new ReportService(); 