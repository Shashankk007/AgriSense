import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { scanPestImagesAPI, getFarmsAPI, getPestHistoryAPI } from '../api/farmApi';
import { useNavigate } from 'react-router-dom';

const PestDetection = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  
  const [newFarmName, setNewFarmName] = useState("");
  const [isAddingNewFarm, setIsAddingNewFarm] = useState(false);
  const [farmLocation, setFarmLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [myFarms, setMyFarms] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmsRes, historyRes] = await Promise.all([
          getFarmsAPI(),
          getPestHistoryAPI()
        ]);
        
        if (farmsRes && farmsRes.farms) {
          setMyFarms(farmsRes.farms);
        } else if (farmsRes && Array.isArray(farmsRes)) {
          setMyFarms(farmsRes);
        }

        if (historyRes && historyRes.success) {
          setRecentHistory(historyRes.history.slice(0, 5));
        }
      } catch (err) {
        console.error("Could not fetch initial data", err);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 1) {
      return toast.error("Maximum 1 image allowed.");
    }
    setSelectedFiles([...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFarmSelect = (e) => {
    const value = e.target.value;
    if (value === "ADD_NEW") {
      setIsAddingNewFarm(true);
      setSelectedFarm("");
      if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFarmLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setIsLocating(false);
            toast.success("📍 Location captured automatically!");
          },
          () => {
            setIsLocating(false);
            toast.error("Location access denied.");
          }
        );
      } else {
        toast.error("Geolocation not supported.");
      }
    } else {
      setIsAddingNewFarm(false);
      setSelectedFarm(value);
      setFarmLocation(null);
    }
  };

  const handleScan = async () => {
    if (selectedFiles.length === 0) {
      return toast.error("Please select at least one image to scan.");
    }

    setIsScanning(true);
    setResults(null);

    try {
      const formData = new FormData();
      if (isAddingNewFarm && newFarmName) {
        formData.append("newFarmName", newFarmName);
        if (farmLocation) {
          formData.append("latitude", farmLocation.lat);
          formData.append("longitude", farmLocation.lng);
        }
      } else if (selectedFarm) {
        formData.append("farmId", selectedFarm);
      }

      selectedFiles.forEach((file) => {
        formData.append("cropImages", file);
      });

      const response = await scanPestImagesAPI(formData);
      
      if (response.success) {
        toast.success("Analysis complete! 🐛");
        setResults(response.detectionResult);
        setNewFarmName("");
        setIsAddingNewFarm(false);
        setFarmLocation(null);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to analyze images.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Pest Attack Scanner</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">Upload images of infected leaves or bugs to detect pests.</p>
        </div>
        <button 
          onClick={() => navigate('/workspace/detection-history')}
          className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
        >
          <span>📋</span> View Full History
        </button>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
        {/* FARM SELECTION */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Farm (Optional)</label>
          {!isAddingNewFarm ? (
            <select 
              value={selectedFarm} 
              onChange={handleFarmSelect}
              className="w-full sm:w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
            >
              <option value="">-- Select a Farm --</option>
              {myFarms.map(farm => (
                <option key={farm._id} value={farm._id}>{farm.farmName || farm.name}</option>
              ))}
              <option value="ADD_NEW" className="font-bold text-orange-600">➕ Add New Farm manually</option>
            </select>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-3/4 items-center">
              <input 
                type="text" 
                placeholder="Enter new farm name..." 
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
              />
              <div className="text-sm font-medium flex items-center">
                {isLocating ? <span className="text-orange-500 animate-pulse">📍 Fetching location...</span> : farmLocation ? <span className="text-green-600">✅ Location Set</span> : <span className="text-gray-400">📍 No Location</span>}
              </div>
              <button 
                onClick={() => { setIsAddingNewFarm(false); setNewFarmName(""); setFarmLocation(null); }}
                className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors ml-2"
              >Cancel</button>
            </div>
          )}
        </div>

        {/* DRAG & DROP BOX */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 relative">
          <input 
            type="file" multiple accept="image/*" onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isScanning}
          />
          <div className="bg-gray-200 p-4 rounded-full mb-4">📸</div>
          <p className="text-lg font-bold text-gray-800">Click or Drag Image Here</p>
          <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG (Max 5MB) • Max 1 image</p>
        </div>

        {/* IMAGE PREVIEWS */}
        {previewUrls.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
                <img src={url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                >❌</button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleScan}
            disabled={isScanning || selectedFiles.length === 0 || isLocating}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
          >
            {isScanning ? "Analyzing Pests..." : "Scan Images"}
          </button>
        </div>
      </div>

      {results && results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pest Analysis Results</h2>
          {results.map((item, index) => (
            <div key={index} className="bg-[#fff9eb] border border-orange-200 p-6 rounded-3xl flex flex-col md:flex-row gap-6 shadow-sm">
              <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0 border border-orange-100 bg-white">
                <img src={item.imageUrl} alt="Analyzed" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-extrabold text-gray-900">{item.pestName}</h3>
                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-full">
                    {item.confidence}% Accuracy
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-md">
                    Severity: {item.severity}
                  </span>
                </div>

                {item.recommendation && (
                  <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm mt-4">
                    <h4 className="text-sm font-extrabold text-gray-900 mb-2">💡 Recommendations</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECENT HISTORY SECTION */}
      {!results && recentHistory.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Recent Pest Scans</h2>
          <div className="space-y-6">
            {recentHistory.map((record) => (
              <div key={record._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5 items-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                  <img src={record.imageUrl} alt="Recent pest scan" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {record.pestName || "Unknown"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {record.farmId?.farmName || "Unassigned Farm"} • {new Date(record.createdAt).toLocaleDateString()}
                  </p>
                  <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold px-2 py-1 rounded-md">
                    {record.severity} Severity
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PestDetection;
