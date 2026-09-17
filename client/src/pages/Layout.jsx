import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // 👈 Naya Import

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // Accessing user data and logout function from AuthContext
  const { user, logout } = useContext(AuthContext);

  //LogOut Handler
  const handleLogout = async () => {
    await logout(); // Logout function from context will clear user data and tell backend to clear cookie
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar Container */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shadow-sm z-10">
        
        <div className="p-6 pb-4">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-green-600 hover:opacity-80 transition-opacity flex items-center gap-2">
            🌱 Agrisense
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1.5 px-4 grow mt-2">
          <Link 
            to="/workspace" 
            className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold transition-all ${
              isActive('/workspace') 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">⌂</span> Dashboard
          </Link>
          
          <Link 
            to="/workspace/crop-prediction" 
            className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold transition-all ${
              isActive('/workspace/crop-prediction') 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">✨</span> Crop Prediction
          </Link>
          
          <Link 
            to="/workspace/disease-detection" 
            className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold transition-all ${
              isActive('/workspace/disease-detection') 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">🔍</span> Disease Detection
          </Link>
          
          <Link 
            to="/workspace/pest-detection" 
            className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold transition-all ${
              isActive('/workspace/pest-detection') 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">🐛</span> Pest Detection
          </Link>

          <Link 
            to="/workspace/inventory" 
            className={`flex items-center gap-3 p-3.5 rounded-xl font-semibold transition-all ${
              isActive('/workspace/inventory') 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">📦</span> Inventory
          </Link>
        </nav>

        {/* Bottom Section: User Profile */}
        <div className="p-4 border-t border-gray-100">
          {user ? (
            <div className="flex items-center justify-between gap-1">
              
              <Link 
                to="/workspace/profile" 
                className="flex items-center gap-3 hover:bg-gray-50 p-2 -ml-2 rounded-xl transition-colors cursor-pointer flex-1 min-w-0"
                title="Go to Profile"
              >
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt="Profile" 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
                  <span className="text-xs font-medium text-gray-500 truncate">Premium Farmer</span>
                </div>
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>

            </div>
          ) : (
            <div className="text-center text-sm font-medium text-gray-500 py-2">
              Not logged in
            </div>
          )}
        </div>
      </aside>

      {/* Dynamic Content Panel */}
      <main className="grow bg-[#f4f9f6] h-screen overflow-y-auto">
        <div className="p-6 md:p-10">
          <Outlet /> 
        </div>
      </main>
      
    </div>
  );
};

export default Layout;