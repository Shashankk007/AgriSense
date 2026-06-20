import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Auth = () => {
  const navigate = useNavigate();
  // Ye state check karegi ki user Login page par hai ya Sign Up page par
  const [isLogin, setIsLogin] = useState(true);

  // Google Login Success Handler
  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    localStorage.setItem('agrisense_user', JSON.stringify(decoded));
    navigate('/'); 
  };

  // Normal Form Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted!");
    // Yahan aage chalkar hum backend API call karenge
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f9f6]">
      <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-sm border border-gray-100 w-full max-w-md relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-green-600 tracking-tight flex items-center justify-center gap-2">
            🌱 Agrisense
          </h1>
          <h2 className="text-gray-800 font-bold text-xl mt-4">
            {isLogin ? 'Welcome Back, Farmer!' : 'Join Agrisense Today!'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin 
              ? 'Sign in to access your AI crop predictions.' 
              : 'Create an account to modernize your farming.'}
          </p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
                placeholder="e.g. Ramesh Kumar" 
                required 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="farmer@agrisense.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="••••••••" 
              required 
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <a href="#" className="text-sm font-medium text-green-600 hover:underline">Forgot password?</a>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm mt-2"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-100 w-full"></div>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">OR</span>
          <div className="h-px bg-gray-100 w-full"></div>
        </div>

        {/* Google Login Component */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.log('Login Failed');
            }}
            shape="rectangular"
            theme="outline"
            text={isLogin ? "signin_with" : "signup_with"}
            size="large"
          />
        </div>

        {/* Toggle Login/Signup Mode */}
        <p className="text-center text-sm text-gray-600 mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-green-600 font-bold hover:underline transition-all"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default Auth;