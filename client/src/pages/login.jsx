import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext'; 
import { getCurrentUserAPI, googleLoginAPI, loginAPI } from '../api/farmApi'; 

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); 
  
  // 🟢 Naye state variables according to Phone Number & PIN
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [showPin, setShowPin] = useState(false); // Eye icon toggle ke liye

  // Secure Google Login Handler (No changes here)
  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const data = await googleLoginAPI(credentialResponse.credential);
      if (data.success) {
        setUser({
          id: data.user.id,
          name: data.user.fullName || data.user.name,
          phoneNumber: data.user.phoneNumber,
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

  // 🟢 Login handler updated for phone number & PIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // loginAPI ko ab phone aur pin bhej rahe hain
      await loginAPI(phoneNumber.trim(), pin);
      
      const user = await getCurrentUserAPI();
     setUser({
        id: user._id || user.id,
        fullName: user.fullName || user.username || user.name, 
        name: user.fullName || user.username || user.name, // 👈 Sidebar ke liye
        phoneNumber: user.phoneNumber,
        email: user.email,                                 // 👈 Yeh missing tha!
        picture: user.profileImage,
        profileImage: user.profileImage,
      });
      navigate('/workspace');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid Mobile Number or PIN.');
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

        {/* 🟢 Phone/PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="9876543210" 
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit mobile number"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">4-Digit PIN</label>
            <div className="relative">
              <input 
                type={showPin ? "text" : "password"} 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm pr-10" 
                placeholder="••••" 
                maxLength="4"
                pattern="\d{4}"
                title="Please enter exactly 4 numbers"
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPin(!showPin)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600 focus:outline-none"
              >
                {showPin ? (
                  // Eye Open Icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  // Eye Closed Icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm font-medium text-green-600 hover:underline">Forgot PIN?</a>
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

export default Login; // 🟢 Export ka naam bhi change kar diya