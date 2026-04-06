import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import api, { isAxiosError } from '@/app/lib/api';
import { ChevronDown, Loader2, AlertCircle, Check } from 'lucide-react';

/* ─── Types ─── */

interface Sport     { id: number; name: string; }
interface SkillLevel { id: number; name: string; }
interface Frequency  { id: number; name: string; }

interface SportDetail {
  skill_level_id:  string;
  years_experience: string;
  frequency_id:    string;
}

/* ─── Sport emoji map ─── */

const SPORT_ICONS: Record<string, string> = {
  // Team
  Football:        '⚽',
  Basketball:      '🏀',
  Rugby:           '🏉',
  Volleyball:      '🏐',
  Hockey:          '🏒',
  // Combat / Strength
  Boxing:          '🥊',
  MMA:             '🥋',
  CrossFit:        '🏋️',
  // Water
  Swimming:        '🏊',
  Surfing:         '🏄',
  Rowing:          '🚣',
  // Outdoor / Endurance
  Running:         '🏃',
  'Trail Running': '🥾',
  Cycling:         '🚴',
  Triathlon:       '🏅',
  Skiing:          '⛷️',
  // Individual
  Tennis:          '🎾',
  Golf:            '⛳',
  Gymnastics:      '🤸',
  Yoga:            '🧘',
  'Rock Climbing': '🧗',
  Hiking:          '🥾',
};

function sportIcon(name: string) {
  return SPORT_ICONS[name] ?? '🏅';
}

/* ─── Thematic groups ─── */

