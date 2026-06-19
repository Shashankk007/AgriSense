import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 text-center">
      <p className="mb-2 text-lg font-semibold tracking-wide">🌱 AGRISENSE</p>
      <p className="mb-4">© 2026 Agrisense. Made for Farmers.</p>
      <div className="flex justify-center gap-6 text-sm">
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-white transition-colors">Contact Us</a>
      </div>
    </footer>
  );
};

export default Footer;