import nodemailer from 'nodemailer';
import { logInfo, logError } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send email notification
  async sendEmail(to, subject, html, text = '', attachments = []) {
    try {
      logInfo('Preparing to send email', {
        to,
        subject,
        attachments: attachments.map(a => a.filename || a.path),
        smtp: process.env.SMTP_HOST || 'default',
      });
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
        attachments
      };
      const info = await this.transporter.sendMail(mailOptions);
      logInfo('Email sent successfully', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logError('Email sending failed', error, {
        to,
        subject,
        attachments: attachments.map(a => a.filename || a.path),
        stack: error.stack,
        smtpResponse: error?.response,
        smtpCode: error?.code,
        smtpCommand: error?.command
      });
      console.error('Full email error:', error, error?.response);
      return { success: false, error: error.message };
    }
  }

  // Send expiring items notification
  async sendExpiringItemsNotification(user, expiringItems) {
    const subject = `🚨 Food Items Expiring Soon - ${expiringItems.length} items need attention`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🚨 Food Items Expiring Soon</h2>
        <p>Hello ${user.name},</p>
        <p>You have <strong>${expiringItems.length}</strong> food items that are expiring soon:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Category</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Expires</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Days Left</th>
            </tr>
          </thead>
          <tbody>
            ${expiringItems.map(item => {
              const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              const urgencyColor = daysLeft <= 1 ? '#e74c3c' : daysLeft <= 3 ? '#f39c12' : '#3498db';
              return `
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${item.category}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td style="padding: 12px; border: 1px solid #ddd; color: ${urgencyColor}; font-weight: bold;">
                    ${daysLeft} day${daysLeft !== 1 ? 's' : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">💡 Suggestions:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Use these items in recipes before they expire</li>
            <li>Consider donating items you won't use</li>
            <li>Check our smart recipe suggestions in the app</li>
            <li>Update your shopping list to avoid overbuying</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from your Food Waste Tracker.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Send waste alert notification
  async sendWasteAlertNotification(user, wasteStats) {
    const subject = `⚠️ High Food Waste Alert - ${wasteStats.wastePercentage.toFixed(1)}% waste detected`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e67e22;">⚠️ High Food Waste Alert</h2>
        <p>Hello ${user.name},</p>
        <p>We've detected that your food waste rate is <strong>${wasteStats.wastePercentage.toFixed(1)}%</strong> this week.</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">📊 Waste Statistics:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #856404;">
            <li>Total items: ${wasteStats.totalItems}</li>
            <li>Expired items: ${wasteStats.expiredItems}</li>
            <li>Waste percentage: ${wasteStats.wastePercentage.toFixed(1)}%</li>
            <li>Money wasted: $${wasteStats.wastedValue.toFixed(2)}</li>
          </ul>
        </div>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">🌱 Tips to Reduce Waste:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #155724;">
            <li>Plan meals before shopping</li>
            <li>Store food properly to extend shelf life</li>
            <li>Use our AI predictions to buy optimal quantities</li>
            <li>Check expiration dates regularly</li>
            <li>Freeze items before they expire</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Detailed Report
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from your Food Waste Tracker.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Send weekly report
  async sendWeeklyReport(user, reportData) {
    const subject = `📊 Weekly Food Waste Report - ${new Date().toLocaleDateString()}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📊 Weekly Food Waste Report</h2>
        <p>Hello ${user.name},</p>
        <p>Here's your weekly food waste summary:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">📈 This Week's Summary:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Total items tracked: ${reportData.totalItems}</li>
            <li>Items consumed: ${reportData.consumedItems}</li>
            <li>Items wasted: ${reportData.wastedItems}</li>
            <li>Waste percentage: ${reportData.wastePercentage.toFixed(1)}%</li>
            <li>Money saved: $${reportData.moneySaved.toFixed(2)}</li>
          </ul>
        </div>
        
        <div style="background-color: #e8f5e8; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">🎯 Achievements:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #155724;">
            ${reportData.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">💡 Recommendations:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #856404;">
            ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Report
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated weekly report from your Food Waste Tracker.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Send achievement notification
  async sendAchievementNotification(user, achievement) {
    const subject = `🏆 Achievement Unlocked: ${achievement.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">🏆 Achievement Unlocked!</h2>
        <p>Congratulations ${user.name}!</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">${achievement.title}</h3>
          <p style="color: #856404; margin-bottom: 0;">${achievement.description}</p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #f39c12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Achievement
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          Keep up the great work in reducing food waste!
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

export default new EmailService(); 