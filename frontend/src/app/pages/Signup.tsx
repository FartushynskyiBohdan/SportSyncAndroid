import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
import { Navbar } from '../components/Navbar';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';
import api from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',   test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p: string) => /\d/.test(p) },
];

export function Signup() {
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.onboardingComplete ? '/discover' : '/onboarding/profile'} replace />;
  }

  const emailInvalid = emailTouched && formData.email.length > 0 && !isEmail(formData.email);
  const passwordRulesFailed = formData.password.length > 0
    ? PASSWORD_RULES.filter(r => !r.test(formData.password))
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (PASSWORD_RULES.some(r => !r.test(formData.password))) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/signup', {
        email: formData.email,
        password: formData.password,
      });
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
      <Navbar />

      <div className="flex-1 flex items-start justify-center px-6 py-25">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl shadow-purple-950/50"
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
                        type="text"
                        inputMode="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="athlete@sportsync.com"
                        className={`w-full bg-white/10 border rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all ${
                          emailInvalid ? 'border-rose-500/50' : 'border-white/20'
                        }`}
                        required
                    />
                    {emailInvalid && (
                      <p className="text-xs text-rose-400 pl-1">Enter a valid email address</p>
                    )}
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
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={formData.password} />
                    {passwordRulesFailed.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {passwordRulesFailed.map(r => (
                          <li key={r.label} className="text-xs text-rose-400 pl-1">
                            {r.label} required
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="relative">
                      <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repeat your password"
                          className={`w-full bg-white/10 border rounded-xl pl-4 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all ${
                            formData.confirmPassword && formData.confirmPassword !== formData.password
                              ? 'border-rose-500/50'
                              : 'border-white/20'
                          }`}
                          required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                      <p className="text-xs text-rose-400 pl-1">Passwords do not match</p>
                    )}
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
                Already have an account?{' '}
                <Link to="/login" className="text-white font-medium hover:underline hover:text-purple-200 transition-colors">Log in</Link>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
