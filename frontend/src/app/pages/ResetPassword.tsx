import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
const isStrongPassword = (pw: string, opts: { minLength: number; minLowercase: number; minUppercase: number; minNumbers: number; minSymbols: number }) =>
  pw.length >= opts.minLength &&
  (opts.minLowercase === 0 || /[a-z]/.test(pw)) &&
  (opts.minUppercase === 0 || /[A-Z]/.test(pw)) &&
  (opts.minNumbers === 0 || /[0-9]/.test(pw)) &&
  (opts.minSymbols === 0 || /[^a-zA-Z0-9]/.test(pw));
import { Navbar } from '../components/Navbar';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';
import api from '@/app/lib/api';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({ mode: 'onBlur' });

  const passwordValue = watch('password');


  const onSubmit = async (data: ResetPasswordForm) => {
    setServerError('');
    try {
      await api.post('/api/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      setServerError(message);
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl shadow-purple-950/50 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Invalid reset link</h1>
            <p className="text-purple-200/70 text-sm mb-8 leading-relaxed">
              This password reset link is invalid or missing a token. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium bg-white text-purple-900 px-6 py-3 rounded-full hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
            >
              Request New Link
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

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
          {isSuccess ? (
            /* ── Success State ── */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-2">Password reset!</h1>
              <p className="text-purple-200/70 text-sm mb-8 leading-relaxed">
                Your password has been updated successfully. You'll be redirected to the login page in a few seconds.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium bg-white text-purple-900 px-6 py-3 rounded-full hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
              >
                Continue to Login
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
                <h1 className="text-3xl font-black tracking-tight mb-2">Set new password</h1>
                <p className="text-purple-200/70 text-sm">
                  Choose a strong password for your account.
                </p>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-sm text-rose-300">{serverError}</p>
                    {serverError.toLowerCase().includes('expired') && (
                      <Link
                        to="/forgot-password"
                        className="text-xs text-rose-400 hover:text-rose-300 underline mt-1 inline-block"
                      >
                        Request a new reset link
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1 text-white/80" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="••••••••"
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 pl-11 pr-11 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all ${
                        errors.password ? 'border-rose-500/50' : 'border-white/20'
                      }`}
                      {...register('password', {
                        required: 'Password is required',
                        validate: (value) =>
                          isStrongPassword(value, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }) ||
                          'Must be 8+ characters with uppercase, lowercase, and a number',
                      })}
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={passwordValue ?? ''} />
                  {errors.password && (
                    <p className="text-xs text-rose-400 pl-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium pl-1 text-white/80" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="••••••••"
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 pl-11 pr-11 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all ${
                        errors.confirmPassword ? 'border-rose-500/50' : 'border-white/20'
                      }`}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value =>
                          value === passwordValue || 'Passwords do not match',
                      })}
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-400 pl-1">{errors.confirmPassword.message}</p>
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
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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
