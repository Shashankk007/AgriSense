import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Fetching...', icon: '🌤️' });
  const [stats, setStats] = useState({ predictions: 24, diseases: 3, farms: 2 });

  useEffect(() => {
    // Get user location for weather
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const current = res.data.current_weather;
            let icon = '🌤️';
            let condition = 'Clear';
            if (current.weathercode >= 1 && current.weathercode <= 3) { icon = '⛅'; condition = 'Partly Cloudy'; }
            else if (current.weathercode >= 45 && current.weathercode <= 48) { icon = '🌫️'; condition = 'Foggy'; }
            else if (current.weathercode >= 51 && current.weathercode <= 67) { icon = '🌧️'; condition = 'Rain'; }
            else if (current.weathercode >= 71 && current.weathercode <= 77) { icon = '❄️'; condition = 'Snow'; }
            else if (current.weathercode >= 95) { icon = '⛈️'; condition = 'Thunderstorm'; }

            setWeather({
              temp: `${current.temperature}°C`,
              condition: condition,
              icon: icon
            });
          } catch (err) {
            setWeather({ temp: '--', condition: 'Unavailable', icon: '❓' });
          }
        },
        () => {
          setWeather({ temp: '--', condition: 'Location Denied', icon: '🚫' });
        }
      );
    } else {
      setWeather({ temp: '--', condition: 'Not Supported', icon: '❓' });
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800">Welcome {user?.name ? user.name : 'back'}, Farmer! 🌾</h1>
        <p className="text-gray-500 mt-2">Here is what's happening with your farm today.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-green-100 p-4 rounded-xl text-green-600 text-2xl">🌱</div>
          <div>
            <p className="text-gray-500 text-sm">Active Farms</p>
            <p className="text-2xl font-bold text-gray-800">{stats.farms}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600 text-2xl">📈</div>
          <div>
            <p className="text-gray-500 text-sm">Predictions Made</p>
            <p className="text-2xl font-bold text-gray-800">{stats.predictions}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-red-100 p-4 rounded-xl text-red-600 text-2xl">🔍</div>
          <div>
            <p className="text-gray-500 text-sm">Issues Detected</p>
            <p className="text-2xl font-bold text-gray-800">{stats.diseases}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-orange-100 p-4 rounded-xl text-orange-600 text-2xl">{weather.icon}</div>
          <div>
            <p className="text-gray-500 text-sm">{weather.condition}</p>
            <p className="text-2xl font-bold text-gray-800">{weather.temp}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-linear-to-br from-green-500 to-green-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Crop Health map</h3>
            <p className="mb-6 opacity-90 text-sm">Check NDVI of your farms via satellite.</p>
            <Link to="/workspace/crop-health" className="bg-white text-green-700 px-6 py-2 rounded-lg font-bold hover:bg-green-50 transition-colors inline-block">
              View Map
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20 group-hover:scale-110 transition-transform">🗺️</div>
        </div>

        <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Sick plants?</h3>
            <p className="mb-6 opacity-90 text-sm">Upload leaf photo for disease diagnosis.</p>
            <Link to="/workspace/disease-detection" className="bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors inline-block">
              Scan Leaf
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20 group-hover:scale-110 transition-transform">🍂</div>
        </div>

        <div className="bg-linear-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Pest Attack?</h3>
            <p className="mb-6 opacity-90 text-sm">Detect bugs and insects easily.</p>
            <Link to="/workspace/pest-detection" className="bg-white text-orange-700 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition-colors inline-block">
              Find Pests
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20 group-hover:scale-110 transition-transform">🐛</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;