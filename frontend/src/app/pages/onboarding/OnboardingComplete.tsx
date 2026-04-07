import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';

/* ─── Animated checkmark ring ─── */

function SuccessIcon() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.6, 1.8] }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
        className="absolute w-32 h-32 rounded-full bg-purple-500/20"
      />

      {/* Ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-700
          shadow-2xl shadow-purple-600/40 flex items-center justify-center"
      >
        {/* Inner shimmer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"
        />

        {/* Check icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.35 }}
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Confetti-style floating particles ─── */

function Particles() {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 360;
    const radius = 80 + Math.random() * 60;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    const size = 3 + Math.random() * 4;
    const delay = 0.4 + Math.random() * 0.4;

    return (
      <motion.div
        key={i}
        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
        animate={{ x, y, opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
        transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: i % 3 === 0
            ? '#a855f7'
            : i % 3 === 1
              ? '#c084fc'
              : '#e9d5ff',
        }}
      />
    );
  });

  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{particles}</div>;
}

/* ─── Page ─── */

export function OnboardingComplete() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-center mb-12"
        >
          <span className="text-2xl font-bold tracking-tight">SportSync</span>
        </motion.div>

        {/* Step indicator — all 5 complete */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-2 mb-12"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-8 rounded-full bg-purple-400 transition-all duration-300"
            />
          ))}
        </motion.div>

        {/* Success animation */}
        <div className="relative mb-10">
          <Particles />
          <SuccessIcon />
        </div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-3xl sm:text-4xl font-black tracking-tight text-center leading-tight mb-3"
        >
          You're ready to connect
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="text-white/50 text-center text-base max-w-sm mb-10 leading-relaxed"
        >
          Your profile is set up. Start discovering athletes who share your passion and find your perfect training partner.
        </motion.p>

        {/* Card with summary */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-2xl shadow-black/40 mb-8"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-300">Profile active</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-white/40">Here's what's next:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {[
                  { emoji: '🔍', label: 'Discover athletes' },
                  { emoji: '💜', label: 'Swipe & match' },
                  { emoji: '💬', label: 'Start chatting' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5 flex flex-col items-center gap-2"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-xs font-semibold text-white/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/discover')}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base
            bg-gradient-to-br from-purple-500 to-purple-700
            hover:from-purple-400 hover:to-purple-600
            transition-all shadow-xl shadow-purple-600/25"
        >
          Start discovering
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="text-center text-xs text-white/30 mt-6"
        >
          You can update your profile and preferences any time from settings.
        </motion.p>
      </motion.div>
    </div>
  );
}
