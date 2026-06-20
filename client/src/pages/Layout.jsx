import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Workspace Sidebar */}
      <aside className="w-full md:w-64 bg-green-800 text-white flex flex-col p-6 shadow-xl">
        <Link to="/" className="text-2xl font-bold tracking-wide mb-8 hover:text-green-200">
          🌱 Agrisense AI
        </Link>
        <nav className="flex flex-col space-y-4 grow">
          <Link to="/workspace" className="hover:bg-green-700 p-3 rounded-lg font-medium transition-colors">
            📊 Dashboard
          </Link>
          <Link to="/workspace/crop-prediction" className="hover:bg-green-700 p-3 rounded-lg font-medium transition-colors">
            🌾 Crop Prediction
          </Link>
          <Link to="/workspace/disease-detection" className="hover:bg-green-700 p-3 rounded-lg font-medium transition-colors">
            🔍 Disease Detection
          </Link>
        </nav>
        <div className="pt-4 border-t border-green-700 text-sm text-green-300">
          Workspace Mode
        </div>
      </aside>

      {/* Dynamic Content Panel */}
      <main className="grow p-6 md:p-10">
        <Outlet /> {/* This will render the content of the selected route */}
      </main>
    </div>
  );
};

export default Layout;