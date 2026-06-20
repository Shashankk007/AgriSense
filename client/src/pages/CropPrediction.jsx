import React from 'react';

const CropPrediction = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">AI Crop Prediction</h2>
        <p className="text-gray-600 mt-2">Enter your soil and weather parameters to get the best crop recommendation.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nitrogen (N)</label>
            <input type="number" placeholder="e.g. 90" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phosphorus (P)</label>
            <input type="number" placeholder="e.g. 42" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Potassium (K)</label>
            <input type="number" placeholder="e.g. 43" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Temperature (°C)</label>
            <input type="number" placeholder="e.g. 20.8" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Humidity (%)</label>
            <input type="number" placeholder="e.g. 82.0" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">pH Level</label>
            <input type="number" placeholder="e.g. 6.5" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rainfall (mm)</label>
            <input type="number" placeholder="e.g. 202.9" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </div>

          <div className="md:col-span-2 mt-4">
            <button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors">
              Predict Best Crop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CropPrediction;