import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfileAPI, changePasswordAPI, changeProfileImageAPI } from '../api/farmApi';

// ── Country codes list ──
const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
];

// Helper — split stored phone string (e.g. "+91 9876543210") into {code, number}
function parsePhone(stored) {
  if (!stored) return { code: '+91', number: '' };
  for (const c of COUNTRY_CODES) {
    if (stored.startsWith(c.code + ' ')) {
      return { code: c.code, number: stored.slice(c.code.length + 1) };
    }
  }
  // No known prefix — treat entire string as number
  return { code: '+91', number: stored };
}

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);

  // --- Profile form state ---
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    address: '',
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text: '' }
  const [isEditing, setIsEditing] = useState(false);

  // --- Password form state ---
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // --- Profile image state ---
  const [imgUploading, setImgUploading] = useState(false);
  const [imgMsg, setImgMsg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // Bootstrap form from context user — only on initial mount, not on every user update
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (user && !bootstrapped.current) {
      bootstrapped.current = true;
      const parsed = parsePhone(user.phone || '');
      setCountryCode(parsed.code);
      setPhoneNumber(parsed.number);
      setFormData({
        username: user.name || '',
        email: user.email || '',
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

  const handleCancelEdit = () => {
    // Revert form data to the stored user context values
    const parsed = parsePhone(user.phone || '');
    setCountryCode(parsed.code);
    setPhoneNumber(parsed.number);
    setPhoneError('');
    setFormData({
      username: user.name || '',
      email: user.email || '',
      address: user.address || '',
    });
    setProfileMsg(null);
    setIsEditing(false);
  };

  // ── Phone validation ──
  const validatePhone = (num) => {
    if (!num) return ''; // optional field
    // Just ensure it only contains digits, though the input handler already strips non-digits.
    return '';
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // strip non-digits, no length limit
    setPhoneNumber(val);
    setPhoneError(validatePhone(val));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    // Validate phone before submitting
    const pErr = validatePhone(phoneNumber);
    if (pErr) { setPhoneError(pErr); return; }

    setProfileSaving(true);
    setProfileMsg(null);
    const combinedPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
    try {
      const result = await updateProfileAPI({
        username: formData.username.trim(),
        phone: combinedPhone,
        address: formData.address.trim(),
      });
      console.log('✅ Profile save result:', result);
      setUser((prev) => ({
        ...prev,
        name: result.user.username,
        phone: result.user.phone,
        address: result.user.address,
      }));
      const parsed = parsePhone(result.user.phone || '');
      setCountryCode(parsed.code);
      setPhoneNumber(parsed.number);
      setFormData((prev) => ({
        ...prev,
        username: result.user.username,
        address: result.user.address || '',
      }));
      setProfileMsg({ type: 'success', text: '✅ Profile updated successfully!' });
      setIsEditing(false); // <--- Exit edit mode on success
    } catch (err) {
      console.error('❌ Profile save error:', err?.response?.data || err.message);
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-gray-700">Personal Information</h3>
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                  className="text-sm font-bold text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm ${
                    isEditing 
                      ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500' 
                      : 'bg-transparent border-b border-gray-200 text-gray-700 font-medium'
                  }`}
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
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                    isEditing 
                      ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-transparent border-b border-gray-200 text-gray-700 font-medium cursor-not-allowed'
                  }`}
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>

              {/* Phone — country code + number */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  {/* Country code dropdown */}
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={!isEditing}
                    className={`px-3 py-2.5 rounded-xl outline-none transition-all text-sm shrink-0 ${
                      isEditing 
                        ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer'
                        : 'bg-transparent border-b border-gray-200 text-gray-700 font-medium appearance-none cursor-not-allowed'
                    }`}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} {c.name}
                      </option>
                    ))}
                  </select>
                  {/* Phone number */}
                  <div className="flex-1">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder={isEditing ? "9876543210" : "No phone number added"}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm ${
                        !isEditing 
                          ? 'bg-transparent border-b border-gray-200 text-gray-700 font-medium'
                          : phoneError
                            ? 'bg-gray-50 border border-red-400 focus:ring-red-400 focus:border-red-400'
                            : 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
                      }`}
                    />
                    {isEditing && phoneError ? (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {phoneError}
                      </p>
                    ) : isEditing && phoneNumber.length > 0 ? (
                      <p className="text-xs text-green-600 mt-1">✓ Valid number format</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Farm / Home Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleProfileChange}
                disabled={!isEditing}
                rows={isEditing ? "3" : "1"}
                placeholder={isEditing ? "Enter your complete address..." : "No address added"}
                className={`w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm resize-none ${
                  isEditing 
                    ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    : 'bg-transparent border-b border-gray-200 text-gray-700 font-medium'
                }`}
              />
            </div>

            <MsgBanner msg={profileMsg} />

            {isEditing && (
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-green-600 hover:bg-green-700 active:scale-95 disabled:bg-green-400 disabled:active:scale-100 text-white font-bold py-2.5 px-8 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
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
            )}
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
              className="bg-gray-800 hover:bg-gray-900 active:scale-95 disabled:bg-gray-400 disabled:active:scale-100 text-white font-bold py-2.5 px-8 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
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
