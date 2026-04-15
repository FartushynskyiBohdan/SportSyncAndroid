import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import apiClient from '../lib/api';

/* ─── Types ─── */

interface Sport {
  id: number;
  name: string;
}

interface SkillLevel {
  id: number;
  name: string;
}

interface Frequency {
  id: number;
  name: string;
}

interface Gender {
  id: number;
  name: string;
}

interface FilterState {
  interestedInGender: string;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  selectedSports: string[];
  minSkillLevel: string;
  preferredFrequency: string;
  minPhotos: number;
  showOutOfRange: boolean;
}

interface DiscoverySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filters: FilterState) => void;
  initialFilters?: FilterState;
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


/* ─── Range Slider ─── */

function RangeSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <label className="text-lg text-white font-medium">{label}</label>
        <span className="text-lg text-white/70">
          {value[0]}-{value[1]}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <style>{`
        .range-slider-container {
          position: relative;
          display: flex;
          align-items: center;
          height: 40px;
        }
        .range-slider-container input[type='range'] {
          position: absolute;
          width: 100%;
          height: 4px;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .range-slider-container input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: none;
        }
        .range-slider-container input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: none;
        }
        .range-slider-track {
          position: absolute;
          width: 100%;
          height: 4px;
          background: rgb(255, 255, 255, 0.2);
          border-radius: 2px;
          pointer-events: none;
        }
        .range-slider-fill {
          position: absolute;
          height: 4px;
          background: linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153));
          border-radius: 2px;
          pointer-events: none;
        }
      `}</style>
      <div className="range-slider-container">
        <div className="range-slider-track" />
        <div
          className="range-slider-fill"
          style={{
            left: `calc(${((value[0] - min) / (max - min)) * 100}% + 0px)`,
            right: `calc(${100 - ((value[1] - min) / (max - min)) * 100}% + 0px)`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const newMin = Math.min(Number(e.target.value), value[1]);
            onChange([newMin, value[1]]);
          }}
          style={{
            zIndex: value[0] > max - (max - min) / 2 ? 5 : 3,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const newMax = Math.max(Number(e.target.value), value[0]);
            onChange([value[0], newMax]);
          }}
          style={{
            zIndex: value[1] > max - (max - min) / 2 ? 3 : 5,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/50">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/* ─── Single Slider ─── */

function SingleSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <label className="text-lg text-white font-medium">{label}</label>
        <span className="text-lg text-white/70">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
        style={{
          background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${
            ((value - min) / (max - min)) * 100
          }%, rgb(255, 255, 255, 0.2) ${((value - min) / (max - min)) * 100}%, rgb(255, 255, 255, 0.2) 100%)`,
        }}
      />
    </div>
  );
}

/* ─── Sport groups (same order as onboarding) ─── */

const SPORT_GROUPS: { label: string; sports: string[] }[] = [
  { label: 'Team Sports',         sports: ['Football', 'Basketball', 'Rugby', 'Volleyball', 'Hockey'] },
  { label: 'Combat & Strength',   sports: ['Boxing', 'MMA', 'CrossFit'] },
  { label: 'Water Sports',        sports: ['Swimming', 'Surfing', 'Rowing'] },
  { label: 'Outdoor & Endurance', sports: ['Running', 'Trail Running', 'Cycling', 'Triathlon', 'Skiing'] },
  { label: 'Individual Sports',   sports: ['Tennis', 'Golf', 'Gymnastics', 'Yoga', 'Rock Climbing', 'Hiking'] },
];

/* ─── Sport Selector ─── */

function SportSelector({
  sports,
  selectedSports,
  onToggle,
  onToggleMany,
}: {
  sports: Sport[];
  selectedSports: string[];
  onToggle: (sportId: string) => void;
  onToggleMany: (sportIds: string[], selectAll: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedSportSet = new Set(selectedSports);
  const selectedCount = selectedSports.length;

  return (
    <div className="space-y-3">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <span className="text-lg text-white font-medium">Interested In Sports</span>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-xs font-semibold bg-purple-500/40 border border-purple-400/60 text-purple-200 px-2 py-0.5 rounded-full">
              {selectedCount} selected
            </span>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/40 group-hover:text-white/70 transition-colors"
          >
            ▾
          </motion.span>
        </div>
      </button>

      {/* Collapsible content */}
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="space-y-4">
          {SPORT_GROUPS.map((group) => {
            const groupSports = sports.filter(s => group.sports.includes(s.name));
            if (groupSports.length === 0) return null;
            const groupSportIds = groupSports.map(s => String(s.id));
            const allSelected = groupSportIds.every(id => selectedSportSet.has(id));
            return (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                    {group.label}
                  </p>
                  <button
                    onClick={() => onToggleMany(groupSportIds, !allSelected)}
                    className="text-xs font-semibold uppercase tracking-widest text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {groupSports.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => onToggle(String(sport.id))}
                      className={`p-3 rounded-xl transition-all text-left flex items-center gap-2 ${
                        selectedSportSet.has(String(sport.id))
                          ? 'bg-purple-500/40 border border-purple-400'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{SPORT_ICONS[sport.name] || '🏅'}</span>
                      <span className="text-sm text-white/90">{sport.name}</span>
                      {selectedSportSet.has(String(sport.id)) && (
                        <span className="ml-auto text-purple-300">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function DiscoverySettings({
  isOpen,
  onClose,
  onSave,
  initialFilters,
}: DiscoverySettingsProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      interestedInGender: '2',
      minAge: 20,
      maxAge: 35,
      maxDistance: 25,
      selectedSports: [],
      minSkillLevel: '1',
      preferredFrequency: '2',
      minPhotos: 1,
      showOutOfRange: false,
    }
  );

  const [genders, setGenders] = useState<Gender[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mock data for fallback
  const MOCK_GENDERS: Gender[] = [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' },
    { id: 3, name: 'Non-binary' },
    { id: 4, name: 'Prefer not to say' },
  ];

  const MOCK_SPORTS: Sport[] = [
    { id: 1, name: 'Running' },
    { id: 2, name: 'CrossFit' },
    { id: 3, name: 'Cycling' },
    { id: 4, name: 'Football' },
    { id: 5, name: 'Tennis' },
    { id: 6, name: 'Rugby' },
    { id: 7, name: 'Volleyball' },
    { id: 8, name: 'Hockey' },
    { id: 9, name: 'Golf' },
    { id: 10, name: 'Rock Climbing' },
    { id: 11, name: 'Yoga' },
    { id: 12, name: 'Gymnastics' },
    { id: 13, name: 'Surfing' },
    { id: 14, name: 'Skiing' },
    { id: 15, name: 'Rowing' },
    { id: 16, name: 'Boxing' },
    { id: 17, name: 'Trail Running' },
    { id: 18, name: 'Triathlon' },
    { id: 19, name: 'MMA' },
    { id: 20, name: 'Swimming' },
    { id: 21, name: 'Basketball' },
  ];

  const MOCK_SKILL_LEVELS: SkillLevel[] = [
    { id: 1, name: 'Beginner' },
    { id: 2, name: 'Intermediate' },
    { id: 3, name: 'Advanced' },
    { id: 4, name: 'Professional' },
  ];

  const MOCK_FREQUENCIES: Frequency[] = [
    { id: 1, name: 'Rarely' },
    { id: 2, name: '1–2x per week' },
    { id: 3, name: '3–4x per week' },
    { id: 4, name: '5+ per week' },
    { id: 5, name: 'Daily' },
  ];

  // Fetch filter options and saved preferences
  useEffect(() => {
    if (!isOpen) return;

    setSaveError(null);

    const fetchData = async () => {
      setLoading(true);

      const [gendersResult, sportsResult, skillResult, freqResult, prefsResult] =
        await Promise.allSettled([
          apiClient.get('/api/genders'),
          apiClient.get('/api/sports'),
          apiClient.get('/api/skill-levels'),
          apiClient.get('/api/frequencies'),
          apiClient.get('/api/preferences'),
        ]);

      // Lookup data — fall back to mock per-endpoint on failure
      setGenders(gendersResult.status === 'fulfilled' ? gendersResult.value.data : MOCK_GENDERS);
      setSports(sportsResult.status === 'fulfilled' ? sportsResult.value.data : MOCK_SPORTS);
      setSkillLevels(skillResult.status === 'fulfilled' ? skillResult.value.data : MOCK_SKILL_LEVELS);
      setFrequencies(freqResult.status === 'fulfilled' ? freqResult.value.data : MOCK_FREQUENCIES);

      // Saved preferences — populate filters if found, otherwise keep defaults
      if (prefsResult.status === 'fulfilled' && prefsResult.value?.data) {
        const p = prefsResult.value.data;
        setFilters({
          interestedInGender: String(p.gender_id),
          minAge:             p.min_age,
          maxAge:             p.max_age,
          maxDistance:        p.max_distance_km ?? 25,
          selectedSports:     (p.sport_ids as number[]).map(String),
          minSkillLevel:      p.min_skill_level_id != null ? String(p.min_skill_level_id) : '1',
          preferredFrequency: p.preferred_frequency_id != null ? String(p.preferred_frequency_id) : '2',
          minPhotos:          p.min_photos ?? 1,
          showOutOfRange:     !!p.show_out_of_range,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      await apiClient.put('/api/preferences', {
        gender_id:              Number(filters.interestedInGender),
        min_age:                filters.minAge,
        max_age:                filters.maxAge,
        max_distance_km:        filters.maxDistance,
        min_skill_level_id:     filters.minSkillLevel     ? Number(filters.minSkillLevel)     : null,
        preferred_frequency_id: filters.preferredFrequency ? Number(filters.preferredFrequency) : null,
        min_photos:             filters.minPhotos,
        show_out_of_range:      filters.showOutOfRange,
        sport_ids:              filters.selectedSports.map(Number),
      });

      onSave(filters);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to save settings. Please try again.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        select option {
          background-color: #1e293b;
          color: white;
          padding: 8px;
        }
        select option:hover {
          background-color: #475569;
        }
        select option:checked {
          background: linear-gradient(#7c3aed, #7c3aed);
          background-color: #7c3aed;
        }
      `}</style>
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900 border-r border-white/10 shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white">Discovery Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close settings"
          >
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Interested In Gender */}
              <div className="space-y-3">
                <label className="text-lg text-white font-medium">Interested In</label>
                <select
                  value={filters.interestedInGender}
                  onChange={(e) =>
                    setFilters({ ...filters, interestedInGender: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors"
                >
                  {genders.map((gender) => (
                    <option key={gender.id} value={gender.id}>
                      {gender.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Range */}
              <RangeSlider
                label="Age Range"
                min={18}
                max={75}
                step={1}
                value={[filters.minAge, filters.maxAge]}
                onChange={([min, max]) =>
                  setFilters({ ...filters, minAge: min, maxAge: max })
                }
              />

              {/* Show Out of Range — temporarily disabled */}
              {/* <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className="text-sm text-white/70">
                  Show people slightly outside my age range if I run out of profiles
                </label>
                <Toggle
                  enabled={filters.showOutOfRange}
                  onChange={(value) => setFilters({ ...filters, showOutOfRange: value })}
                />
              </div> */}

              {/* Distance Radius */}
              <SingleSlider
                label="Distance Radius"
                min={1}
                max={100}
                step={1}
                value={filters.maxDistance}
                onChange={(value) => setFilters({ ...filters, maxDistance: value })}
                unit="km"
              />

              {/* Sports */}
              {sports.length > 0 && (
                <SportSelector
                  sports={sports}
                  selectedSports={filters.selectedSports}
                  onToggle={(sportId) => {
                    setFilters({
                      ...filters,
                      selectedSports: filters.selectedSports.includes(sportId)
                        ? filters.selectedSports.filter((id) => id !== sportId)
                        : [...filters.selectedSports, sportId],
                    });
                  }}
                  onToggleMany={(sportIds, selectAll) => {
                    setFilters({
                      ...filters,
                      selectedSports: selectAll
                        ? Array.from(new Set([...filters.selectedSports, ...sportIds]))
                        : filters.selectedSports.filter((id) => !sportIds.includes(id)),
                    });
                  }}
                />
              )}

              {/* Minimum Skill Level */}
              <div className="space-y-3">
                <label className="text-lg text-white font-medium">Minimum Skill Level</label>
                <select
                  value={filters.minSkillLevel}
                  onChange={(e) =>
                    setFilters({ ...filters, minSkillLevel: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors"
                >
                  {skillLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Training Frequency */}
              <div className="space-y-3">
                <label className="text-lg text-white font-medium">Training Frequency (Min)</label>
                <select
                  value={filters.preferredFrequency}
                  onChange={(e) =>
                    setFilters({ ...filters, preferredFrequency: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors"
                >
                  {frequencies.map((freq) => (
                    <option key={freq.id} value={freq.id}>
                      {freq.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Photos */}
              <SingleSlider
                label="Minimum Number of Photos"
                min={1}
                max={5}
                step={1}
                value={filters.minPhotos}
                onChange={(value) => setFilters({ ...filters, minPhotos: value })}
              />
            </>
          )}
        </div>

        {/* Footer - Save Button */}
        <div className="sticky bottom-0 p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm space-y-3">
          {saveError && (
            <p className="text-sm text-red-400 text-center">{saveError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}
