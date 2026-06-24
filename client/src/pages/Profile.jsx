import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfileAPI, changePinAPI, updateProfileImageAPI } from '../api/farmApi';
import toast from 'react-hot-toast'; 

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    picture: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinData, setPinData] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [isPinLoading, setIsPinLoading] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/1326/1326382.png";

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        picture: user.profileImage || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 1. PROFILE TEXT SAVE FUNCTION
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const responseData = await updateProfileAPI({
        fullName: formData.fullName,
        email: formData.email
      });

      if (responseData && responseData.success) {
        setUser((prevUser) => ({
          ...prevUser,
          fullName: responseData.user.fullName,
          name: responseData.user.fullName,
          email: responseData.user.email
        }));

        toast.success("Profile successfully updated! 🌱"); // 🟢 Alert ki jagah Toast
      } else {
        toast.error("Server did not return success.");
      }
    } catch (error) {
      console.error("Full Error Object:", error);
      let exactError = "Failed to update profile.";
      if (error.response && error.response.data && error.response.data.message) {
        exactError = error.response.data.message;
      } else if (error.message) {
        exactError = error.message;
      }
      toast.error(`ERROR: ${exactError}`); // 🟢 Alert ki jagah Toast
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 2. NAYA FUNCTION: IMAGE SAVE KARNE KE LIYE
  const handleSaveProfileImage = async () => {
    setIsImageUploading(true);
    try {
      const data = new FormData();
      if (selectedFile) {
        data.append('profileImage', selectedFile);
      } else if (previewUrl === DEFAULT_AVATAR) {
        data.append('defaultImage', DEFAULT_AVATAR);
      }

      const res = await updateProfileImageAPI(data);
      
      if (res.success) {
        // State update karte hi screen par photo change ho jayegi (No Refresh needed)
        setUser(prev => ({ ...prev, picture: res.profileImage, profileImage: res.profileImage }));
        setFormData(prev => ({ ...prev, picture: res.profileImage }));
        
        setIsImageModalOpen(false);
        setSelectedFile(null);
        
        // 🟢 Success Toast Modal band hone ke baad
        toast.success("Profile picture updated successfully! 📸");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update picture");
    } finally {
      setIsImageUploading(false);
    }
  };


  if (!user) return <div className="p-8 text-center text-gray-500 font-semibold">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-2">Manage your personal information.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600 font-bold py-2 px-4 rounded-xl transition-all text-sm"
        >
          Change 4-Digit PIN
        </button>
      </div>

      <div className="bg-white rounded-4xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-green-600 h-32 w-full"></div>
        <div className="px-8 sm:px-12 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-8">
            
            {/* AVATAR SECTION */}
            <div 
              onClick={() => {
                setPreviewUrl(formData.picture || DEFAULT_AVATAR);
                setIsImageModalOpen(true);
              }}
              className="-mt-12 w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative z-10 shrink-0 group cursor-pointer"
            >
              <img 
                src={formData.picture || DEFAULT_AVATAR} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
            </div>

            <div className="pb-1 sm:pb-2">
              <h2 className="text-2xl font-bold text-gray-900">{formData.fullName}</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Registered Farmer</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number (Login ID)</label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm font-medium" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Update your email (Optional)" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-sm disabled:bg-gray-400">
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CHANGE PIN MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => { setIsPinModalOpen(false); setPinData({oldPin:'', newPin:'', confirmPin:''}); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✖</button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Change PIN</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if(pinData.newPin !== pinData.confirmPin) {
                return toast.error("New PIN and Confirm PIN do not match!"); // 🟢 Alert ki jagah Toast
              }
              setIsPinLoading(true);
              try {
                const res = await changePinAPI(pinData.oldPin, pinData.newPin);
                if(res.success) {
                  toast.success(res.message || "PIN Changed Successfully!"); // 🟢 Alert ki jagah Toast
                  setIsPinModalOpen(false);
                  setPinData({oldPin:'', newPin:'', confirmPin:''});
                }
              } catch (error) {
                toast.error(error.response?.data?.message || "Failed to change PIN"); // 🟢 Alert ki jagah Toast
              } finally {
                setIsPinLoading(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Old 4-Digit PIN</label>
                <input type="password" maxLength="4" required value={pinData.oldPin} onChange={(e)=>setPinData({...pinData, oldPin: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New 4-Digit PIN</label>
                <input type="password" maxLength="4" required value={pinData.newPin} onChange={(e)=>setPinData({...pinData, newPin: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New PIN</label>
                <input type="password" maxLength="4" required value={pinData.confirmPin} onChange={(e)=>setPinData({...pinData, confirmPin: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <button type="submit" disabled={isPinLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl mt-2 disabled:bg-gray-400">
                {isPinLoading ? "Updating..." : "Update PIN"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE UPLOAD MODAL */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2023] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700 overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Profile Picture</h2>
              <button onClick={() => { setIsImageModalOpen(false); setSelectedFile(null); }} className="text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 flex justify-center">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border border-gray-600 bg-black group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <input 
                  type="file" 
                  id="imageUpload" 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file)); 
                    }
                  }}
                />
                <label htmlFor="imageUpload" className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm font-semibold text-center py-2 cursor-pointer hover:bg-opacity-80 transition-all">
                  Upload File
                </label>
              </div>
            </div>

            <div className="px-5 py-4 bg-[#1a1c1e] flex justify-between items-center border-t border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Maximum file size: 5 MB</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(DEFAULT_AVATAR); 
                  }}
                  className="text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
                
                {/* 🟢 SAVE BUTTON PAR FUNCTION CALL */}
                <button 
                  disabled={isImageUploading || (!selectedFile && previewUrl === formData.picture)}
                  onClick={handleSaveProfileImage} 
                  className="bg-[#2d5a40] hover:bg-[#356b4c] disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold py-2 px-6 rounded-full transition-all"
                >
                  {isImageUploading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;