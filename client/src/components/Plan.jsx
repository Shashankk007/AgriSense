import React from 'react';

const Plan = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h3 className="text-4xl font-extrabold text-gray-800 mb-4">Choose Your Plan</h3>
        <p className="text-gray-600 text-lg">Simple, transparent pricing for every farm size.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-200">
          <h4 className="text-xl font-bold text-gray-500 mb-2">Free Tier</h4>
          <p className="text-5xl font-extrabold text-gray-800 mb-6">$0<span className="text-lg text-gray-500 font-medium">/mo</span></p>
          <ul className="space-y-4 mb-8 text-gray-600">
            <li className="flex items-center gap-2">✔️ 10 Crop Predictions / month</li>
            <li className="flex items-center gap-2">✔️ 5 Disease Scans / month</li>
            <li className="flex items-center gap-2">✔️ Basic Community Access</li>
          </ul>
          <button className="w-full bg-green-100 text-green-700 font-bold py-3 rounded-xl hover:bg-green-200 transition-colors">Current Plan</button>
        </div>

        {/* Pro Plan */}
        <div className="bg-green-600 p-8 rounded-3xl shadow-xl text-white transform md:-translate-y-4">
          <h4 className="text-xl font-bold text-green-200 mb-2">Agrisense Pro</h4>
          <p className="text-5xl font-extrabold mb-6">$19<span className="text-lg text-green-200 font-medium">/mo</span></p>
          <ul className="space-y-4 mb-8 text-white">
            <li className="flex items-center gap-2">✔️ Unlimited Crop Predictions</li>
            <li className="flex items-center gap-2">✔️ Unlimited Disease Scans</li>
            <li className="flex items-center gap-2">✔️ API Access & Analytics</li>
          </ul>
          <button className="w-full bg-white text-green-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">Upgrade to Pro</button>
        </div>
      </div>
    </section>
  );
};

export default Plan;