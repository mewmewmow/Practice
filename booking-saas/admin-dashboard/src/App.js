import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    total_businesses: 0,
    total_bookings: 0,
    active_subscriptions: 0,
    monthly_revenue: [],
    customer_growth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an admin endpoint
      // For demo, we'll use simulated data
      
      setMetrics({
        total_revenue: 45230.50,
        total_businesses: 128,
        total_bookings: 3450,
        active_subscriptions: 98,
        monthly_revenue: [
          { month: 'Jan', revenue: 8500 },
          { month: 'Feb', revenue: 12300 },
          { month: 'Mar', revenue: 15600 },
          { month: 'Apr', revenue: 18900 },
          { month: 'May', revenue: 22100 },
          { month: 'Jun', revenue: 25430 }
        ],
        customer_growth: [
          { month: 'Jan', businesses: 45 },
          { month: 'Feb', businesses: 62 },
          { month: 'Mar', businesses: 81 },
          { month: 'Apr', businesses: 98 },
          { month: 'May', businesses: 110 },
          { month: 'Jun', businesses: 128 }
        ]
      });
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">SmartBook Admin Dashboard</h1>
          <p className="text-gray-600">Monitor SaaS performance and revenue</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${metrics.total_revenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Active Businesses</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {metrics.total_businesses}
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Bookings</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {metrics.total_bookings}
                </p>
              </div>
              <Activity className="text-purple-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Subscriptions</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {metrics.active_subscriptions}
                </p>
              </div>
              <TrendingUp className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Monthly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Business Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.customer_growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="businesses" fill="#3b82f6" name="Active Businesses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Subscription Revenue Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { plan: 'Free Plan', users: 30, revenue: 0, color: 'bg-gray-100' },
              { plan: 'Pro Plan ($29/mo)', users: 50, revenue: 1450, color: 'bg-blue-100' },
              { plan: 'Enterprise ($99/mo)', users: 18, revenue: 1782, color: 'bg-purple-100' }
            ].map((item, idx) => (
              <div key={idx} className={`${item.color} rounded-lg p-4`}>
                <h3 className="font-semibold text-gray-900 mb-2">{item.plan}</h3>
                <p className="text-sm text-gray-600">Users: <span className="font-bold">{item.users}</span></p>
                <p className="text-sm text-gray-600">Monthly Revenue: <span className="font-bold">${item.revenue.toFixed(2)}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Insights */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Growth Status</h3>
            <p className="text-green-700">MoM growth: +15.8% | High churn detected in Free tier</p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠ Action Items</h3>
            <p className="text-yellow-700">Send feature update emails to Pro users | Run retention campaign</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
