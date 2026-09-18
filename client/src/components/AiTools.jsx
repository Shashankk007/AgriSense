import { Link } from 'react-router-dom';

const AiTools = () => {
  return (
    <section id="ai-tools" className="py-24 px-6 max-w-7xl mx-auto bg-gray-50">
      <div className="text-center mb-16">
        <h3 className="text-4xl font-extrabold text-gray-800 mb-4">Our Powerful AI Tools</h3>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">Leverage state-of-the-art machine learning models directly on your farm.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-gray-100">
          <div className="text-6xl mb-6">🌾</div>
          <h4 className="text-2xl font-bold text-gray-800 mb-4">Crop Health Map</h4>
          <p className="text-gray-600 leading-relaxed mb-8">
            Draw your field on the map and get satellite NDVI analysis showing which parts of your crop are healthy, stressed or bare.
          </p>
          <Link to="/workspace/crop-health" className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-xl font-bold hover:bg-green-100 transition-colors">
            Open Map <span>→</span>
          </Link>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-gray-100">
          <div className="text-6xl mb-6">🔍</div>
          <h4 className="text-2xl font-bold text-gray-800 mb-4">Disease Detection</h4>
          <p className="text-gray-600 leading-relaxed mb-8">
            Upload a picture of an infected leaf. Our computer vision model instantly identifies the disease and suggests actionable treatments.
          </p>
          <Link to="/workspace/disease-detection" className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-xl font-bold hover:bg-green-100 transition-colors">
            Scan a Leaf <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AiTools;