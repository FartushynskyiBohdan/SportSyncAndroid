import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import api, { isAxiosError } from '@/app/lib/api';
import { ChevronDown, Loader2, AlertCircle, Check } from 'lucide-react';

/* ─── Types ─── */

interface Gender   { id: number; name: string }
interface Goal     { id: number; name: string }
interface Sport    { id: number; name: string }

/* ─── Sport emoji map (shared with OnboardingSports) ─── */

const SPORT_ICONS: Record<string, string> = {
  Football:        '⚽',  Basketball:      '🏀',  Rugby:     '🏉',
  Volleyball:      '🏐',  Hockey:          '🏒',  Boxing:    '🥊',
  MMA:             '🥋',  CrossFit:        '🏋️', Swimming:  '🏊',
  Surfing:         '🏄',  Rowing:          '🚣',  Running:   '🏃',
  'Trail Running': '🥾',  Cycling:         '🚴',  Triathlon: '🏅',
  Skiing:          '⛷️',  Tennis:          '🎾',  Golf:      '⛳',
  Gymnastics:      '🤸',  Yoga:            '🧘',  'Rock Climbing': '🧗',
  Hiking:          '🥾',
};

function sportIcon(name: string) {
  return SPORT_ICONS[name] ?? '🏅';
}

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

/* ─── Select field ─── */

interface SelectOption { id: number | string; name: string }

interface SelectFieldProps {
  label:        string;
  value:        string;
  onChange:     (v: string) => void;
  options:      SelectOption[];
  error?:       string;
  placeholder?: string;
  loading?:     boolean;
}

