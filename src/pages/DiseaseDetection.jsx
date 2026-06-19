import React from 'react';

const DiseaseDetection = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Leaf Disease Scanner</h2>
        <p className="text-gray-600 mt-2">Upload a clear image of a plant leaf to detect potential diseases.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* Upload Area */}
        <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer group">
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Click or Drag Image Here</h3>
          <p className="text-gray-500">Supports JPG, PNG (Max 5MB)</p>
          <input type="file" className="hidden" />
          <button className="mt-6 bg-gray-800 text-white px-6 py-2 rounded-full font-semibold group-hover:bg-green-600 transition-colors">
            Browse Files
          </button>
        </div>

        {/* Dummy Result Area (Jab file upload hogi tab dikhana chahiye) */}
        <div className="mt-8 bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start shadow-sm transition-all hover:shadow-md">
  
  {/* Left Side: Uploaded Image Preview */}
  <div className="w-full md:w-36 h-36 shrink-0 bg-white rounded-xl border border-green-100 overflow-hidden shadow-sm relative">
    {/* Maine ek dummy leaf image laga di hai test karne ke liye */}
    <img 
      src="http://googleusercontent.com/image_collection/image_retrieval/8810832440045785188" 
      alt="Analyzed Leaf" 
      className="w-full h-full object-cover"
    />
    {/* Scan overlay effect (optional) */}
    <div className="absolute inset-0 bg-green-500/10 pointer-events-none"></div>
  </div>

  {/* Right Side: AI Analysis Details */}
  <div className="flex-1 w-full">
    {/* Title & Confidence Score */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
      <div>
        <h3 className="text-2xl font-bold text-gray-800">Tomato Early Blight</h3>
        <p className="text-sm font-medium text-red-500 mt-1">High Severity detected</p>
      </div>
      
      {/* Confidence Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-full border border-green-200">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
        </svg>
        98.5% Accuracy
      </div>
    </div>

    {/* Disease Description */}
    <p className="text-sm text-gray-600 mb-5 leading-relaxed">
      The AI has detected signs of Early Blight, a common fungal disease caused by <span className="italic font-medium">Alternaria solani</span>. It primarily affects older leaves first, creating dark, concentric rings that resemble a target board.
    </p>

    {/* Actionable Treatment Box */}
    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
      <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>💊</span> Recommended Treatment Action Plan
      </h4>
      <ul className="text-sm text-gray-600 space-y-2 list-none">
        <li className="flex items-start gap-2">
          <span className="text-green-500 font-bold">•</span>
          Prune and safely destroy the infected lower leaves to stop the spread.
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500 font-bold">•</span>
          Apply a copper-based organic fungicide targeting the lower canopy.
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500 font-bold">•</span>
          Ensure watering is done at the base of the plant to keep leaves dry.
        </li>
      </ul>
    </div>
  </div>
  
</div>
      </div>
    </div>
  );
};

export default DiseaseDetection;