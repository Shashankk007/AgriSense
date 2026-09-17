import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadPestImageAPI, getUserPestImagesAPI, deletePestImageAPI } from '../api/detectionApi';

const PestDetection = () => {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const res = await getUserPestImagesAPI(user.id || user._id);
      setHistory(res.detections || []);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadPestImageAPI(file);
      setFile(null);
      setPreview(null);
      fetchHistory(); // refresh history
    } catch (error) {
      alert(error?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePestImageAPI(id);
      setHistory((prev) => prev.filter(h => h._id !== id));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🐛 Pest Detection</h1>
        <p className="text-gray-600 mt-2">Upload a clear image of a pest to save it for analysis.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center">
          {preview ? (
            <div className="flex flex-col items-center gap-4">
              <img src={preview} alt="Preview" className="max-h-64 rounded-xl object-contain" />
              <div className="flex gap-4">
                <button 
                  onClick={() => { setFile(null); setPreview(null); }} 
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload & Analyze'}
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center cursor-pointer">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">Click to Upload Image</h3>
              <p className="text-gray-400 text-sm">Supports JPG, PNG</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Past Scans</h2>
        {loadingHistory ? (
          <p className="text-gray-500">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500 italic">No pest scans yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((scan) => (
              <div key={scan._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <img src={scan.imageUrl} alt="Scan" className="w-24 h-24 rounded-lg object-cover bg-gray-50" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">Scan Recorded</h4>
                    <p className="text-xs text-gray-500">{new Date(scan.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">Pending ML Diagnosis...</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(scan._id)} 
                    className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold self-start hover:bg-red-100 active:scale-95 transition-all mt-2 cursor-pointer"
                  >
                    🗑️ Delete Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PestDetection;
