import React, { useState } from 'react';
import notificationService from '../../services/notificationService';
import { toast } from 'react-hot-toast';

const ReportDownload = () => {
  const [reportType, setReportType] = useState('waste');
  const [dateRange, setDateRange] = useState('all-time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const reportTypes = [
    { value: 'waste', label: 'Waste Report', description: 'Detailed food waste analysis' },
    { value: 'inventory', label: 'Inventory Report', description: 'Current inventory status' },
    { value: 'expiry', label: 'Expiry Report', description: 'Items expiring soon' },
    { value: 'consumption', label: 'Consumption Report', description: 'Food consumption patterns' },
    { value: 'comprehensive', label: 'Comprehensive Report', description: 'Complete overview with all data' }
  ];

  const dateRanges = [
    { value: 'all-time', label: 'All Time', description: 'Include all your data' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleDownload = async (format) => {
    try {
      setIsLoading(true);
      
      let startDate, endDate;
      
      if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          toast.error('Please select both start and end dates for custom range');
          return;
        }
        startDate = customStartDate;
        endDate = customEndDate;
      } else if (dateRange === 'all-time') {
        // For "All Time", don't send date parameters
        startDate = null;
        endDate = null;
      } else {
        // Calculate dates based on range
        const now = new Date();
        switch (dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          default:
            startDate = customStartDate;
            endDate = customEndDate;
        }
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;
      const response = await notificationService.downloadReport(
        reportType,
        format,
        startDate,
        endDate,
        userId
      );

      if (response.success) {
        toast.success(`${reportType} report downloaded successfully!`);
      } else {
        toast.error(response.message || 'Failed to download report');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailReport = async () => {
    try {
      setIsLoading(true);
      
      let startDate, endDate;
      
      if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          toast.error('Please select both start and end dates for custom range');
          return;
        }
        startDate = customStartDate;
        endDate = customEndDate;
      } else if (dateRange === 'all-time') {
        // For "All Time", don't send date parameters
        startDate = null;
        endDate = null;
      } else {
        const now = new Date();
        switch (dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          default:
            startDate = customStartDate;
            endDate = customEndDate;
        }
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;
      const response = await notificationService.sendEmailReport(
        reportType,
        startDate,
        endDate,
        userId
      );

      if (response.success) {
        toast.success('Report sent to your email successfully!');
      } else {
        toast.error(response.message || 'Failed to send report');
      }
    } catch (error) {
      console.error('Email report error:', error);
      toast.error('Failed to send report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background rounded-lg shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Download Reports</h3>
          <p className="text-muted-foreground mt-1">Generate and download detailed reports in various formats</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Report Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reportTypes.map((type) => (
            <div
              key={type.value}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                reportType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-border hover:border-blue-300 dark:hover:border-blue-400'
              }`}
              onClick={() => setReportType(type.value)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                {reportType === type.value && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Date Range
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                dateRange === range.value
                  ? range.value === 'all-time'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-blue-500 text-white'
                  : 'bg-secondary text-foreground hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/20'
              }`}
              onClick={() => setDateRange(range.value)}
              title={range.description}
            >
              {range.value === 'all-time' && (
                <div className="flex items-center justify-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{range.label}</span>
                </div>
              )}
              {range.value !== 'all-time' && range.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>
        )}
      </div>

      {/* Download Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-secondary dark:bg-gray-900 border border-border rounded-lg">
          <div>
            <h4 className="font-medium text-foreground">Download Formats</h4>
            <p className="text-sm text-muted-foreground">Choose your preferred format</p>
          </div>
          <div className="flex space-x-2">
            {['pdf', 'excel', 'csv'].map((format) => (
              <button
                key={format}
                onClick={() => handleDownload(format)}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Downloading...</span>
                  </div>
                ) : (
                  format.toUpperCase()
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Email Report */}
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div>
            <h4 className="font-medium text-foreground">Email Report</h4>
            <p className="text-sm text-muted-foreground">Get the report delivered to your email</p>
          </div>
          <button
            onClick={handleEmailReport}
            disabled={isLoading}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Send Email</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">Report Preview</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Type:</strong> {reportTypes.find(t => t.value === reportType)?.label}</p>
          <p><strong>Range:</strong> {dateRanges.find(r => r.value === dateRange)?.label}</p>
          {dateRange === 'custom' && customStartDate && customEndDate && (
            <p><strong>Custom Range:</strong> {customStartDate} to {customEndDate}</p>
          )}
          {dateRange === 'all-time' && (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Comprehensive Report</span>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400 mt-1">
                This report will include all your food items, waste data, and analytics from the beginning of your tracking history.
              </p>
            </div>
          )}
          <p><strong>Available Formats:</strong> PDF, Excel, CSV</p>
        </div>
      </div>
    </div>
  );
};

export default ReportDownload; 