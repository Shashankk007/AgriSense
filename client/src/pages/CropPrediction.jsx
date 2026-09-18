import React, { useContext, useEffect, useState } from 'react';
import MapDrawer from '../components/MapDrawer';
import { AuthContext } from '../context/AuthContext';
import { getFarmsAPI, deleteFarmAPI } from '../api/farmApi';
import { getFarmNdviAPI } from '../api/mlApi';

const CropPrediction = () => {
  const { user } = useContext(AuthContext);

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [ndviResult, setNdviResult] = useState(null);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const [deletingFarmId, setDeletingFarmId] = useState(null);
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

  const handleDeleteFarm = async (farmId) => {
    if (!farmId) return;
    if (!window.confirm('Are you sure you want to delete this farm boundary? This action cannot be undone.')) return;

    setDeletingFarmId(farmId);
    setError('');
    try {
      await deleteFarmAPI(farmId);
      const updatedFarms = farms.filter((f) => f._id !== farmId);
      setFarms(updatedFarms);
      // Select the next available farm
      const nextId = updatedFarms[0]?._id || '';
      setSelectedFarmId(nextId);
      if (!nextId) setNdviResult(null);
    } catch (err) {
      setError('Failed to delete farm. Please try again.');
    } finally {
      setDeletingFarmId(null);
    }
  };

  const getNdviHealthLabel = (ndvi) => {
    if (ndvi === null || ndvi === undefined) return null;
    if (ndvi >= 0.6) return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
    if (ndvi >= 0.4) return { label: 'Good', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' };
    if (ndvi >= 0.2) return { label: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    return { label: 'Poor', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
  };

  const health = ndviResult ? getNdviHealthLabel(ndviResult.averageNdvi) : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">🌾 Crop Health Analysis</h1>
        <p className="text-gray-500 mt-2">
          Draw your farm boundary on the map — our AI will fetch real satellite data and compute your NDVI score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Map Panel */}
        <div className="lg:col-span-2">
          <MapDrawer farmName={`Farm ${farms.length + 1}`} onFarmSaved={handleFarmSaved} overlayTileUrl={ndviResult?.tileUrl} />
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4">

          {/* How it works */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span> How it works
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold shrink-0">1.</span>
                Use the polygon tool (top-right of map) to draw around your field.
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold shrink-0">2.</span>
                Connect the last point to the first point to close the shape.
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold shrink-0">3.</span>
                Click "Save Boundary" to store the location securely.
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold shrink-0">4.</span>
                Select your farm and click "Fetch NDVI" — the NDVI layer appears on the map.
              </li>
            </ul>
          </div>

          {/* Farm Selector */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Saved Farms</label>

            {loadingFarms ? (
              <p className="text-sm text-gray-400 animate-pulse">Loading farms...</p>
            ) : farms.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No farms saved yet. Draw one on the map above.</p>
            ) : (
              <div className="space-y-2">
                {farms.map((farm) => (
                  <div
                    key={farm._id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${selectedFarmId === farm._id
                        ? 'bg-green-50 border-green-300 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => setSelectedFarmId(farm._id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">🌿</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{farm.farmName}</p>
                        <p className="text-xs text-gray-400">{farm.area?.value} {farm.area?.unit}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFarm(farm._id); }}
                      disabled={deletingFarmId === farm._id}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 ml-2"
                      title="Delete farm"
                    >
                      {deletingFarmId === farm._id ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {farms.length > 0 && (
              <button
                type="button"
                onClick={() => loadNdviForFarm(selectedFarmId)}
                disabled={!selectedFarmId || loadingNdvi}
                className="mt-4 w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {loadingNdvi ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analyzing Satellite Data...
                  </span>
                ) : '🛰️ Fetch NDVI'}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* NDVI Result */}
          {ndviResult && health && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">🛰️ Satellite Analysis Result</h4>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${health.bg} ${health.color} ${health.border}`}>
                  {health.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Farm</span>
                  <span className="text-xs font-semibold text-gray-800">{ndviResult.farmName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Average NDVI</span>
                  <span className="text-sm font-bold text-gray-900">{Number(ndviResult.averageNdvi).toFixed(3)}</span>
                </div>

                {/* NDVI Bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>0 (Bare)</span>
                    <span>1 (Dense)</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 transition-all duration-700"
                      style={{ width: `${Math.min(Math.max(ndviResult.averageNdvi * 100, 2), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Latest image</span>
                  <span className="text-xs text-gray-600">{new Date(ndviResult.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CropPrediction;
