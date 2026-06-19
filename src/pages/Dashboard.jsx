import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800">Welcome back, Farmer! 🌾</h1>
        <p className="text-gray-500 mt-2">Here is what's happening with your farm today.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-xl text-green-600 text-2xl">📈</div>
          <div>
            <p className="text-gray-500 text-sm">Predictions Made</p>
            <p className="text-2xl font-bold text-gray-800">24</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-red-100 p-4 rounded-xl text-red-600 text-2xl">🔍</div>
          <div>
            <p className="text-gray-500 text-sm">Diseases Detected</p>
            <p className="text-2xl font-bold text-gray-800">3</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600 text-2xl">🌧️</div>
          <div>
            <p className="text-gray-500 text-sm">Weather Status</p>
            <p className="text-xl font-bold text-gray-800">Light Rain</p>
          </div>
        </div>
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-linear-to-br from-green-500 to-green-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Not sure what to plant?</h3>
            <p className="mb-6 opacity-90">Let our AI analyze your soil parameters.</p>
            <Link to="/workspace/crop-prediction" className="bg-white text-green-700 px-6 py-2 rounded-lg font-bold hover:bg-green-50 transition-colors">
              Analyze Now
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20">🌱</div>
        </div>

        <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Plants looking sick?</h3>
            <p className="mb-6 opacity-90">Upload a leaf photo for instant diagnosis.</p>
            <Link to="/workspace/disease-detection" className="bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
              Scan Leaf
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20">🍂</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;