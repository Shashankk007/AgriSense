import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx'
import Layout from './pages/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DiseaseDetection from './pages/DiseaseDetection.jsx'
import PestDetection from './pages/PestDetection.jsx'
import Inventory from './pages/Inventory.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Auth from './pages/Auth.jsx' 
import CropHealth from './pages/CropHealth.jsx'
import Signup from './pages/SignUp.jsx';
import Profile from './pages/Profile.jsx';
import { AuthContext } from './context/AuthContext';
import DetectionHistory from './pages/DetectionHistory.jsx';
import { Toaster } from 'react-hot-toast'; 
import ChatbotWidget from './components/ChatbotWidget';

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
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Nested AI Tooling Workspace Routes */}
        <Route path="/workspace" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="disease-detection" element={<DiseaseDetection />} />
          <Route path="pest-detection" element={<PestDetection />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="crop-health" element={<CropHealth />} />
          <Route path="profile" element={<Profile />} />
          <Route path="detection-history" element={<DetectionHistory />} />
        </Route>
      </Routes>
      <ChatbotWidget />
    </div>
  )
}

export default App