import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Layout from './pages/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CropPrediction from './pages/CropPrediction.jsx'
import DiseaseDetection from './pages/DiseaseDetection.jsx'
import Auth from './pages/Auth.jsx' // Naya import

const App = () => {
  return (
    <div className="text-gray-800 font-sans selection:bg-green-200">
      <Routes>
        {/* Main Public Landing Page */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        {/* Nested AI Tooling Workspace Routes */}
        <Route path="/workspace" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="crop-prediction" element={<CropPrediction />} />
          <Route path="disease-detection" element={<DiseaseDetection />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App