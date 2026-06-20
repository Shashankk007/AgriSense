import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Signup = () => {
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    localStorage.setItem('agrisense_user', JSON.stringify(decoded));
    navigate('/'); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Detailed Signup Form Submitted!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f9f6] py-10">
      <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-sm border border-gray-100 w-full max-w-lg relative z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-green-600 tracking-tight flex items-center justify-center gap-2">
            🌱 Agrisense
          </h1>
          <h2 className="text-gray-800 font-bold text-xl mt-4">Create Your Account</h2>
          <p className="text-gray-500 text-sm mt-2">Fill in your details to start your smart farming journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="Ramesh" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="Kumar" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
            <input type="tel" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="+91 9876543210" pattern="[0-9+\s-]+" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input type="email" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="farmer@agrisense.com" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Address</label>
            <textarea rows="3" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm resize-none" placeholder="Enter your farm or home address..." required ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create Password</label>
            <input type="password" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="••••••••" minLength="6" required />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm mt-4">
            Create Account
          </button>
        </form>

        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-100 w-full"></div>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">OR</span>
          <div className="h-px bg-gray-100 w-full"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleSuccess} onError={() => console.log('Signup Failed')} shape="rectangular" theme="outline" text="signup_with" size="large" />
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account? <Link to="/login" className="text-green-600 font-bold hover:underline transition-all">Log in</Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;