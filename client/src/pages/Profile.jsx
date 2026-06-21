import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    picture: '',
    plan: 'Premium Farmer'
  });

  // LocalStorage se data nikal kar form me pre-fill karna
  useEffect(() => {
    const storedUser = localStorage.getItem('agrisense_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // Google se aane wale poore naam ko First aur Last me split kar rahe hain
      const nameParts = parsedUser.name ? parsedUser.name.split(' ') : [''];
      const fName = nameParts[0] || '';
      const lName = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        firstName: fName,
        lastName: lName,
        email: parsedUser.email || '',
        picture: parsedUser.picture || '',
        // Asli app me phone aur address backend se aayega, abhi ke liye empty default
        phone: parsedUser.phone || '',
        address: parsedUser.address || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Profile Data Saved:", formData);
    // Yahan backend API call aayega jo details database me update karega
    alert("Profile successfully updated! 🌱");
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-2">Manage your personal information and farm details.</p>
      </div>

      <div className="bg-white rounded-4xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Top Banner & Avatar Section */}
        <div className="bg-green-600 h-32 w-full"></div>
        <div className="px-8 sm:px-12 pb-8">
          
          {/* Flex container jisme ab sab perfect align hoga */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-8">
            
            {/* Avatar par directly -mt-12 lagaya hai taaki sirf photo banner par over-lap kare */}
            <div className="-mt-12 w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative z-10 shrink-0">
              {formData.picture ? (
                <img 
                  src={formData.picture} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                  {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            {/* Name and Badge Container (Ab ye white area me perfect aayega) */}
            <div className="pb-1 sm:pb-2">
              <h2 className="text-2xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 mt-1.5">
                ✨ {formData.plan}
              </span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
                  required 
                />
              </div>
              
              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email (Read Only from Google) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm" 
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 "
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" 
                />
              </div>
            </div>

            {/* Farm Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Farm/Home Address</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm resize-none" 
                placeholder="Enter your complete address..." 
              ></textarea>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm"
              >
                Save Changes
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;