function SelectField({ label, value, onChange, options, error, placeholder = 'Select…', loading }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          className={`w-full appearance-none bg-white/5 border rounded-xl px-4 py-3 pr-10 text-sm
            focus:outline-none focus:ring-2 transition-all cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed
            ${value ? 'text-white' : 'text-white/30'}
            ${error
              ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/70'
              : 'border-white/10 focus:ring-purple-500/30 focus:border-purple-400/50'
            }`}
        >
          <option value="" disabled className="bg-[#2E1065] text-white/50">
            {loading ? 'Loading…' : placeholder}
          </option>
          {options.map(opt => (
            <option key={opt.id} value={String(opt.id)} className="bg-[#2E1065] text-white">
              {opt.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            : <ChevronDown className="w-4 h-4 text-white/40" />
          }
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

/* ─── Range slider ─── */

interface RangeSliderProps {
  label:     string;
  min:       number;
  max:       number;
  step?:     number;
  value:     [number, number];
  onChange:  (v: [number, number]) => void;
  formatValue?: (v: number) => string;
}

function RangeSlider({ label, min, max, step = 1, value, onChange, formatValue = String }: RangeSliderProps) {
  const [lo, hi] = value;
  const range = max - min;

  const loPercent = ((lo - min) / range) * 100;
  const hiPercent = ((hi - min) / range) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-purple-300 tabular-nums">
          {formatValue(lo)} – {formatValue(hi)}
        </span>
      </div>

      <div className="relative h-10 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10" />

        {/* Active track */}
        <div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
          style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={e => {
            const v = Number(e.target.value);
            if (v < hi) onChange([v, hi]);
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-400
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30
            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-webkit-slider-thumb]:hover:shadow-purple-500/50
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-400
            [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          style={{ zIndex: lo > max - step * 2 ? 3 : 1 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={e => {
            const v = Number(e.target.value);
            if (v > lo) onChange([lo, v]);
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-400
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30
            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-webkit-slider-thumb]:hover:shadow-purple-500/50
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-400
            [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          style={{ zIndex: 2 }}
        />
      </div>
    </div>
  );
}

/* ─── Single-value slider ─── */

interface SingleSliderProps {
  label:        string;
  min:          number;
  max:          number;
  step?:        number;
  value:        number;
  onChange:     (v: number) => void;
  formatValue?: (v: number) => string;
}

function SingleSlider({ label, min, max, step = 1, value, onChange, formatValue = String }: SingleSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-purple-300 tabular-nums">
          {formatValue(value)}
        </span>
      </div>

      <div className="relative h-10 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10" />

        {/* Active track */}
        <div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
          style={{ left: 0, width: `${percent}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full appearance-none bg-transparent
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-400
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30
            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-webkit-slider-thumb]:hover:shadow-purple-500/50
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-400
            [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
        />
      </div>
    </div>
  );
}

/* ─── Validation ─── */

interface FormState {
  gender_id:       string;
  min_age:         number;
  max_age:         number;
  max_distance_km: number;
  goal_id:         string;
  sports:          number[];
}

interface FieldErrors {
  gender_id?: string;
  age?:       string;
  goal_id?:   string;
  sports?:    string;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.gender_id)            errors.gender_id = 'Please select a preferred gender.';
  if (form.min_age >= form.max_age) errors.age = 'Minimum age must be less than maximum age.';
  if (!form.goal_id)              errors.goal_id = 'Please select a relationship goal.';
  if (form.sports.length === 0)   errors.sports = 'Select at least one preferred sport.';
  return errors;
}

/* ─── Page ─── */

export function OnboardingPreferences() {
  const navigate = useNavigate();

  /* Lookup data */
  const [genders,     setGenders]     = useState<Gender[]>([]);
  const [goals,       setGoals]       = useState<Goal[]>([]);
  const [sports,      setSports]      = useState<Sport[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  /* Form state */
  const [form, setForm] = useState<FormState>({
    gender_id:       '',
    min_age:         18,
    max_age:         35,
    max_distance_km: 50,
    goal_id:         '',
    sports:          [],
  });

  const [touched,    setTouched]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);

  /* Fetch lookups */
  useEffect(() => {
    Promise.all([
      api.get<Gender[]>('/api/genders'),
      api.get<Goal[]>('/api/goals'),
      api.get<Sport[]>('/api/sports'),
    ])
      .then(([g, go, s]) => {
        setGenders(g.data);
        setGoals(go.data);
        setSports(s.data);
      })
      .catch(() => setFetchError('Failed to load data. Please refresh the page.'))
      .finally(() => setLoadingData(false));
  }, []);

  /* Derived validation */
  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  /* Helpers */
  function toggleSport(sportId: number) {
    setForm(prev => ({
      ...prev,
      sports: prev.sports.includes(sportId)
        ? prev.sports.filter(id => id !== sportId)
        : [...prev.sports, sportId],
    }));
  }

  /* Submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await api.post('/api/onboarding/preferences', {
        gender_id:       Number(form.gender_id),
        min_age:         form.min_age,
        max_age:         form.max_age,
        max_distance_km: form.max_distance_km,
        goal_id:         Number(form.goal_id),
        sports:          form.sports,
      });

      await api.patch('/api/users/onboarding-complete');

      navigate('/onboarding/complete');
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

        <StepIndicator current={5} total={5} />

        <FormCard>
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Who are you looking for?
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Set your preferences to find the right match.
            </p>
          </div>

          {/* Loading */}
          {loadingData && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          )}

          {/* Fetch error */}
          {fetchError && (
            <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {fetchError}
            </div>
          )}

          {!loadingData && !fetchError && (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

              {/* Gender preference */}
              <SelectField
                label="Preferred gender"
                value={form.gender_id}
                onChange={v => setForm(prev => ({ ...prev, gender_id: v }))}
                options={genders}
                error={touched ? errors.gender_id : undefined}
                placeholder="Select gender"
              />

              {/* Age range */}
              <div className="flex flex-col gap-1.5">
                <RangeSlider
                  label="Age range"
                  min={18}
                  max={65}
                  value={[form.min_age, form.max_age]}
                  onChange={([lo, hi]) => setForm(prev => ({ ...prev, min_age: lo, max_age: hi }))}
                  formatValue={v => `${v}`}
                />
                {touched && errors.age && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.age}
                  </p>
                )}
              </div>

              {/* Distance */}
              <SingleSlider
                label="Maximum distance"
                min={5}
                max={200}
                step={5}
                value={form.max_distance_km}
                onChange={v => setForm(prev => ({ ...prev, max_distance_km: v }))}
                formatValue={v => `${v} km`}
              />

              {/* Relationship goal */}
              <SelectField
                label="Relationship goal"
                value={form.goal_id}
                onChange={v => setForm(prev => ({ ...prev, goal_id: v }))}
                options={goals}
                error={touched ? errors.goal_id : undefined}
                placeholder="What are you looking for?"
              />

              {/* Preferred sports */}
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Preferred sports
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {sports.map(sport => {
                    const selected = form.sports.includes(sport.id);
                    return (
                      <motion.button
                        key={sport.id}
                        type="button"
                        onClick={() => toggleSport(sport.id)}
                        whileTap={{ scale: 0.94 }}
                        animate={selected ? { scale: 1.03 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                          ${selected
                            ? 'bg-purple-500/25 border-purple-400/60 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/30'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/25 hover:text-white'
                          }`}
                      >
                        <span className={selected ? 'text-purple-300' : 'text-white/40'}>
                          {sportIcon(sport.name)}
                        </span>
                        <span className="truncate">{sport.name}</span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {touched && errors.sports && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.sports}
                  </p>
                )}
              </div>

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
                  : 'Finish setup →'
                }
              </button>

            </form>
          )}
        </FormCard>

        <p className="text-center text-xs text-white/30 mt-6">
          You can adjust your preferences any time from discovery settings.
        </p>
      </motion.div>
    </div>
  );
}