const SPORT_GROUPS: { label: string; sports: string[] }[] = [
  { label: 'Team Sports',         sports: ['Football', 'Basketball', 'Rugby', 'Volleyball', 'Hockey'] },
  { label: 'Combat & Strength',   sports: ['Boxing', 'MMA', 'CrossFit'] },
  { label: 'Water Sports',        sports: ['Swimming', 'Surfing', 'Rowing'] },
  { label: 'Outdoor & Endurance', sports: ['Running', 'Trail Running', 'Cycling', 'Triathlon', 'Skiing'] },
  { label: 'Individual Sports',   sports: ['Tennis', 'Golf', 'Gymnastics', 'Yoga', 'Rock Climbing', 'Hiking'] },
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

/* ─── Select field ─── */

interface SelectOption { id: number | string; name: string; }

interface SelectFieldProps {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  options:     SelectOption[];
  error?:      string;
  placeholder?: string;
  loading?:    boolean;
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

/* ─── Number input ─── */

interface NumberInputProps {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  error?:      string;
}

function NumberInput({ label, value, onChange, placeholder, error }: NumberInputProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        max="50"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/30
          focus:outline-none focus:ring-2 transition-all
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          ${error
            ? 'border-rose-500/50 focus:ring-rose-500/30'
            : 'border-white/10 focus:ring-purple-500/30 focus:border-purple-400/50'
          }`}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

/* ─── Validation ─── */

function validate(selected: number[], details: Record<number, SportDetail>): string | null {
  if (selected.length === 0) return 'Select at least one sport to continue.';
  for (const id of selected) {
    const d = details[id];
    if (!d?.skill_level_id)  return 'Please fill in the skill level for every selected sport.';
    if (!d?.frequency_id)    return 'Please fill in the training frequency for every selected sport.';
    const yrs = Number(d.years_experience);
    if (d.years_experience === '' || isNaN(yrs) || yrs < 0 || yrs > 50)
      return 'Please enter valid years of experience (0–50) for every selected sport.';
  }
  return null;
}

/* ─── Page ─── */

export function OnboardingSports() {
  const navigate = useNavigate();

  /* Lookup data */
  const [sports,      setSports]      = useState<Sport[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  /* Selection state */
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [sportDetails,   setSportDetails]   = useState<Record<number, SportDetail>>({});

  /* Submission */
  const [touched,    setTouched]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);

  /* Fetch all lookup data in parallel */
  useEffect(() => {
    Promise.all([
      api.get<Sport[]>('/api/sports'),
      api.get<SkillLevel[]>('/api/skill-levels'),
      api.get<Frequency[]>('/api/frequencies'),
    ])
      .then(([s, sk, f]) => {
        setSports(s.data);
        setSkillLevels(sk.data);
        setFrequencies(f.data);
      })
      .catch(() => setFetchError('Failed to load sports data. Please refresh the page.'))
      .finally(() => setLoadingData(false));
  }, []);

  /* Toggle a sport pill */
  function toggleSport(sportId: number) {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        setSportDetails(d => { const n = { ...d }; delete n[sportId]; return n; });
        return prev.filter(id => id !== sportId);
      }
      setSportDetails(d => ({
        ...d,
        [sportId]: { skill_level_id: '', years_experience: '', frequency_id: '' },
      }));
      return [...prev, sportId];
    });
  }

  /* Update a single field in a sport's detail panel */
  function updateDetail(sportId: number, field: keyof SportDetail, value: string) {
    setSportDetails(prev => ({
      ...prev,
      [sportId]: { ...prev[sportId], [field]: value },
    }));
  }

  const validationError = validate(selectedSports, sportDetails);
  const isValid = validationError === null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSubmitting(true);
    setApiError(null);

    const payload = selectedSports.map(sportId => ({
      sport_id:         sportId,
      skill_level_id:   Number(sportDetails[sportId].skill_level_id),
      years_experience: Number(sportDetails[sportId].years_experience),
      frequency_id:     Number(sportDetails[sportId].frequency_id),
    }));

    try {
      await api.post('/api/onboarding/sports', payload);
      navigate('/onboarding/photos');
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

        <StepIndicator current={2} total={5} />

        <FormCard>
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Your athletic profile
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Select the sports you train in.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

            {/* Loading skeleton */}
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

            {/* Sport pill grid — grouped by theme */}
            {!loadingData && !fetchError && (
              <div className="flex flex-col gap-5">
                {SPORT_GROUPS.map(group => {
                  const groupSports = sports.filter(s => group.sports.includes(s.name));
                  if (groupSports.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2.5">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {groupSports.map(sport => {
                          const selected = selectedSports.includes(sport.id);
                          return (
                            <motion.button
                              key={sport.id}
                              type="button"
                              onClick={() => toggleSport(sport.id)}
                              whileTap={{ scale: 0.94 }}
                              animate={selected ? { scale: 1.03 } : { scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              className={`relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors
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
                                <span className="absolute top-1.5 right-1.5">
                                  <Check className="w-3 h-3 text-purple-300" />
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detail panels — one per selected sport, in selection order */}
            <AnimatePresence initial={false}>
              {selectedSports.map(sportId => {
                const sport  = sports.find(s => s.id === sportId);
                const detail = sportDetails[sportId];
                if (!sport || !detail) return null;

                return (
                  <motion.div
                    key={sportId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                      {/* Panel header */}
                      <div className="flex items-center gap-2">
                        <span className="text-purple-300">{sportIcon(sport.name)}</span>
                        <span className="text-sm font-bold text-purple-200">{sport.name}</span>
                      </div>

                      {/* Detail fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <SelectField
                          label="Skill level"
                          value={detail.skill_level_id}
                          onChange={v => updateDetail(sportId, 'skill_level_id', v)}
                          options={skillLevels}
                          placeholder="Select"
                        />
                        <NumberInput
                          label="Years experience"
                          value={detail.years_experience}
                          onChange={v => updateDetail(sportId, 'years_experience', v)}
                          placeholder="e.g. 3"
                        />
                        <SelectField
                          label="Frequency"
                          value={detail.frequency_id}
                          onChange={v => updateDetail(sportId, 'frequency_id', v)}
                          options={frequencies}
                          placeholder="Select"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Validation error — only show after first submit attempt */}
            <AnimatePresence>
              {touched && validationError && (
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

            {/* Continue button */}
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
          You can update your sports profile any time from settings.
        </p>
      </motion.div>
    </div>
  );
}
