import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordAPI } from '../api/farmApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const data = await forgotPasswordAPI(email);
      setMessage(data.message || 'If an account with that email exists, a reset link has been sent.');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f9f6]">
      <div className="w-full max-w-md p-8 m-4 bg-white rounded-3xl shadow-xl border border-green-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password</h2>
          <p className="text-gray-500 font-medium">Enter your email to receive a reset link.</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm font-medium placeholder-gray-400"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || message}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-95 disabled:bg-green-400 disabled:active:scale-100 text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-bold hover:underline transition-all">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
