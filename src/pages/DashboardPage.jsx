import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, TrendingUp, Users, FileText, BarChart3, PieChart, Calendar, Activity, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

export default function DashboardPage({ onQuickAction }) {
  const [forms, setForms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load real data from localStorage
  useEffect(() => {
    const loadData = () => {
      const storedForms = JSON.parse(localStorage.getItem("forms") || "[]");
      setForms(storedForms);
      
      // Generate activities from real localStorage data
      const generatedActivities = generateActivities(storedForms);
      setActivities(generatedActivities);
    };

    loadData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (in case changes happen in same tab)
    const interval = setInterval(loadData, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Generate activities from real forms data
  const generateActivities = (formsData) => {
    const activities = [];
    
    formsData.forEach(form => {
      // Add submission activity
      activities.push({
        id: `submit_${form.id}`,
        type: 'submitted',
        formId: form.id,
        formTitle: form.title || form.id,
        username: form.username || 'Unknown User',
        timestamp: form.createdAt || new Date().toISOString(),
        description: `${form.username || 'Unknown User'} submitted ${form.title || form.id}`
      });
      
      // Add approval/rejection activity if status is not pending
      if (form.finalStatus === 'Approved' || form.finalStatus === 'Rejected') {
        const actionType = form.finalStatus.toLowerCase();
        activities.push({
          id: `${actionType}_${form.id}`,
          type: actionType,
          formId: form.id,
          formTitle: form.title || form.id,
          username: 'Gunaseelan',
          timestamp: form.updatedAt || form.createdAt || new Date().toISOString(),
          description: `Gunaseelan ${actionType} ${form.title || form.id} (${form.id})`
        });
      }
    });
    
    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Calculate correct counts
  const pending = forms.filter(f => f.finalStatus === "Pending").length;
  const approved = forms.filter(f => f.finalStatus === "Approved").length;
  const rejected = forms.filter(f => f.finalStatus === "Rejected").length;
  const total = forms.length;
  const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0';

  // Generate real analytics data from localStorage
  const generateAnalyticsData = () => {
    // Get data from last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        approved: 0,
        rejected: 0,
        pending: 0
      });
    }

    // Process forms data for the last 7 days
    forms.forEach(form => {
      const formDate = form.updatedAt || form.createdAt;
      if (formDate) {
        const dayData = last7Days.find(day => {
          const formDay = new Date(formDate).toISOString().split('T')[0];
          return day.date === formDay;
        });
        
        if (dayData) {
          if (form.finalStatus === 'Approved') dayData.approved++;
          else if (form.finalStatus === 'Rejected') dayData.rejected++;
          else dayData.pending++;
        }
      }
    });

    // Status distribution
    const statusDistribution = [
      { name: 'Approved', value: approved, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Rejected', value: rejected, color: '#ef4444' }
    ].filter(item => item.value > 0); // Only show categories with data

    // User activity based on real data
    const userActivityMap = {};
    forms.forEach(form => {
      const user = form.username || 'Unknown User';
      if (!userActivityMap[user]) {
        userActivityMap[user] = { user, submissions: 0, approvals: 0 };
      }
      userActivityMap[user].submissions++;
      if (form.finalStatus === 'Approved') {
        userActivityMap[user].approvals++;
      }
    });

    const userActivity = Object.values(userActivityMap).slice(0, 10); // Top 10 users

    return {
      approvalTrend: last7Days,
      statusDistribution,
      userActivity
    };
  };

  const analyticsData = generateAnalyticsData();

  // Calculate average processing time
  const calculateAvgProcessingTime = () => {
    const processedForms = forms.filter(f => 
      f.finalStatus !== 'Pending' && f.createdAt && f.updatedAt
    );
    
    if (processedForms.length === 0) return '0';
    
    const totalTime = processedForms.reduce((acc, form) => {
      const created = new Date(form.createdAt);
      const updated = new Date(form.updatedAt);
      return acc + (updated - created);
    }, 0);
    
    const avgTimeMs = totalTime / processedForms.length;
    const avgDays = Math.round(avgTimeMs / (1000 * 60 * 60 * 24));
    return avgDays;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'submitted':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'reviewed':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'system':
        return <Activity className="h-4 w-4 text-slate-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'submitted':
        return 'bg-blue-100 border-blue-200';
      case 'approved':
        return 'bg-emerald-100 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 border-red-200';
      case 'reviewed':
        return 'bg-amber-100 border-amber-200';
      case 'system':
        return 'bg-slate-100 border-slate-200';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const statCards = [
    {
      title: 'Pending Approvals',
      count: pending,
      icon: Clock,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-600',
      description: 'Awaiting review'
    },
    {
      title: 'Approved',
      count: approved,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-600',
      description: 'Successfully approved'
    },
    {
      title: 'Rejected',
      count: rejected,
      icon: XCircle,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      description: 'Declined requests'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Approval Dashboard</h1>
              <p className="mt-1 text-slate-500">Monitor and track approval workflows</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-100 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-slate-600">
                  {approvalRate}% Approval Rate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`${card.lightColor} ${card.borderColor} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${card.textColor} text-sm font-medium mb-1`}>
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                      {card.count.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500">{card.description}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Requests/Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Total Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Total Requests</h3>
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-slate-900">{total.toLocaleString()}</span>
                <span className="text-sm text-slate-500">All time</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${total > 0 ? (approved / total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Approved: {total > 0 ? ((approved / total) * 100).toFixed(1) : '0'}%</span>
                <span>Rejected: {total > 0 ? ((rejected / total) * 100).toFixed(1) : '0'}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              <TrendingUp className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                onClick={() => onQuickAction && onQuickAction("submitted")}
              >
                <Users className="h-4 w-4" />
                <span>Review Pending ({pending})</span>
              </button>
              <button
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                onClick={() => setShowAnalytics(true)}
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No recent activity.</div>
            ) : (
              activities.slice(0, 20).map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)} hover:shadow-sm transition-all duration-200`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.description}
                    </p>
                    {activity.formId && (
                      <p className="text-xs text-slate-500 mt-1">
                        Form ID: {activity.formId}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-slate-400">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Approval Trend */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Approval Trend</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.approvalTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution and User Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Distribution</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    {analyticsData.statusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                          <PieChart
                            data={analyticsData.statusDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analyticsData.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </PieChart>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-slate-500">
                        No data available
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">User Activity</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    {analyticsData.userActivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analyticsData.userActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="user" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="submissions" fill="#3b82f6" />
                          <Bar dataKey="approvals" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-slate-500">
                        No user activity data
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{approvalRate}%</div>
                    <div className="text-sm text-blue-600">Approval Rate</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-emerald-600">{calculateAvgProcessingTime()}</div>
                    <div className="text-sm text-emerald-600">Avg. Processing Days</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-amber-600">{pending}</div>
                    <div className="text-sm text-amber-600">Pending Reviews</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {total > 0 ? Math.round(total / 7) : 0}
                    </div>
                    <div className="text-sm text-purple-600">Weekly Average</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}