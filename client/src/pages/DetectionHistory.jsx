import React, { useState, useEffect } from 'react';
import { getDetectionHistoryAPI,deleteDetectionAPI } from '../api/farmApi';
import toast from 'react-hot-toast';

const DetectionHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getDetectionHistoryAPI();
        if (response.success) {
          setHistory(response.history);
        }
      } catch (error) {
        toast.error("Failed to load history.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleDelete = async (id) => {
  // Galti se click hone par confirm pop-up
  const confirmDelete = window.confirm("Are you sure you want to permanently delete this scan report and its images?");
  if (!confirmDelete) return;

  try {
    const response = await deleteDetectionAPI(id);
    if (response.success) {
      toast.success("Scan record deleted successfully!");
      // UI se delete kiya hua record turant hata do bina page refresh kiye
      setHistory(prevHistory => prevHistory.filter(record => record._id !== id));
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to delete record");
  }
};

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Detection History & Reports</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Review your permanent crop analysis records.</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 font-medium">No scan history found. Your future scans will be saved here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {history.map((record) => (
            <div key={record._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 overflow-hidden">
              
             {/* RECORD HEADER: Date & Farm Info + Delete Button */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {record.farmId?.farmName || "Unassigned Farm"}
                  </h3>
                  <p className="text-xs font-semibold text-gray-400 mt-1">
                    SCANNED ON: {new Date(record.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>
                
                {/* 🟢 RIGHT SIDE: Badge and Delete Button */}
                <div className="flex flex-col items-end gap-2">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full">
                    {record.totalImagesScanned} Image(s)
                  </span>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(record._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors flex items-center justify-center"
                    title="Delete this record"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* IMAGES DETAILED LOOP */}
              <div className="space-y-6">
                {record.images.map((item, index) => (
                  <div key={index} className="bg-[#eefcf4] border border-green-200 p-5 rounded-2xl flex flex-col md:flex-row gap-6">
                    
                    {/* Image Box */}
                    <div className="w-full md:w-40 h-40 rounded-xl overflow-hidden shrink-0 border border-green-100 bg-white">
                      <img src={item.cloudinaryUrl} alt="Analyzed Crop" className="w-full h-full object-cover" />
                    </div>

                    {/* Details Box */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-xl font-extrabold text-gray-900">{item.prediction.diseaseName}</h4>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                          {item.prediction.confidenceScore}% Accuracy
                        </span>
                      </div>

                      {/* 🟢 NEW: Tags for Severity, Disease Type, and Affected Part */}
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

                      {/* Treatments & Precautions from Schema */}
                      {(item.treatments.length > 0 || item.precautions.length > 0) && (
                        <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm mt-2">
                          <h5 className="text-xs font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                            💊 Treatment & Action Plan
                          </h5>
                          <ul className="space-y-1.5">
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

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetectionHistory;