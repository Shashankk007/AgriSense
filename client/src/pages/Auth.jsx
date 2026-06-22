import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext'; 
import { getCurrentUserAPI, googleLoginAPI, loginAPI } from '../api/farmApi'; 

const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  // 🛡️ Naya Secure Google Login Handler
  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const data = await googleLoginAPI(credentialResponse.credential);
      if (data.success) {
        setUser({
          id: data.user.id,
          name: data.user.username || data.user.name,
          email: data.user.email,
          picture: data.user.profileImage,
          profileImage: data.user.profileImage,
        }); 
        navigate('/workspace'); 
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginAPI(email, password);
      const user = await getCurrentUserAPI();
      setUser({
        id: user._id || user.id,
        name: user.username || user.name,
        email: user.email,
        picture: user.profileImage,
        profileImage: user.profileImage,
      });
      navigate('/workspace');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
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
            Welcome Back, Farmer!
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Sign in to access your AI crop predictions.
          </p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="farmer@agrisense.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm font-medium text-green-600 hover:underline">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-100 w-full"></div>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">OR</span>
          <div className="h-px bg-gray-100 w-full"></div>
        </div>

        {/* Google Login Component */}
        <div className="flex justify-center flex-col items-center gap-2">
          {isLoading ? (
            <div className="text-sm font-semibold text-green-600 animate-pulse">Securing your session...</div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                console.log('Login Failed');
                alert("Google connection failed.");
              }}
              shape="rectangular"
              theme="outline"
              text="signin_with"
              size="large"
            />
          )}
        </div>

        {/* Redirect to Signup Route */}
        <p className="text-center text-sm text-gray-600 mt-8">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="text-green-600 font-bold hover:underline transition-all"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Auth;