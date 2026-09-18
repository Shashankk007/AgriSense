import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-linear-to-br from-green-50 via-white to-blue-50">
      
      {/* Background Glowing Blobs (For that modern SaaS look) */}
      <div className="absolute top-20 left-10 w-72 md:w-96 h-72 md:h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute top-40 right-10 w-72 md:w-96 h-72 md:h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
        
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Modernize your farming <br />
          with <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-blue-600">AI tools</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium">
          Transform your agricultural workflow with our suite of premium AI tools. 
          Predict optimal crops, detect diseases, and enhance your yield.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/workspace/crop-health" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-all hover:-translate-y-0.5">
            Analyze my farm
          </Link>
          <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-8 rounded-xl shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5">
            Watch demo
          </button>
        </div>
        
        {/* Social Proof (Avatars) like the reference image */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex -space-x-3">
            <img className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="User 1" />
            <img className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="User 2" />
            <img className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="User 3" />
            <img className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="User 4" />
          </div>
          <p className="text-sm font-medium text-gray-500">Trusted by 10k+ farmers</p>
        </div>

      </div>
    </div>
  );
};

export default Hero;