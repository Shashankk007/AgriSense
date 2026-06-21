import React, { useState } from 'react';
import MapDrawer from '../components/MapDrawer';

const CropPrediction = () => {
  // Ye state track karegi ki user Map dekhna chahta hai ya Manual Form
  const [inputMode, setInputMode] = useState('map'); 

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Page Header with Toggle Switch */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">🌾 Crop Prediction</h1>
          <p className="text-gray-500 mt-2">
            Choose how you want to provide farm data for AI analysis.
          </p>
        </div>

        {/* Custom Toggle Buttons */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 shadow-inner">
          <button 
            onClick={() => setInputMode('map')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              inputMode === 'map' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            🌍 Map Auto-Fetch
          </button>
          <button 
            onClick={() => setInputMode('manual')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              inputMode === 'manual' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            📝 Manual Entry
          </button>
        </div>
      </div>

      {/* ---------------- MODE 1: MAP AUTO-FETCH ---------------- */}
      {inputMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="lg:col-span-2">
            <MapDrawer />
          </div>

          <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 flex flex-col justify-start">
            <h3 className="text-lg font-bold text-gray-800 mb-4">How it works</h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">1.</span>
                Use the polygon tool (top right on the map) to draw lines around your field.
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">2.</span>
                Make sure to connect the last point to the first point to close the shape.
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">3.</span>
                Click on "Save Boundary" to store the location.
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">4.</span>
                Our AI will automatically fetch satellite data and generate predictions.
              </li>
            </ul>

            <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-800 font-bold text-center">
                ✨ Prediction results will appear here after saving your farm boundary.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ---------------- MODE 2: MANUAL FORM ---------------- */}
      {inputMode === 'manual' && (
        <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800">Enter Soil Parameters</h3>
            <p className="text-sm text-gray-500 mt-1">Provide data from your recent soil testing report.</p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nitrogen */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nitrogen (N)</label>
              <input type="number" placeholder="e.g. 90" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>
            
            {/* Phosphorus */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phosphorus (P)</label>
              <input type="number" placeholder="e.g. 42" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>
            
            {/* Potassium */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Potassium (K)</label>
              <input type="number" placeholder="e.g. 43" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>
            
            {/* Temperature */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Temperature (°C)</label>
              <input type="number" placeholder="e.g. 20.8" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>
            
            {/* Humidity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Humidity (%)</label>
              <input type="number" placeholder="e.g. 82.0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>
            
            {/* pH Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">pH Level</label>
              <input type="number" placeholder="e.g. 6.5" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>
            
            {/* Rainfall */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rainfall (mm)</label>
              <input type="number" placeholder="e.g. 202.9" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
            </div>

            <div className="md:col-span-2 mt-4">
              <button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all">
                Predict Best Crop
              </button>
            </div>
          </form>
          
        </div>
      )}

    </div>
  );
};

export default CropPrediction;