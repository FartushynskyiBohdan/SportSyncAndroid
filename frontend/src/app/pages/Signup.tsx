import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

export function Signup() {
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.onboardingComplete ? '/discover' : '/onboarding/profile'} replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/signup', formData);

      login(response.data.token, response.data.user);
      navigate('/onboarding/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2E1065]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold font-heading tracking-tight cursor-pointer hover:text-purple-200 transition-colors">
            SportSync
          </Link>
          <Link to="/login" className="text-sm font-semibold hover:text-purple-300 transition-colors">
            Login
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-24 mt-20 md:py-32">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[420px] bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl shadow-purple-950/50"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black font-heading tracking-tight mb-3 text-white">
                  Join the Athlete Community
                </h1>
                <p className="text-purple-200/80 text-sm leading-relaxed">
                  Find training partners, competitors, and meaningful connections.
                </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="text-red-400 text-sm text-center">{error}</div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="athlete@sportsync.com"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                        required
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="password">Password</label>
                    <div className="relative">
                      <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a strong password"
                          className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                          required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-purple-900 font-bold py-3.5 rounded-full hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer disabled:opacity-50"
                  >
                      {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-purple-200/60">
                <Link to="/login" className="text-white font-medium hover:underline hover:text-purple-200 transition-colors">
                  Already have an account? Log in
                </Link>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
