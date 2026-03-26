import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function DashboardPage({ businessId, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bookingsRes = await axios.get(`${API_BASE_URL}/bookings/${businessId}`);
      const analyticsRes = await axios.get(`${API_BASE_URL}/analytics/${businessId}`);
      
      setBookings(bookingsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">SmartBook Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/bookings')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              New Booking
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Bookings</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics?.totals?.total_bookings || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${analytics?.totals?.total_revenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Avg Daily Bookings</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics?.totals?.avg_daily_bookings || '0'}
                </p>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Service</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date/Time</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 10).map((booking) => (
                      <tr key={booking.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.customer_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.service_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.booking_date}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">${booking.price}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
