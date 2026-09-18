import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext'; 
import { googleLoginAPI, registerAPI } from '../api/farmApi'; 

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

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); // Get setUser from memory
  const [isLoading, setIsLoading] = useState(false); // UI loading state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const buildUsername = () => {
    const firstPart = `${firstName}${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    const emailPart = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    const base = firstPart || emailPart || 'farmer';
    return `${base}_${Date.now().toString().slice(-6)}`;
  };

  // Secure Google Auth handler
  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      // Send token to backend for secure HttpOnly cookie
      const data = await googleLoginAPI(credentialResponse.credential);
      if (data.success) {
        setUser({
          id: data.user.id,
          name: data.user.username || data.user.name,
          email: data.user.email,
          picture: data.user.profileImage,
          profileImage: data.user.profileImage,
          phone: data.user.phone || '',
          address: data.user.address || '',
        }); // Store in React state
        navigate('/workspace'); // Redirect to dashboard
      }
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phone validation ──
  const validatePhone = (num) => {
    if (!num) return 'Mobile number is required.';
    return '';
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // strip non-digits, no length limit
    setPhoneNumber(val);
    setPhoneError(validatePhone(val));
  };

  // Manual form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const pErr = validatePhone(phoneNumber);
    if (pErr) {
      setPhoneError(pErr);
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const username = buildUsername();
      const combinedPhone = `${countryCode} ${phoneNumber}`;

      const data = await registerAPI({ 
        username, 
        email: normalizedEmail, 
        password, 
        phone: combinedPhone,
        address: address.trim() 
      });
      setUser({
        id: data.id,
        name: data.username,
        email: data.email,
        picture: data.profileImage,
        profileImage: data.profileImage,
        phone: data.phone || '',
        address: data.address || '',
      });
      navigate('/workspace');
    } catch (error) {
      console.error('Registration failed:', error);
      const backendMessage = error?.response?.data?.message || error?.response?.data?.detail || error?.message;
      alert(backendMessage || 'Could not create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f9f6] py-10">
      <div className="bg-white p-8 sm:p-10 rounded-4xl shadow-sm border border-gray-100 w-full max-w-lg relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-green-600 tracking-tight flex items-center justify-center gap-2">
            🌱 Agrisense
          </h1>
          <h2 className="text-gray-800 font-bold text-xl mt-4">Create Your Account</h2>
          <p className="text-gray-500 text-sm mt-2">Fill in your details to start your smart farming journey.</p>
        </div>

        {/* Manual Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="Ramesh" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="Kumar" required />
            </div>
          </div>

          {/* Phone — country code + number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
            <div className="flex gap-2">
              {/* Country code dropdown */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm shrink-0 cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              {/* 10-digit number */}
              <div className="flex-1">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-sm ${
                    phoneError
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                  }`}
                  required
                />
                {phoneError ? (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {phoneError}
                  </p>
                ) : phoneNumber.length > 0 ? (
                  <p className="text-xs text-green-600 mt-1">✓ Valid number format</p>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="farmer@agrisense.com" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="3" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm resize-none" placeholder="Enter your farm or home address..." required ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm" placeholder="••••••••" minLength="6" required />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm mt-4" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-100 w-full"></div>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">OR</span>
          <div className="h-px bg-gray-100 w-full"></div>
        </div>

        {/* Google Auth Section */}
        <div className="flex justify-center flex-col items-center gap-2">
          {isLoading ? (
            <div className="text-sm font-semibold text-green-600 animate-pulse">Setting up your account...</div>
          ) : (
            <GoogleLogin 
              onSuccess={handleSuccess} 
              onError={() => {
                console.log('Signup Failed');
                alert('Google connection failed.');
              }} 
              shape="rectangular" 
              theme="outline" 
              text="signup_with" 
              size="large" 
            />
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account? <Link to="/login" className="text-green-600 font-bold hover:underline transition-all">Log in</Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;