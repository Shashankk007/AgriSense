import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext'; 
import { googleLoginAPI, registerAPI } from '../api/farmApi'; 

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); 
  const [isLoading, setIsLoading] = useState(false); 
  
  // Updated States according to new Schema
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState(''); // Optional
  const [showPin, setShowPin] = useState(false); // Toggle for Eye Icon

  // Secure Google Auth handler
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
      console.error("Signup failed:", error);
      alert("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create payload matching the new schema
      const payload = { 
        fullName: fullName.trim(), 
        phoneNumber: phoneNumber.trim(), 
        password: pin 
      };
      
      // Add email only if user filled it
      if (email) {
        payload.email = email.trim().toLowerCase();
      }

      const data = await registerAPI(payload);
      setUser({
        id: data.id,
        fullName: data.fullName || data.username || data.name, 
        name: data.fullName || data.username || data.name, // 👈 Sidebar ke liye
        phoneNumber: data.phoneNumber,
        email: data.email,
        picture: data.profileImage,
        profileImage: data.profileImage,
      });
      navigate('/workspace');
    } catch (error) {
      console.error('Registration failed:', error);
      const backendMessage = error?.response?.data?.message || error?.response?.data?.detail || error?.message;
      alert(backendMessage || 'Could not create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f9f6] py-10">
      <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-sm border border-gray-100 w-full max-w-lg relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-green-600 tracking-tight flex items-center justify-center gap-2">
            🌱 Agrisense
          </h1>
          <h2 className="text-gray-800 font-bold text-xl mt-4">Create Your Account</h2>
          <p className="text-gray-500 text-sm mt-2">Fill in your details to start your smart farming journey.</p>
        </div>

        {/* Manual Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="Ramesh Kumar" 
              required 
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mobile Number <span className="text-red-500">*</span>
            </label>
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

          {/* 4-Digit PIN with Eye Icon */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Create 4-Digit PIN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type={showPin ? "text" : "password"} 
                value={pin} 
                onChange={(e) => setPin(e.target.value)} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm pr-10" 
                placeholder="1234" 
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

          {/* Optional Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
              placeholder="farmer@agrisense.com" 
            />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm mt-4" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-100 w-full"></div>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">OR</span>
          <div className="h-px bg-gray-100 w-full"></div>
        </div>

        {/* Google Auth Section */}
        <div className="flex justify-center flex-col items-center gap-2">
          {isLoading ? (
            <div className="text-sm font-semibold text-green-600 animate-pulse">Setting up your account...</div>
          ) : (
            <GoogleLogin 
              onSuccess={handleSuccess} 
              onError={() => {
                console.log('Signup Failed');
                alert('Google connection failed.');
              }} 
              shape="rectangular" 
              theme="outline" 
              text="signup_with" 
              size="large" 
            />
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account? <Link to="/login" className="text-green-600 font-bold hover:underline transition-all">Log in</Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;