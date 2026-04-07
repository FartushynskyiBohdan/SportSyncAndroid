import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import api, { isAxiosError } from '@/app/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

/* ─── Constants ─── */

const MAX_CHARS = 250;
const MIN_CHARS = 20;

const PROMPTS = [
  'What are you training for?',
  'Favorite workout?',
  'Ideal training partner?',
  'My go-to post-workout meal is…',
  'A sport I want to try next…',
  'My biggest athletic goal is…',
];

/* ─── Step indicator ─── */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < current ? 'bg-purple-400 w-8' : 'bg-white/20 w-4'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Form card ─── */

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/40">
      {children}
    </div>
  );
}

/* ─── Page ─── */

export function OnboardingBio() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [bio, setBio] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Auto-resize textarea */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [bio, resizeTextarea]);

  /* Validation */
  const charCount = bio.length;
  const tooShort = charCount > 0 && charCount < MIN_CHARS;
  const atLimit = charCount >= MAX_CHARS;
  const validationError =
    touched && charCount === 0
      ? 'Please write a short bio to continue.'
      : touched && tooShort
        ? `Your bio needs at least ${MIN_CHARS} characters (${MIN_CHARS - charCount} more).`
        : null;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  /* Insert prompt text */
  function insertPrompt(prompt: string) {
    const prefix = bio.length > 0 && !bio.endsWith(' ') && !bio.endsWith('\n') ? ' ' : '';
    const newBio = (bio + prefix + prompt).slice(0, MAX_CHARS);
    setBio(newBio);
    textareaRef.current?.focus();
  }

  /* Handle textarea change */
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setBio(value);
    }
  }

  /* Submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await api.post('/api/onboarding/bio', { bio: bio.trim() });
      navigate('/onboarding/preferences');
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setApiError(
          err.response?.data?.message ??
          err.response?.data?.error ??
          'Something went wrong. Please try again.'
        );
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* Character counter color */
  const counterColor =
    atLimit
      ? 'text-rose-400'
      : charCount >= MAX_CHARS * 0.85
        ? 'text-amber-400'
        : 'text-white/30';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold tracking-tight">SportSync</span>
        </div>

        <StepIndicator current={4} total={5} />

        <FormCard>
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Tell your story
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Write a short bio so other athletes know what you're about.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

            {/* Prompt chips */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                Need inspiration?
              </p>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map(prompt => (
                  <motion.button
                    key={prompt}
                    type="button"
                    onClick={() => insertPrompt(prompt)}
                    whileTap={{ scale: 0.95 }}
                    disabled={atLimit}
                    className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5
                      text-xs font-medium text-white/60
                      hover:bg-purple-500/15 hover:border-purple-400/40 hover:text-purple-200
                      transition-colors cursor-pointer
                      disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10 disabled:hover:text-white/60"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bio-textarea"
                className="text-xs font-semibold text-white/50 uppercase tracking-widest"
              >
                Your bio
              </label>
              <textarea
                ref={textareaRef}
                id="bio-textarea"
                value={bio}
                onChange={handleChange}
                placeholder="Tell other athletes about yourself, your goals, and what you're looking for…"
                rows={4}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/30
                  focus:outline-none focus:ring-2 transition-all resize-none overflow-hidden leading-relaxed
                  ${touched && !isValid && charCount > 0
                    ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/70'
                    : 'border-white/10 focus:ring-purple-500/30 focus:border-purple-400/50'
                  }`}
              />

              {/* Character counter */}
              <div className="flex items-center justify-between">
                <div>
                  {touched && tooShort && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {MIN_CHARS - charCount} more character{MIN_CHARS - charCount !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>
                <p className={`text-xs font-medium tabular-nums transition-colors ${counterColor}`}>
                  {charCount}/{MAX_CHARS}
                </p>
              </div>
            </div>

            {/* Validation error */}
            <AnimatePresence>
              {validationError && charCount === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {validationError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* API error */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || (touched && !isValid)}
              className="mt-2 flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base
                bg-gradient-to-br from-purple-500 to-purple-700
                hover:from-purple-400 hover:to-purple-600
                transition-all hover:scale-[1.02] active:scale-[0.98]
                shadow-xl shadow-purple-600/25
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
                : 'Continue →'
              }
            </button>

          </form>
        </FormCard>

        <p className="text-center text-xs text-white/30 mt-6">
          You can update your bio any time from your profile settings.
        </p>
      </motion.div>
    </div>
  );
}
