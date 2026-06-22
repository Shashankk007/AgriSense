import React, { useContext, useEffect, useState } from 'react';
import MapDrawer from '../components/MapDrawer';
import { AuthContext } from '../context/AuthContext';
import { getFarmsAPI } from '../api/farmApi';
import { getFarmNdviAPI } from '../api/mlApi';

const CropPrediction = () => {
  const { user } = useContext(AuthContext);

  // Ye state track karegi ki user Map dekhna chahta hai ya Manual Form
  const [inputMode, setInputMode] = useState('map'); 
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [ndviResult, setNdviResult] = useState(null);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFarms = async () => {
      if (!user) return;

      setLoadingFarms(true);
      setError('');
      try {
        const data = await getFarmsAPI();
        setFarms(data.farms || []);
        const latestFarmId = data.farms?.[0]?._id || '';
        setSelectedFarmId(latestFarmId);
      } catch (err) {
        setError('Unable to load farms from the backend.');
      } finally {
        setLoadingFarms(false);
      }
    };

    loadFarms();
  }, [user]);

  const loadNdviForFarm = async (farmId) => {
    if (!farmId) return;

    setLoadingNdvi(true);
    setError('');
    try {
      const data = await getFarmNdviAPI(farmId);
      setNdviResult(data);
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || 'Unable to fetch NDVI data.';
      setError(message);
      setNdviResult(null);
    } finally {
      setLoadingNdvi(false);
    }
  };

  useEffect(() => {
    if (selectedFarmId) {
      loadNdviForFarm(selectedFarmId);
    }
  }, [selectedFarmId]);

  const handleFarmSaved = (farm) => {
    if (!farm?._id) return;

    setFarms((current) => {
      const filtered = current.filter((item) => item._id !== farm._id);
      return [farm, ...filtered];
    });
    setSelectedFarmId(farm._id);
  };

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
            <MapDrawer farmName="My Farm" onFarmSaved={handleFarmSaved} />
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

            <div className="mt-8 space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-800 font-bold text-center">
                  ✨ Prediction results will appear here after saving your farm boundary.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Saved farms</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  disabled={loadingFarms}
                >
                  {farms.length === 0 ? (
                    <option value="">No farms available</option>
                  ) : (
                    farms.map((farm) => (
                      <option key={farm._id} value={farm._id}>
                        {farm.farmName}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => loadNdviForFarm(selectedFarmId)}
                  disabled={!selectedFarmId || loadingNdvi}
                  className="mt-3 w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {loadingNdvi ? 'Analyzing...' : 'Fetch NDVI'}
                </button>
              </div>

              {ndviResult && (
                <div className="p-4 bg-white rounded-xl border border-green-200 shadow-sm space-y-2">
                  <h4 className="text-sm font-bold text-gray-800">ML result</h4>
                  <p className="text-sm text-gray-600"><span className="font-semibold">Farm:</span> {ndviResult.farmName}</p>
                  <p className="text-sm text-gray-600"><span className="font-semibold">Average NDVI:</span> {Number(ndviResult.averageNdvi).toFixed(3)}</p>
                  <p className="text-sm text-gray-600"><span className="font-semibold">Updated:</span> {ndviResult.lastUpdated}</p>
                  <a
                    href={ndviResult.tileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-2 text-green-700 font-semibold text-sm hover:underline"
                  >
                    Open tile preview
                  </a>
                </div>
              )}

              {loadingFarms && (
                <p className="text-sm text-gray-500">Loading saved farms...</p>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>
              )}
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