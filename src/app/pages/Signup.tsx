import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  
  // Example state for demonstrating error placeholders
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

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
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Email Field */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="email">Email Address</label>
                    <div className="relative">
                      <input 
                          type="email" 
                          id="email"
                          placeholder="athlete@sportsync.com"
                          className={`w-full bg-white/10 border rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:bg-white/15 transition-all
                            ${emailError 
                              ? 'border-red-400 focus:ring-red-400/50' 
                              : 'border-white/20 hover:border-white/30 focus:ring-purple-400/50 focus:border-purple-400/50'
                            }`}
                      />
                      {emailError && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                    </div>
                    {emailError && (
                      <p className="text-xs text-red-400 pl-1 mt-1 font-medium">Please enter a valid email address.</p>
                    )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium pl-1 text-white/80" htmlFor="password">Password</label>
                    <div className="relative">
                      <input 
                          type={showPassword ? "text" : "password"} 
                          id="password"
                          placeholder="Create a strong password"
                          className={`w-full bg-white/10 border rounded-xl pl-4 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:bg-white/15 transition-all
                            ${passwordError 
                              ? 'border-red-400 focus:ring-red-400/50' 
                              : 'border-white/20 hover:border-white/30 focus:ring-purple-400/50 focus:border-purple-400/50'
                            }`}
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
                    {passwordError && (
                      <p className="text-xs text-red-400 pl-1 mt-1 font-medium">Password must be at least 8 characters.</p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button 
                      type="submit" 
                      className="w-full bg-white text-purple-900 font-bold py-3.5 rounded-full hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer"
                  >
                      Create Account
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