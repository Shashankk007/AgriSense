import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("User Logged In:", decoded);
    
    // NAYI LINE: User data ko browser me save karo
    localStorage.setItem('agrisense_user', JSON.stringify(decoded));
    
    setUser(decoded);
    navigate('/');
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
        
        <h2 className="text-3xl font-extrabold text-green-600 mb-2">🌱 Agrisense</h2>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Welcome Back, Farmer!</h3>
        <p className="text-gray-500 mb-8 text-sm">Sign in to access your AI crop predictions and disease detection history.</p>

        {/* Google Official Button */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            shape="pill"
            theme="outline"
            size="large"
            text="continue_with"
          />
        </div>

        <div className="relative flex items-center justify-center mt-6 mb-6">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-4 text-sm text-gray-400 absolute">Secure Login</span>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          By continuing, you agree to Agrisense's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;