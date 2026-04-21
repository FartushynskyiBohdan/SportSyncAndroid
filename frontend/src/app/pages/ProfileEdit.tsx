import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronDown,
  Loader2, AlertCircle, Check, RefreshCw,
  X, ImagePlus, Pencil,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import apiClient, { isAxiosError } from '../lib/api';

/* ─── Types ─── */

interface Sport       { id: number; name: string; }
interface SkillLevel  { id: number; name: string; }
interface Frequency   { id: number; name: string; }
interface Goal        { id: number; name: string; }

interface PhotoItem {
  clientId:   string;
  photo_id?:  number;
  photo_url?: string;
  preview:    string;
  status:     'existing' | 'uploading' | 'done' | 'error';
  progress:   number;
}

interface SportDetail {
  skill_level_id:   string;
  years_experience: string;
  frequency_id:     string;
}

interface EditData {
  bio:     string | null;
  goal_id: number | null;
  photos:  { photo_id: number; photo_url: string; display_order: number }[];
  sports:  { sport_id: number; skill_level_id: number; frequency_id: number; years_experience: number | null }[];
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/* ─── Constants ─── */

const MAX_PHOTOS = 6;

const SPORT_ICONS: Record<string, string> = {
  Football: '⚽', Basketball: '🏀', Rugby: '🏉', Volleyball: '🏐', Hockey: '🏒',
  Boxing: '🥊', MMA: '🥋', CrossFit: '🏋️',
  Swimming: '🏊', Surfing: '🏄', Rowing: '🚣',
  Running: '🏃', 'Trail Running': '🥾', Cycling: '🚴', Triathlon: '🏅', Skiing: '⛷️',
  Tennis: '🎾', Golf: '⛳', Gymnastics: '🤸', Yoga: '🧘', 'Rock Climbing': '🧗', Hiking: '🥾',
};

function sportIcon(name: string) { return SPORT_ICONS[name] ?? '🏅'; }

const SPORT_GROUPS: { label: string; sports: string[] }[] = [
  { label: 'Team Sports',         sports: ['Football', 'Basketball', 'Rugby', 'Volleyball', 'Hockey'] },
  { label: 'Combat & Strength',   sports: ['Boxing', 'MMA', 'CrossFit'] },
  { label: 'Water Sports',        sports: ['Swimming', 'Surfing', 'Rowing'] },
  { label: 'Outdoor & Endurance', sports: ['Running', 'Trail Running', 'Cycling', 'Triathlon', 'Skiing'] },
  { label: 'Individual Sports',   sports: ['Tennis', 'Golf', 'Gymnastics', 'Yoga', 'Rock Climbing', 'Hiking'] },
];

/* ─── Page-level full-screen states ─── */

function PageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans">
      <Navbar />
      {children}
    </div>
  );
}

function FullPageLoader() {
  return (
    <PageBackground>
      <div className="flex flex-col items-center justify-center pt-40 gap-4">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        <p className="text-white/50 text-sm">Loading your profile…</p>
      </div>
    </PageBackground>
  );
}

function FullPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <PageBackground>
      <div className="flex flex-col items-center justify-center pt-40 gap-4 text-center px-4">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
          <X className="w-8 h-8 text-rose-400 opacity-70" />
        </div>
        <h3 className="text-xl font-bold">Something went wrong</h3>
        <p className="text-white/60 text-sm max-w-sm">We couldn't load your profile data. Please try again.</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </PageBackground>
  );
}

/* ─── Shared sub-components ─── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-5">{children}</h2>
  );
}

interface SelectOption { id: number | string; name: string; }

function SelectField({
  label, value, onChange, options, error, placeholder = 'Select…', loading,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: SelectOption[]; error?: string; placeholder?: string; loading?: boolean;
}) {
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

function NumberInput({
  label, value, onChange, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string;
}) {
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

function SaveButton({
  status, onClick, disabled,
}: {
  status: SaveStatus; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === 'saving'}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${status === 'saved'
          ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 cursor-default'
          : status === 'error'
          ? 'bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 cursor-pointer'
          : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white shadow-lg shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
        }`}
    >
      {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === 'saved'  && <Check className="w-4 h-4" />}
      {status === 'saving'
        ? 'Saving…'
        : status === 'saved'
        ? 'Saved!'
        : status === 'error'
        ? 'Failed — try again'
        : 'Save changes'}
    </button>
  );
}

/* ─── Photo Editor Section ─── */

