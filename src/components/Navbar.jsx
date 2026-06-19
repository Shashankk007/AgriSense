import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Component load hone par check karo ki user logged in hai ya nahi
  useEffect(() => {
    const storedUser = localStorage.getItem('agrisense_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('agrisense_user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="w-full py-6 px-8 flex justify-between items-center absolute top-0 z-50">
      {/* Left Side: Logo */}
      <div className="flex items-center gap-2">
        <Link to="/" className="text-3xl font-extrabold text-green-600 tracking-tight hover:opacity-80 transition-opacity">
          🌱 Agrisense
        </Link>
      </div>

      {/* Right Side: Conditional Links & Buttons */}
      <div className="flex items-center gap-6">
        {user ? (
          /* ----- LOGGED IN VIEW ----- */
          <>
            <Link to="/workspace" className="hidden md:block font-medium text-gray-600 hover:text-green-600 transition-colors">
              Go to Workspace
            </Link>
            
            {/* Functional Profile Avatar with Dropdown */}
            <div className="relative group cursor-pointer">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-gray-200 object-cover hover:ring-4 hover:ring-green-100 transition-all" 
                />
              ) : (
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold hover:ring-4 hover:ring-pink-100 transition-all">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Hover Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-4 border-b border-gray-50">
                  <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ----- LOGGED OUT VIEW ----- */
          <>
            <Link to="/login" className="font-medium text-gray-600 hover:text-green-600 transition-colors">
              Log in
            </Link>
            <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-full shadow-sm transition-all hover:-translate-y-0.5">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;