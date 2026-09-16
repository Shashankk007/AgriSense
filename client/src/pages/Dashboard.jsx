import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getFarmsAPI } from '../api/farmApi';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [farmCount, setFarmCount] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getFarmsAPI();
        setFarmCount(data.farms?.length ?? 0);
      } catch {
        setFarmCount(0);
      } finally {
        setLoadingStats(false);
      }
    };
    if (user) loadStats();
  }, [user]);

  const firstName = user?.name?.split(' ')[0] || 'Farmer';

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Welcome back, {firstName}! 🌾
        </h1>
        <p className="text-gray-500 mt-2">Here is what's happening with your farm today.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        {/* Saved Farms — real data */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-xl text-green-600 text-2xl shrink-0">🗺️</div>
          <div>
            <p className="text-gray-500 text-sm">Saved Farm Boundaries</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingStats ? (
                <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
              ) : farmCount}
            </p>
          </div>
        </div>

        {/* Disease Detections — coming soon */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600 text-2xl shrink-0">🔬</div>
          <div>
            <p className="text-gray-500 text-sm">Disease Scans</p>
            <p className="text-sm font-semibold text-amber-600 mt-0.5">Coming Soon</p>
          </div>
        </div>

        {/* AI Chat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600 text-2xl shrink-0">🤖</div>
          <div>
            <p className="text-gray-500 text-sm">AI Assistant</p>
            <p className="text-sm font-semibold text-blue-600 mt-0.5">Active</p>
          </div>
        </div>

      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Analyze your crops</h3>
            <p className="mb-6 opacity-90">Draw your farm boundary and get satellite NDVI analysis.</p>
            <Link
              to="/workspace/crop-prediction"
              className="bg-white text-green-700 px-6 py-2 rounded-lg font-bold hover:bg-green-50 transition-colors inline-block"
            >
              Open Map Analysis
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20">🌱</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Ask the AI assistant</h3>
            <p className="mb-6 opacity-90">Get expert farming advice powered by Gemini AI with memory.</p>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold w-fit">
              <span>👇</span> Use the chat button (bottom-right)
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 text-9xl opacity-20">🤖</div>
        </div>
      </div>

      {/* Disease Detection teaser */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-dashed border-amber-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600 text-2xl shrink-0">🔬</div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Disease Detection</h3>
            <p className="text-sm text-gray-500">Upload a leaf photo for instant AI diagnosis — coming soon.</p>
          </div>
        </div>
        <Link
          to="/workspace/disease-detection"
          className="shrink-0 bg-amber-50 text-amber-700 border border-amber-200 px-5 py-2 rounded-xl font-semibold text-sm hover:bg-amber-100 transition-colors"
        >
          Preview UI
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
