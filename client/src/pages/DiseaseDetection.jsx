import React from 'react';

const DiseaseDetection = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🔬 Leaf Disease Scanner</h1>
        <p className="text-gray-600 mt-2">Upload a clear image of a plant leaf to detect potential diseases.</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <span className="text-2xl">🚧</span>
        <div>
          <p className="text-sm font-bold text-amber-800">Coming Soon — In Active Development</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Our plant disease ML model is being trained. The UI below is a preview of what's coming.
          </p>
        </div>
      </div>

      {/* Preview UI (disabled) */}
      <div className="relative">
        {/* Disabled overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl flex flex-col items-center justify-center gap-4 pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🧪</span>
            </div>
            <p className="text-lg font-bold text-gray-700">Disease Detection</p>
            <p className="text-sm text-gray-500 mt-1">ML model training in progress</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 select-none">
          {/* Upload Area (visual only) */}
          <div className="border-4 border-dashed border-gray-200 rounded-2xl p-12 text-center group">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">Click or Drag Image Here</h3>
            <p className="text-gray-300">Supports JPG, PNG (Max 5MB)</p>
            <button disabled className="mt-6 bg-gray-200 text-gray-400 px-6 py-2 rounded-full font-semibold cursor-not-allowed">
              Browse Files
            </button>
          </div>

          {/* Sample result preview */}
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start opacity-50">
            <div className="w-full md:w-36 h-36 shrink-0 bg-gray-100 rounded-xl border border-green-100 flex items-center justify-center text-5xl">
              🍃
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-400">Disease Name Here</h3>
                  <p className="text-sm font-medium text-gray-400 mt-1">Severity will appear here</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 text-sm font-bold rounded-full">
                  --% Accuracy
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-5">AI diagnosis and treatment recommendations will appear here after image analysis.</p>
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span>💊</span> Treatment Action Plan
                </h4>
                <ul className="text-sm text-gray-200 space-y-2">
                  <li>• Recommendation 1 will appear here</li>
                  <li>• Recommendation 2 will appear here</li>
                  <li>• Recommendation 3 will appear here</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's coming section */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '🌿', title: '50+ Diseases', desc: 'Detect diseases across wheat, rice, tomato, and more.' },
          { icon: '⚡', title: 'Instant Results', desc: 'Get diagnosis in under 3 seconds from a photo.' },
          { icon: '💊', title: 'Treatment Plan', desc: 'AI-generated, organic-first treatment recommendations.' },
        ].map((item) => (
          <div key={item.title} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <p className="text-sm font-bold text-gray-700">{item.title}</p>
            <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiseaseDetection;
