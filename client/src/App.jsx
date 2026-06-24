import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx'
import Layout from './pages/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CropPrediction from './pages/CropPrediction.jsx'
import DiseaseDetection from './pages/DiseaseDetection.jsx'
import Login from './pages/login.jsx' 
import Signup from './pages/SignUp.jsx';
import Profile from './pages/Profile.jsx';
import { AuthContext } from './context/AuthContext';
import DetectionHistory from './pages/DetectionHistory.jsx';
import { Toaster } from 'react-hot-toast'; 

// ProtectedRoute component ensures that only authenticated users can access certain routes.
const ProtectedRoute = ({ children }) => {
  const { user, authReady } = useContext(AuthContext);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f9f6] text-gray-600 font-medium">
        Restoring your session...
      </div>
    );
  }
  
  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // If user exists, render the children (protected component)
  return children;
};

const App = () => {
  return (
    <div className="text-gray-800 font-sans selection:bg-green-200">
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Main Public Landing Page */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Nested AI Tooling Workspace Routes */}
        <Route path="/workspace" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="crop-prediction" element={<CropPrediction />} />
          <Route path="disease-detection" element={<DiseaseDetection />} />
          <Route path="profile" element={<Profile />} />
          <Route path="detection-history" element={<DetectionHistory />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App