import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import apiClient, { isAxiosError } from '../../lib/api';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';

/* ─── Types ─── */

interface Gender {
  id: number;
  name: string;
}

interface Country {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface FormState {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender_id: string;
  country_id: string;
  city_id: string;
}

interface FieldError {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender_id?: string;
  country_id?: string;
  city_id?: string;
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
              i < current
                ? 'bg-purple-400 w-8'
                : i === current - 1
                ? 'bg-purple-400 w-8'
                : 'bg-white/20 w-4'
            }`}
          />
        ))}
      </div>
      {/* <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        Step {current} of {total}
      </p> */}
    </div>
  );
}

/* ─── Input field ─── */

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

function InputField({ label, type = 'text', value, onChange, error, placeholder, min, max }: InputFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/30
          focus:outline-none focus:ring-2 transition-all
          ${error
            ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/70'
            : 'border-white/10 focus:ring-purple-500/30 focus:border-purple-400/50'
          }`}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Select field ─── */

interface SelectOption {
  id: number | string;
  name: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

function SelectField({ label, value, onChange, options, error, placeholder = 'Select…', disabled, loading }: SelectFieldProps) {
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
          disabled={disabled || loading}
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
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
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

/* ─── Validation ─── */

function validate(form: FormState): FieldError {
  const errors: FieldError = {};

  if (!form.first_name.trim()) errors.first_name = 'First name is required.';
  if (!form.last_name.trim())  errors.last_name  = 'Last name is required.';

  if (!form.birth_date) {
    errors.birth_date = 'Date of birth is required.';
  } else {
    const dob = new Date(form.birth_date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear()
      - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (age < 18) errors.birth_date = 'You must be at least 18 years old.';
  }

  if (!form.gender_id)  errors.gender_id  = 'Please select a gender.';
  if (!form.country_id) errors.country_id = 'Please select a country.';
  if (!form.city_id)    errors.city_id    = 'Please select a city.';

  return errors;
}

/* ─── Page ─── */

export function OnboardingProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender_id: '',
    country_id: '',
    city_id: '',
  });

  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState(false);

  const [genders, setGenders]         = useState<Gender[]>([]);
  const [countries, setCountries]     = useState<Country[]>([]);
  const [cities, setCities]           = useState<City[]>([]);

  const [loadingGenders, setLoadingGenders]   = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities]     = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);

  /* Max birth date = 18 years ago */
  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  /* Fetch genders + countries on mount */
  useEffect(() => {
    apiClient.get<Gender[]>('/api/genders')
      .then(r => setGenders(r.data))
      .catch(() => {/* silently ignore; user sees empty dropdown */})
      .finally(() => setLoadingGenders(false));

    apiClient.get<Country[]>('/api/countries')
      .then(r => setCountries(r.data))
      .catch(() => {})
      .finally(() => setLoadingCountries(false));
  }, []);

  /* Fetch cities when country changes */
  useEffect(() => {
    if (!form.country_id) { setCities([]); return; }

    setLoadingCities(true);
    setCities([]);
    setForm(prev => ({ ...prev, city_id: '' }));

    apiClient.get<City[]>(`/api/countries/${form.country_id}/cities`)
      .then(r => setCities(r.data))
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country_id]);

  /* Re-validate when form changes after first submit attempt */
  useEffect(() => {
    if (touched) setErrors(validate(form));
  }, [form, touched]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);

    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await apiClient.post('/api/onboarding/profile', {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        birth_date: form.birth_date,
        gender_id:  Number(form.gender_id),
        city_id:    Number(form.city_id),
      });
      navigate('/onboarding/sports');
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

  const isValid = Object.keys(validate(form)).length === 0;

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

        <StepIndicator current={1} total={5} />

        <FormCard>
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Build your athlete profile
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Let's start with the basics.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="First name"
                value={form.first_name}
                onChange={v => setField('first_name', v)}
                error={errors.first_name}
                placeholder="Emma"
              />
              <InputField
                label="Last name"
                value={form.last_name}
                onChange={v => setField('last_name', v)}
                error={errors.last_name}
                placeholder="Smith"
              />
            </div>

            {/* Date of birth */}
            <InputField
              label="Date of birth"
              type="date"
              value={form.birth_date}
              onChange={v => setField('birth_date', v)}
              error={errors.birth_date}
              max={maxDate}
            />

            {/* Gender */}
            <SelectField
              label="Gender"
              value={form.gender_id}
              onChange={v => setField('gender_id', v)}
              options={genders}
              error={errors.gender_id}
              placeholder="Select gender"
              loading={loadingGenders}
            />

            {/* Country */}
            <SelectField
              label="Country"
              value={form.country_id}
              onChange={v => setField('country_id', v)}
              options={countries}
              error={errors.country_id}
              placeholder="Select country"
              loading={loadingCountries}
            />

            {/* City — only shown once country is selected */}
            {form.country_id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <SelectField
                  label="City"
                  value={form.city_id}
                  onChange={v => setField('city_id', v)}
                  options={cities}
                  error={errors.city_id}
                  placeholder={loadingCities ? 'Loading cities…' : cities.length ? 'Select city' : 'No cities available'}
                  loading={loadingCities}
                  disabled={!cities.length && !loadingCities}
                />
              </motion.div>
            )}

            {/* API error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {apiError}
              </motion.div>
            )}

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

        {/* Fine print */}
        <p className="text-center text-xs text-white/30 mt-6">
          Your information is private and only shared with athletes you match with.
        </p>
      </motion.div>
    </div>
  );
}
