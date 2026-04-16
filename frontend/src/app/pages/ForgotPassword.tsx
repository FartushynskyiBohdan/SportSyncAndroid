import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import api from '@/app/lib/api';

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({ mode: 'onBlur' });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setServerError('');
    try {
      await api.post('/api/auth/forgot-password', { email: data.email });
      setIsSubmitted(true);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          {isSubmitted ? (
            /* ── Success State ── */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-2">Check your email</h1>
              <p className="text-purple-200/70 text-sm mb-8 leading-relaxed">
                If an account with that email exists, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              {/* Back link */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-2">Reset your password</h1>
                <p className="text-purple-200/70 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <p className="text-sm text-rose-300">{serverError}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1 text-white/80" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      placeholder="runner@sportsync.com"
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 pl-11 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all ${
                        errors.email ? 'border-rose-500/50' : 'border-white/20'
                      }`}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email address',
                        },
                      })}
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-400 pl-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-purple-900 font-bold py-3.5 rounded-full hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
