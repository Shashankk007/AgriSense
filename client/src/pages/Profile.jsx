import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfileAPI, changePasswordAPI, changeProfileImageAPI } from '../api/farmApi';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);

  // --- Profile form state ---
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text: '' }

  // --- Password form state ---
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // --- Profile image state ---
  const [imgUploading, setImgUploading] = useState(false);
  const [imgMsg, setImgMsg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // Bootstrap form from context user
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      setPreviewUrl(user.picture || user.profileImage || '');
    }
  }, [user]);

  if (!user) return <div className="p-8 text-center text-gray-500 font-semibold">Loading Profile...</div>;

  // ========================
  // Handlers
  // ========================

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const result = await updateProfileAPI({
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });
      // Update AuthContext so sidebar and other parts refresh
      setUser((prev) => ({
        ...prev,
        name: result.user.username,
        phone: result.user.phone,
        address: result.user.address,
      }));
      setProfileMsg({ type: 'success', text: '✅ Profile updated successfully!' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await changePasswordAPI({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: 'success', text: '✅ Password changed successfully!' });
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Instant local preview
    setPreviewUrl(URL.createObjectURL(file));
    handleImageUpload(file);
  };

  const handleImageUpload = async (file) => {
    setImgUploading(true);
    setImgMsg(null);
    try {
      const result = await changeProfileImageAPI(file);
      const newUrl = result.user?.profileImage || previewUrl;
      setUser((prev) => ({ ...prev, picture: newUrl, profileImage: newUrl }));
      setPreviewUrl(newUrl);
      setImgMsg({ type: 'success', text: '✅ Photo updated!' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to upload image.';
      setImgMsg({ type: 'error', text: msg });
    } finally {
      setImgUploading(false);
    }
  };

  // Helper for message banners
  const MsgBanner = ({ msg }) => {
    if (!msg) return null;
    return (
      <p className={`text-sm font-medium mt-3 px-3 py-2 rounded-lg ${
        msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
      }`}>
        {msg.text}
      </p>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and account settings.</p>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-green-500 to-emerald-600" />

        <div className="px-8 pb-8">
          {/* Avatar + Name row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-8">

            {/* Clickable Avatar */}
            <div className="relative -mt-14 shrink-0">
              <div
                className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                    {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  {imgUploading ? (
                    <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            <div className="pb-1">
              <h2 className="text-2xl font-bold text-gray-900">{formData.username}</h2>
              <p className="text-sm text-gray-500">{formData.email}</p>
              {imgMsg && <p className={`text-xs mt-1 font-medium ${imgMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{imgMsg.text}</p>}
            </div>
          </div>

          {/* Profile Edit Form */}
          <form onSubmit={handleProfileSave} className="space-y-5">
            <h3 className="text-base font-bold text-gray-700 border-b border-gray-100 pb-2">Personal Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleProfileChange}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Farm / Home Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleProfileChange}
                rows="3"
                placeholder="Enter your complete address..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm resize-none"
              />
            </div>

            <MsgBanner msg={profileMsg} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2.5 px-8 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
              >
                {profileSaving && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Change Password Card ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-base font-bold text-gray-700 mb-5 flex items-center gap-2">
          <span>🔒</span> Change Password
        </h3>

        <form onSubmit={handlePwSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
            <input
              type="password"
              name="oldPassword"
              value={pwForm.oldPassword}
              onChange={handlePwChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={pwForm.newPassword}
                onChange={handlePwChange}
                placeholder="Min. 6 characters"
                minLength={6}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={pwForm.confirmPassword}
                onChange={handlePwChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <MsgBanner msg={pwMsg} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-bold py-2.5 px-8 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
            >
              {pwSaving && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Profile;
