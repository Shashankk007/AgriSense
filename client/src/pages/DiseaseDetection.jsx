import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { scanCropImagesAPI } from '../api/farmApi'; // Path confirm kar lena

const DiseaseDetection = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const [newFarmName, setNewFarmName] = useState("");
  const [isAddingNewFarm, setIsAddingNewFarm] = useState(false);
  
  // 🟢 NAYA STATE: Location ko pehle hi save karne ke liye
  const [farmLocation, setFarmLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // 🟢 BUG 1 FIX: Mongoose ke format wali valid 24-character dummy IDs
  const myFarms = [
    { _id: "64a3ac00ffd258a8c8d33ba1", name: "North Field (Tomato)" },
    { _id: "64a3ac00ffd258a8c8d33ba2", name: "Riverside Acre (Potato)" }
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      return toast.error("Maximum 5 images allowed.");
    }
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 🟢 BUG 2 FIX: Dropdown change hote hi turant location maango
  const handleFarmSelect = (e) => {
    const value = e.target.value;
    
    if (value === "ADD_NEW") {
      setIsAddingNewFarm(true);
      setSelectedFarm("");
      
      // Turant location fetch karo
      if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFarmLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setIsLocating(false);
            toast.success("📍 Location captured automatically!");
          },
          (error) => {
            setIsLocating(false);
            toast.error("Location access denied. Using default map settings.");
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser.");
      }
    } else {
      setIsAddingNewFarm(false);
      setSelectedFarm(value);
      setFarmLocation(null); // Purana farm select kiya toh location hata do
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
      
      // Agar naya farm add kar rahe hain, toh name aur saved location bhejo
      if (isAddingNewFarm && newFarmName) {
        formData.append("newFarmName", newFarmName);
        if (farmLocation) {
          formData.append("latitude", farmLocation.lat);
          formData.append("longitude", farmLocation.lng);
        }
      } else if (selectedFarm) {
        // Purana farm select kiya hai toh sirf ObjectId bhejo
        formData.append("farmId", selectedFarm);
      }

      selectedFiles.forEach((file) => {
        formData.append("cropImages", file);
      });

      const response = await scanCropImagesAPI(formData);
      
      if (response.success) {
        toast.success("Analysis complete! 🌿");
        setResults(response.detectionResult.images);
        // Form reset
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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Leaf Disease Scanner</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Upload clear images of a plant leaf to detect potential diseases.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
        
        {/* FARM SELECTION */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Farm (Optional)</label>
          
          {!isAddingNewFarm ? (
            <select 
              value={selectedFarm} 
              onChange={handleFarmSelect}
              className="w-full sm:w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium"
            >
              <option value="">-- Select a Farm --</option>
              {myFarms.map(farm => (
                <option key={farm._id} value={farm._id}>{farm.name}</option>
              ))}
              <option value="ADD_NEW" className="font-bold text-green-600">➕ Add New Farm manually</option>
            </select>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-3/4 items-center">
              <input 
                type="text" 
                placeholder="Enter new farm name..." 
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium"
              />
              
              {/* Location Indicator */}
              <div className="text-sm font-medium flex items-center">
                {isLocating ? (
                  <span className="text-orange-500 animate-pulse">📍 Fetching location...</span>
                ) : farmLocation ? (
                  <span className="text-green-600">✅ Location Set</span>
                ) : (
                  <span className="text-gray-400">📍 No Location</span>
                )}
              </div>

              <button 
                onClick={() => { setIsAddingNewFarm(false); setNewFarmName(""); setFarmLocation(null); }}
                className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors ml-2"
              >
                Cancel
              </button>
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
          <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG (Max 5MB) • Up to 5 images</p>
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

        {/* SCAN BUTTON */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleScan}
            disabled={isScanning || selectedFiles.length === 0 || isLocating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
          >
            {isScanning ? "Analyzing Crop..." : "Scan Images"}
          </button>
        </div>
      </div>

     {/* RESULTS SECTION */}
      {results && results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
          {results.map((item, index) => (
            <div key={index} className="bg-[#eefcf4] border border-green-200 p-6 rounded-3xl flex flex-col md:flex-row gap-6 shadow-sm">
              
              <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0 border border-green-100 bg-white">
                <img src={item.cloudinaryUrl} alt="Analyzed" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-extrabold text-gray-900">{item.prediction.diseaseName}</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                    {item.prediction.confidenceScore}% Accuracy
                  </span>
                </div>

                {/* 🟢 NEW: Tags for Severity, Disease Type, and Affected Part (Same as History) */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                    item.prediction.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                    item.prediction.severity === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {item.prediction.severity !== 'None' ? `${item.prediction.severity} Severity` : 'Healthy'}
                  </span>
                  
                  {item.prediction.diseaseType && item.prediction.diseaseType !== "Unknown" && item.prediction.diseaseType !== "None" && (
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-1 rounded-md">
                      Type: {item.prediction.diseaseType}
                    </span>
                  )}

                  {item.prediction.affectedPart && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-md">
                      Affected Area: {item.prediction.affectedPart}
                    </span>
                  )}
                </div>

                {/* Cause from Schema */}
                {item.prediction.diseaseName !== "Healthy" && item.prediction.cause && item.prediction.cause !== "None" && (
                  <p className="text-gray-700 text-sm mb-4">
                    The AI detected signs of {item.prediction.diseaseName}, primarily caused by <span className="font-semibold italic">{item.prediction.cause}</span>.
                  </p>
                )}

                {/* Treatments & Precautions */}
                {(item.treatments.length > 0 || item.precautions.length > 0) && (
                  <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm mt-2">
                    <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                      💊 Treatment & Action Plan
                    </h4>
                    <ul className="space-y-2">
                      {item.treatments.map((t, i) => (
                        <li key={`t-${i}`} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 font-bold">•</span>{t}
                        </li>
                      ))}
                      {item.precautions.map((p, i) => (
                        <li key={`p-${i}`} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 font-bold">•</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;