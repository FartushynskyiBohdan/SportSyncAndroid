import { useState } from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Link, Navigate, useNavigate } from 'react-router';
import api from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

export function Login() {
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.onboardingComplete ? '/discover' : '/onboarding/profile'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      login(response.data.token, response.data.user, rememberMe);
      navigate('/discover');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl shadow-purple-950/50"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h1>
                <p className="text-purple-200/80 text-sm">Sign in to continue your streak.</p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="text-red-400 text-sm text-center">{error}</div>
                )}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="email">Email</label>
                    <input 
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="runner@sportsync.com"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                        required
                    />
                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-xs text-purple-300 hover:text-white transition-colors">Forgot password?</Link>
                    </div>
                </div>

                <div
                  className="flex items-center gap-3 pl-1 cursor-pointer select-none"
                  onClick={() => setRememberMe(v => !v)}
                >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-purple-500 border-purple-400' : 'bg-white/10 border-white/30 hover:border-white/60'}`}>
                        {rememberMe && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                    </div>
                    <span className="text-sm font-medium text-white/70 hover:text-white transition-colors">Remember me</span>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-white text-purple-900 font-bold py-3.5 rounded-full hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 mt-2 cursor-pointer disabled:opacity-50"
                >
                    {loading ? 'Logging In...' : 'Log In'}
                </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-purple-200/60">
                Don't have an account?{' '}
                <Link to="/signup" className="text-white font-medium hover:underline hover:text-purple-200 transition-colors">Sign up</Link>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
