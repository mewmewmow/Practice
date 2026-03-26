import React, { useState, useEffect } from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function SettingsPage({ businessId }) {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', duration_minutes: 60, price: 0 });
  const navigate = useNavigate();

  const handleAddService = async (e) => {
    e.preventDefault();
    // API call would go here
    alert('Service added (demo)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings & Services</h1>

          <form onSubmit={handleAddService}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Service Name"
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Duration (mins)"
                value={newService.duration_minutes}
                onChange={(e) => setNewService({...newService, duration_minutes: parseInt(e.target.value)})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Price"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value)})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Service
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
