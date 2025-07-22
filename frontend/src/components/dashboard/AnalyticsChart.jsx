import { useState, useEffect } from "react";
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiDollarSign, FiPackage, FiAlertTriangle, FiCalendar, FiPieChart, FiActivity, FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsChart({ data }) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedChartType, setSelectedChartType] = useState("bar");
  const [chartData, setChartData] = useState([]);
  const [showValue, setShowValue] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Process real data accurately
  const processRealData = (items, period) => {
    const today = new Date();
    const periods = { week: 7, month: 30, quarter: 90 };
    const days = periods[period];
    const processedData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Filter items added on this date
      const dayItems = items.filter(item => {
        if (!item.createdAt) return false;
        const itemDate = new Date(item.createdAt);
        return itemDate.toDateString() === date.toDateString();
      });

      // Filter items that expired on this date
      const expiredItems = items.filter(item => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        return expiryDate.toDateString() === date.toDateString() && expiryDate < today;
      });

      // Calculate accurate values
      const addedValue = dayItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);

      const expiredValue = expiredItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);

      processedData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        added: dayItems.length,
        expired: expiredItems.length,
        addedValue: Math.round(addedValue),
        expiredValue: Math.round(expiredValue),
        netValue: Math.round(addedValue - expiredValue)
      });
    }

    return processedData;
  };

  // Generate realistic sample data for demonstration
  const generateSampleData = (period) => {
    const periods = { week: 7, month: 30, quarter: 90 };
    const days = periods[period];
    const sampleData = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic patterns
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseAdded = isWeekend ? 3 : 2;
      const baseExpired = isWeekend ? 1 : 0;
      
      const added = Math.floor(Math.random() * 3) + baseAdded;
      const expired = Math.floor(Math.random() * 2) + baseExpired;
      const addedValue = (Math.random() * 300) + 150;
      const expiredValue = (Math.random() * 200) + 50;

      sampleData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        added,
        expired,
        addedValue: Math.round(addedValue),
        expiredValue: Math.round(expiredValue),
        netValue: Math.round(addedValue - expiredValue)
      });
    }

    return sampleData;
  };

  useEffect(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (data && data.length > 0) {
        const processed = processRealData(data, selectedPeriod);
        setChartData(processed);
      } else {
        const sample = generateSampleData(selectedPeriod);
        setChartData(sample);
      }
      setIsLoading(false);
    }, 500);
  }, [data, selectedPeriod]);

  const calculateAccurateStats = () => {
    if (!data || data.length === 0) {
      // Return sample stats for demonstration
      return {
        totalItems: 28,
        totalValue: 3247.50,
        expiredItems: 4,
        activeItems: 24,
        wastedValue: 187.25,
        avgExpiryDays: 14,
        wastePercentage: 14.3,
        savingsRate: 85.7,
        totalAdded: 32,
        totalExpired: 4
      };
    }

    const today = new Date();
    
    // Filter items accurately
    const expiredItems = data.filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) < today;
    });
    
    const activeItems = data.filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) >= today;
    });

    // Calculate values with proper quantity handling
    const totalValue = data.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    const wastedValue = expiredItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    const savedValue = Math.max(0, totalValue - wastedValue);
    
    // Calculate average expiry days for active items only
    const avgExpiryDays = activeItems.length > 0 ? activeItems.reduce((sum, item) => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, diffDays);
    }, 0) / activeItems.length : 0;

    return {
      totalItems: data.length,
      totalValue,
      expiredItems: expiredItems.length,
      activeItems: activeItems.length,
      wastedValue,
      savedValue,
      avgExpiryDays: Math.round(avgExpiryDays),
      wastePercentage: data.length > 0 ? (expiredItems.length / data.length) * 100 : 0,
      savingsRate: totalValue > 0 ? (savedValue / totalValue) * 100 : 0,
      totalAdded: data.length,
      totalExpired: expiredItems.length
    };
  };

  const getChartData = () => {
    if (chartData.length === 0) return null;

    const labels = chartData.map(item => item.date);
    const addedData = chartData.map(item => item.added);
    const expiredData = chartData.map(item => item.expired);
    const addedValueData = chartData.map(item => item.addedValue);
    const expiredValueData = chartData.map(item => item.expiredValue);

    const datasets = [
      {
        label: 'Items Added',
        data: addedData,
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 3,
        borderRadius: 8,
        tension: 0.4,
        fill: selectedChartType === 'area' ? true : false,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
      },
      {
        label: 'Items Expired',
        data: expiredData,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 3,
        borderRadius: 8,
        tension: 0.4,
        fill: selectedChartType === 'area' ? true : false,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
      }
    ];

    if (showValue) {
      datasets.push({
        label: 'Value Added (₹)',
        data: addedValueData,
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        borderRadius: 8,
        tension: 0.4,
        fill: selectedChartType === 'area' ? true : false,
        yAxisID: 'y1',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
      });
    }

    return {
      labels,
      datasets
    };
  };

  const getPieChartData = () => {
    const stats = calculateAccurateStats();
    return {
      labels: ['Active Items', 'Expired Items'],
      datasets: [
        {
          data: [stats.activeItems, stats.expiredItems],
          backgroundColor: [
            'rgba(34, 197, 94, 0.9)',
            'rgba(239, 68, 68, 0.9)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 4,
          hoverOffset: 12,
          hoverBorderWidth: 6,
        },
      ],
    };
  };

  const getDoughnutChartData = () => {
    const stats = calculateAccurateStats();
    return {
      labels: ['Saved Value', 'Wasted Value'],
      datasets: [
        {
          data: [stats.savedValue, stats.wastedValue],
          backgroundColor: [
            'rgba(34, 197, 94, 0.9)',
            'rgba(239, 68, 68, 0.9)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 4,
          hoverOffset: 12,
          hoverBorderWidth: 6,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          usePointStyle: true,
          padding: 25,
          font: {
            size: 13,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Value')) {
                label += '₹' + context.parsed.y.toFixed(2);
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
          drawBorder: false,
        }
      },
      y: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
          drawBorder: false,
        }
      },
      y1: {
        type: 'linear',
        display: showValue,
        position: 'right',
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          font: {
            size: 12,
            weight: '500'
          },
          callback: function(value) {
            return '₹' + value.toFixed(0);
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          usePointStyle: true,
          padding: 25,
          font: {
            size: 13,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 2,
        cornerRadius: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  const stats = calculateAccurateStats();

  const renderChart = () => {
    const chartData = getChartData();
    if (!chartData) return null;

    switch (selectedChartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} height={400} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} height={400} />;
      case 'area':
        return <Line data={chartData} options={chartOptions} height={400} />;
      default:
        return <Bar data={chartData} options={chartOptions} height={400} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <button
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all duration-200 transform hover:scale-105"
        >
          <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>
      {/* Controls */}
      <div className="bg-background rounded-xl p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
          </select>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">Chart:</span>
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showValue}
                onChange={() => setShowValue(!showValue)}
                id="showValue"
                className="form-checkbox h-4 w-4 text-emerald-600 border-border rounded focus:ring-emerald-500"
              />
              <label htmlFor="showValue" className="text-sm text-muted-foreground">Show Value</label>
            </div>
          </div>
        </div>
      </div>
      {/* Chart Area */}
      <div className="bg-background rounded-xl p-6 shadow-xl border border-border min-h-[400px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <FiBarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Add food items to see analytics and trends here.</p>
          </div>
        ) : (
          <div className="relative min-h-[400px]" style={{ height: 400 }}>
            {selectedChartType === 'pie' ? (
              <Pie data={getPieChartData()} options={pieChartOptions} height={400} />
            ) : selectedChartType === 'doughnut' ? (
              <Doughnut data={getDoughnutChartData()} options={pieChartOptions} height={400} />
            ) : (
              renderChart()
            )}
          </div>
        )}
      </div>
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary dark:bg-gray-900 border border-border rounded-xl p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-emerald-500">{stats.totalItems}</span>
          <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
        <div className="bg-secondary dark:bg-gray-900 border border-border rounded-xl p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-red-500">{stats.expiredItems}</span>
          <span className="text-sm text-muted-foreground">Expired Items</span>
            </div>
        <div className="bg-secondary dark:bg-gray-900 border border-border rounded-xl p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-500">₹{stats.totalValue?.toFixed(2) || '0.00'}</span>
          <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
        <div className="bg-secondary dark:bg-gray-900 border border-border rounded-xl p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-500">{stats.savingsRate?.toFixed(1) || '0.0'}%</span>
          <span className="text-sm text-muted-foreground">Savings Rate</span>
        </div>
      </div>
      {/* Recommendations */}
      <div className="bg-background rounded-xl p-8 shadow-xl border border-border">
        <h3 className="text-xl font-bold text-foreground mb-6">Smart Recommendations</h3>
        <div className="space-y-4">
            {stats.wastePercentage > 20 && (
            <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <FiAlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm">
                  High waste rate detected. Consider buying smaller quantities or planning meals better.
                </span>
              </div>
            )}
            {stats.avgExpiryDays < 7 && (
            <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <FiCalendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm">
                  Items expire quickly. Try to consume items within a week of purchase.
                </span>
              </div>
            )}
            {stats.savingsRate > 80 && (
            <div className="flex items-start space-x-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <FiTrendingUp className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm">
                  Excellent waste management! Keep up the good work.
                </span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
} 