function PhotoEditorSection({
  initialPhotos,
}: {
  initialPhotos: EditData['photos'];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    initialPhotos.map(p => ({
      clientId:  `existing-${p.photo_id}`,
      photo_id:  p.photo_id,
      photo_url: p.photo_url,
      preview:   p.photo_url,
      status:    'existing' as const,
      progress:  100,
    }))
  );
  const [dragIndex,      setDragIndex]      = useState<number | null>(null);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [deletingId,     setDeletingId]     = useState<string | null>(null);

  // Revoke object URLs on unmount (only for locally created previews).
  useEffect(() => {
    return () => {
      photos.forEach(p => {
        if (p.status === 'uploading' || p.status === 'done' || p.status === 'error') {
          if (p.preview && !p.preview.startsWith('/') && !p.preview.startsWith('http')) {
            URL.revokeObjectURL(p.preview);
          }
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save order whenever the photos array changes (debounced, only done/existing items).
  useEffect(() => {
    const saveable = photos.filter(p =>
      (p.status === 'done' || p.status === 'existing') && p.photo_id != null
    );
    if (saveable.length === 0) return;

    const t = setTimeout(() => {
      apiClient
        .put('/api/onboarding/photos/order', saveable.map((p, i) => ({ photo_id: p.photo_id!, display_order: i })))
        .catch(() => {});
    }, 600);

    return () => clearTimeout(t);
  }, [photos]);

  /* ─── Upload helper ─── */
  async function uploadPhoto(clientId: string, file: File, order: number) {
    const fd = new FormData();
    fd.append('photos', file);
    fd.append('display_order', String(order));

    try {
      const res = await apiClient.post<{ photo_id: number; photo_url: string; display_order: number }[]>(
        '/api/onboarding/photos', fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setPhotos(prev => prev.map(p => p.clientId === clientId ? { ...p, progress: pct } : p));
          },
        }
      );
      const u = res.data[0];
      setPhotos(prev => prev.map(p =>
        p.clientId === clientId
          ? { ...p, photo_id: u.photo_id, photo_url: u.photo_url, status: 'done', progress: 100 }
          : p
      ));
    } catch {
      setPhotos(prev => prev.map(p =>
        p.clientId === clientId ? { ...p, status: 'error', progress: 0 } : p
      ));
    }
  }

  /* ─── Add photos ─── */
  function addFiles(raw: FileList | File[]) {
    const files = Array.from(raw).filter(f => f.type.startsWith('image/'));
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0 || files.length === 0) return;

    const toAdd  = files.slice(0, slots);
    const offset = photos.length;
    const items: PhotoItem[] = toAdd.map((file, i) => ({
      clientId: `new-${Date.now()}-${i}`,
      preview:  URL.createObjectURL(file),
      status:   'uploading' as const,
      progress: 0,
    }));

    setPhotos(prev => [...prev, ...items]);
    toAdd.forEach((file, i) => uploadPhoto(items[i].clientId, file, offset + i));
  }

  /* ─── Delete photo ─── */
  async function deletePhoto(photo: PhotoItem) {
    if (deletingId) return;

    if (!photo.photo_id) {
      // Never persisted — just remove from local state.
      setPhotos(prev => prev.filter(p => p.clientId !== photo.clientId));
      if ((photo.status === 'uploading' || photo.status === 'done' || photo.status === 'error')
          && !photo.preview.startsWith('/') && !photo.preview.startsWith('http')) {
        URL.revokeObjectURL(photo.preview);
      }
      return;
    }

    setDeletingId(photo.clientId);
    try {
      await apiClient.delete(`/api/onboarding/photos/${photo.photo_id}`);
      setPhotos(prev => prev.filter(p => p.clientId !== photo.clientId));
    } catch {
      // Deletion failed — leave photo in state, user can retry.
    } finally {
      setDeletingId(null);
    }
  }

  /* ─── Dropzone ─── */
  function onDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setDropzoneActive(true);
    }
  }
  function onDragLeave() { setDropzoneActive(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropzoneActive(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  /* ─── Reorder ─── */
  function onCardDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('canvas');
    e.dataTransfer.setDragImage(ghost, 0, 0);
  }
  function onCardDragOver(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) return;
    setPhotos(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(targetIndex);
  }
  function onCardDragEnd() { setDragIndex(null); }

  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <Card>
      <SectionTitle>Photos</SectionTitle>

      <p className="text-xs text-white/40 mb-5">
        {photos.length}/{MAX_PHOTOS} photos · The first photo is your profile photo · Drag to reorder
      </p>

      {/* Unified photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <AnimatePresence>
            {photos.map((photo, index) => {
              const isDeleting = deletingId === photo.clientId;
              const isDragging = dragIndex === index;
              const isProfilePhoto = index === 0;

              return (
                <motion.div
                  key={photo.clientId}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: isDragging ? 0.45 : 1, scale: isDragging ? 0.93 : 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  draggable={photo.status === 'done' || photo.status === 'existing'}
                  onDragStartCapture={e => onCardDragStart(e as unknown as React.DragEvent, index)}
                  onDragOver={e => onCardDragOver(e, index)}
                  onDragEnd={onCardDragEnd}
                  className={`relative aspect-square rounded-2xl overflow-hidden border
                    ${photo.status === 'error' ? 'border-rose-500/50' : 'border-white/10'}
                    ${photo.status === 'done' || photo.status === 'existing' ? 'cursor-grab active:cursor-grabbing' : ''}
                  `}
                >
                  <img
                    src={photo.preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Profile photo badge */}
                  {isProfilePhoto && (photo.status === 'done' || photo.status === 'existing') && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-purple-600/90 backdrop-blur-sm rounded-full px-2.5 py-0.5 whitespace-nowrap">
                      <span className="text-[9px] font-bold tracking-wide text-white">PROFILE</span>
                    </div>
                  )}

                  {/* Uploading overlay */}
                  {photo.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
                      <div className="w-3/4 h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-400 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${photo.progress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error overlay */}
                  {photo.status === 'error' && (
                    <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                      <span className="text-[11px] text-rose-300 font-semibold">Failed</span>
                    </div>
                  )}

                  {/* Delete / deleting overlay */}
                  {isDeleting ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white/70" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => deletePhoto(photo)}
                      disabled={photo.status === 'uploading' || !!deletingId}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85
                        backdrop-blur-sm flex items-center justify-center transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Delete photo"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Dropzone — visible when more slots are available */}
      {canAdd && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-6 cursor-pointer transition-all duration-200
            ${dropzoneActive
              ? 'border-purple-400 bg-purple-500/15'
              : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
            ${dropzoneActive ? 'bg-purple-500/30' : 'bg-white/10'}`}>
            <ImagePlus className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-sm font-medium text-white/60">
            {dropzoneActive ? 'Drop to add' : 'Drop photos or click to browse'}
          </p>
          <p className="text-xs text-white/30">
            {MAX_PHOTOS - photos.length} slot{MAX_PHOTOS - photos.length !== 1 ? 's' : ''} remaining · max 10 MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>
      )}

      {photos.length === 0 && !canAdd && (
        <p className="text-sm text-white/40 text-center py-4">No photos yet.</p>
      )}
    </Card>
  );
}

/* ─── Bio Section ─── */

function BioSection({ initialBio }: { initialBio: string | null }) {
  const [bio,    setBio]    = useState(initialBio ?? '');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error,  setError]  = useState<string | null>(null);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [bio]);

  // Auto-reset 'saved' status.
  useEffect(() => {
    if (status !== 'saved') return;
    const t = setTimeout(() => setStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const charCount = bio.trim().length;
  const isValid   = charCount >= 20 && charCount <= 250;
  const isDirty   = bio !== (initialBio ?? '');

  async function save() {
    if (!isValid) return;
    setStatus('saving');
    setError(null);
    try {
      await apiClient.post('/api/onboarding/bio', { bio: bio.trim() });
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'Failed to save bio.');
      } else {
        setError('Failed to save bio.');
      }
    }
  }

  return (
    <Card>
      <SectionTitle>Bio</SectionTitle>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={4}
          maxLength={250}
          placeholder="Tell other athletes about yourself…"
          className={`w-full resize-none bg-white/5 border rounded-2xl px-4 py-3 text-sm text-white
            placeholder-white/30 focus:outline-none focus:ring-2 transition-all leading-relaxed
            ${charCount > 0 && !isValid && charCount > 250
              ? 'border-rose-500/50 focus:ring-rose-500/30'
              : 'border-white/10 focus:ring-purple-500/30 focus:border-purple-400/50'
            }`}
        />
        <span className={`absolute bottom-3 right-4 text-xs tabular-nums
          ${charCount > 250 ? 'text-rose-400' : charCount >= 20 ? 'text-white/30' : 'text-white/20'}`}>
          {charCount}/250
        </span>
      </div>

      {charCount > 0 && charCount < 20 && (
        <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Must be at least 20 characters ({20 - charCount} more needed)
        </p>
      )}

      {error && status === 'error' && (
        <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      <div className="flex justify-end mt-4">
        <SaveButton status={status} onClick={save} disabled={!isValid || !isDirty} />
      </div>
    </Card>
  );
}

/* ─── Sports Section ─── */

function validateSports(selected: number[], details: Record<number, SportDetail>): string | null {
  if (selected.length === 0) return 'Select at least one sport.';
  for (const id of selected) {
    const d = details[id];
    if (!d?.skill_level_id) return 'Please fill in the skill level for every sport.';
    if (!d?.frequency_id)   return 'Please fill in the training frequency for every sport.';
    const yrs = Number(d.years_experience);
    if (d.years_experience === '' || isNaN(yrs) || yrs < 0 || yrs > 50)
      return 'Please enter valid years of experience (0–50) for every sport.';
  }
  return null;
}

function SportsSection({
  initialSports,
  sports,
  skillLevels,
  frequencies,
}: {
  initialSports: EditData['sports'];
  sports:        Sport[];
  skillLevels:   SkillLevel[];
  frequencies:   Frequency[];
}) {
  const [selectedSports, setSelectedSports] = useState<number[]>(() =>
    initialSports.map(s => s.sport_id)
  );
  const [sportDetails, setSportDetails] = useState<Record<number, SportDetail>>(() =>
    Object.fromEntries(
      initialSports.map(s => [
        s.sport_id,
        {
          skill_level_id:   String(s.skill_level_id),
          years_experience: String(s.years_experience ?? ''),
          frequency_id:     String(s.frequency_id),
        },
      ])
    )
  );
  const [touched,  setTouched]  = useState(false);
  const [status,   setStatus]   = useState<SaveStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  // Auto-reset 'saved'.
  useEffect(() => {
    if (status !== 'saved') return;
    const t = setTimeout(() => setStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [status]);

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

  function updateDetail(sportId: number, field: keyof SportDetail, value: string) {
    setSportDetails(prev => ({
      ...prev,
      [sportId]: { ...prev[sportId], [field]: value },
    }));
  }

  const validationError = validateSports(selectedSports, sportDetails);

  const isDirty = (() => {
    const initIds = initialSports.map(s => s.sport_id).sort((a, b) => a - b);
    const currIds = [...selectedSports].sort((a, b) => a - b);
    if (JSON.stringify(initIds) !== JSON.stringify(currIds)) return true;
    for (const s of initialSports) {
      const d = sportDetails[s.sport_id];
      if (!d) return true;
      if (d.skill_level_id   !== String(s.skill_level_id))        return true;
      if (d.frequency_id     !== String(s.frequency_id))          return true;
      if (d.years_experience !== String(s.years_experience ?? '')) return true;
    }
    return false;
  })();

  async function save() {
    setTouched(true);
    if (validationError) return;
    setStatus('saving');
    setApiError(null);

    const payload = selectedSports.map(sportId => ({
      sport_id:         sportId,
      skill_level_id:   Number(sportDetails[sportId].skill_level_id),
      years_experience: Number(sportDetails[sportId].years_experience),
      frequency_id:     Number(sportDetails[sportId].frequency_id),
    }));

    try {
      await apiClient.post('/api/onboarding/sports', payload);
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      if (isAxiosError(err)) {
        setApiError(err.response?.data?.error ?? 'Failed to save sports.');
      } else {
        setApiError('Failed to save sports.');
      }
    }
  }

  return (
    <Card>
      <SectionTitle>Sports &amp; Training</SectionTitle>

      {/* Sport pill grid grouped by theme */}
      <div className="flex flex-col gap-5 mb-6">
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

      {/* Detail panels */}
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
              className="overflow-hidden mb-3"
            >
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-purple-300">{sportIcon(sport.name)}</span>
                  <span className="text-sm font-bold text-purple-200">{sport.name}</span>
                </div>
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

      {/* Validation + API errors */}
      <AnimatePresence>
        {touched && validationError && (
          <motion.div
            key="val-error"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300 mb-4"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {validationError}
          </motion.div>
        )}
        {apiError && status === 'error' && (
          <motion.div
            key="api-error"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300 mb-4"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {apiError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <SaveButton status={status} onClick={save} disabled={!isDirty || (touched && !!validationError)} />
      </div>
    </Card>
  );
}

/* ─── Goal Section ─── */

function GoalSection({
  initialGoalId,
  goals,
}: {
  initialGoalId: number | null;
  goals:         Goal[];
}) {
  const initialGoalStr = initialGoalId ? String(initialGoalId) : '';
  const [goalId, setGoalId] = useState(initialGoalStr);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error,  setError]  = useState<string | null>(null);
  const isDirty = goalId !== initialGoalStr;

  // Auto-reset 'saved'.
  useEffect(() => {
    if (status !== 'saved') return;
    const t = setTimeout(() => setStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [status]);

  async function save() {
    if (!goalId) return;
    setStatus('saving');
    setError(null);
    try {
      await apiClient.patch('/api/profile/goal', { goal_id: Number(goalId) });
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'Failed to save goal.');
      } else {
        setError('Failed to save goal.');
      }
    }
  }

  return (
    <Card>
      <SectionTitle>Relationship Goal</SectionTitle>

      <SelectField
        label="What are you looking for?"
        value={goalId}
        onChange={setGoalId}
        options={goals}
        placeholder="Select a goal…"
      />

      {error && status === 'error' && (
        <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      <div className="flex justify-end mt-4">
        <SaveButton status={status} onClick={save} disabled={!goalId || !isDirty} />
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */

export function ProfileEdit() {
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [editData,  setEditData]  = useState<EditData | null>(null);
  const [sports,    setSports]    = useState<Sport[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [goals,       setGoals]       = useState<Goal[]>([]);

  const load = useCallback(() => {
    setLoadState('loading');
    Promise.all([
      apiClient.get<Sport[]>('/api/sports'),
      apiClient.get<SkillLevel[]>('/api/skill-levels'),
      apiClient.get<Frequency[]>('/api/frequencies'),
      apiClient.get<Goal[]>('/api/goals'),
      apiClient.get<EditData>('/api/profile/edit-data'),
    ])
      .then(([s, sl, f, g, ed]) => {
        setSports(s.data);
        setSkillLevels(sl.data);
        setFrequencies(f.data);
        setGoals(g.data);
        setEditData(ed.data);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loadState === 'loading') return <FullPageLoader />;
  if (loadState === 'error' || !editData) return <FullPageError onRetry={load} />;

  return (
    <PageBackground>
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-28 pb-24">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Profile
          </button>

          <div className="flex items-center gap-2 text-white/70">
            <Pencil className="w-4 h-4 text-purple-300" />
            <h1 className="text-sm font-semibold">Edit Profile</h1>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          <PhotoEditorSection
            initialPhotos={editData.photos}
          />

          <BioSection
            initialBio={editData.bio}
          />

          <SportsSection
            initialSports={editData.sports}
            sports={sports}
            skillLevels={skillLevels}
            frequencies={frequencies}
          />

          <GoalSection
            initialGoalId={editData.goal_id}
            goals={goals}
          />
        </div>
      </div>
    </PageBackground>
  );
}
