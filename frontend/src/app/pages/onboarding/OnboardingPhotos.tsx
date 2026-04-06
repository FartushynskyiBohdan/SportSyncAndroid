import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import api from '@/app/lib/api';
import { X, AlertCircle, Loader2, ImagePlus, Camera, User } from 'lucide-react';

/* ─── Types ─── */

interface PhotoItem {
  clientId:   string;
  photo_id?:  number;
  photo_url?: string;
  preview:    string;
  status:     'uploading' | 'done' | 'error';
  progress:   number;
}

/* ─── Constants ─── */

const MAX_EXTRAS = 5;

/* ─── Shared sub-components ─── */

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

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/40">
      {children}
    </div>
  );
}

/* ─── Page ─── */

export function OnboardingPhotos() {
  const navigate       = useNavigate();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const extrasInputRef  = useRef<HTMLInputElement>(null);

  /* Profile photo (phase 1) */
  const [profilePhoto, setProfilePhoto] = useState<PhotoItem | null>(null);

  /* Extra photos (phase 2) */
  const [extras,        setExtras]        = useState<PhotoItem[]>([]);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [dragIndex,      setDragIndex]      = useState<number | null>(null);

  /* General */
  const [touched, setTouched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Revoke object URLs on unmount */
  useEffect(() => {
    return () => {
      if (profilePhoto) URL.revokeObjectURL(profilePhoto.preview);
      extras.forEach(p => URL.revokeObjectURL(p.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auto-save display order for extras (debounced) */
  useEffect(() => {
    const allDone = [
      ...(profilePhoto?.status === 'done' && profilePhoto.photo_id ? [profilePhoto] : []),
      ...extras.filter(p => p.status === 'done' && p.photo_id),
    ];
    if (allDone.length === 0) return;

    const t = setTimeout(() => {
      api.put('/api/onboarding/photos/order',
        allDone.map((p, i) => ({ photo_id: p.photo_id!, display_order: i }))
      ).catch(() => {});
    }, 600);

    return () => clearTimeout(t);
  }, [profilePhoto, extras]);

  /* ─── Upload helper ─── */
  async function uploadOne(
    clientId: string,
    file: File,
    order: number,
    setItem: (updater: (prev: PhotoItem) => PhotoItem) => void,
  ) {
    const fd = new FormData();
    fd.append('photos', file);
    fd.append('display_order', String(order));

    try {
      const res = await api.post<{ photo_id: number; photo_url: string; display_order: number }[]>(
        '/api/onboarding/photos', fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setItem(prev => ({ ...prev, progress: pct }));
          },
        }
      );
      const u = res.data[0];
      setItem(prev => ({ ...prev, photo_id: u.photo_id, photo_url: u.photo_url, status: 'done', progress: 100 }));
    } catch {
      setItem(prev => ({ ...prev, status: 'error', progress: 0 }));
    }
  }

  /* ─── Phase 1: Profile photo ─── */
  function handleProfileFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = Array.from(files).find(f => f.type.startsWith('image/'));
    if (!file) return;

    const item: PhotoItem = {
      clientId: `profile-${Date.now()}`,
      preview:  URL.createObjectURL(file),
      status:   'uploading',
      progress: 0,
    };
    setProfilePhoto(item);

    uploadOne(item.clientId, file, 0, updater => {
      setProfilePhoto(prev => prev ? updater(prev) : prev);
    });
  }

  function removeProfilePhoto() {
    if (profilePhoto) {
      URL.revokeObjectURL(profilePhoto.preview);
      setProfilePhoto(null);
      // Also clear extras since they depend on having a profile photo
      extras.forEach(p => URL.revokeObjectURL(p.preview));
      setExtras([]);
    }
  }

  /* ─── Phase 2: Extra photos ─── */
  function addExtraFiles(raw: FileList | File[]) {
    const files  = Array.from(raw).filter(f => f.type.startsWith('image/'));
    const offset = extras.length;
    const slots  = MAX_EXTRAS - offset;
    if (slots <= 0 || files.length === 0) return;

    const toAdd = files.slice(0, slots);
    const items: PhotoItem[] = toAdd.map((file, i) => ({
      clientId: `extra-${Date.now()}-${i}`,
      preview:  URL.createObjectURL(file),
      status:   'uploading',
      progress: 0,
    }));

    setExtras(prev => [...prev, ...items]);
    toAdd.forEach((file, i) => {
      const order = offset + i + 1; // +1 because 0 is profile photo
      uploadOne(items[i].clientId, file, order, updater => {
        setExtras(prev => prev.map(p => p.clientId === items[i].clientId ? updater(p) : p));
      });
    });
  }

  function removeExtra(clientId: string) {
    setExtras(prev => {
      const item = prev.find(p => p.clientId === clientId);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(p => p.clientId !== clientId);
    });
  }

  /* ─── Dropzone (file drag) ─── */
  function onDropzoneDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setDropzoneActive(true);
    }
  }
  function onDropzoneDragLeave() { setDropzoneActive(false); }
  function onDropzoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropzoneActive(false);
    if (e.dataTransfer.files.length) addExtraFiles(e.dataTransfer.files);
  }

  /* ─── Reorder extras ─── */
  function onCardDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('canvas');
    e.dataTransfer.setDragImage(ghost, 0, 0);
  }

  function onCardDragOver(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) return;
    setExtras(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(targetIndex);
  }

  function onCardDragEnd() { setDragIndex(null); }

  /* ─── Derived state ─── */
  const profileDone = profilePhoto?.status === 'done';
  const anyUploading = profilePhoto?.status === 'uploading' || extras.some(p => p.status === 'uploading');
  const isValid = !!profileDone;

  function handleContinue() {
    setTouched(true);
    if (!isValid || anyUploading) return;
    navigate('/onboarding/bio');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-6">
          <span className="text-2xl font-bold tracking-tight">SportSync</span>
        </div>

        <StepIndicator current={3} total={5} />

        <FormCard>
          {/* ═══════ Phase 1: Profile photo ═══════ */}
          <div className="mb-2">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Add your profile photo
            </h1>
            <p className="text-white/50 text-sm mt-1">
              This is the first thing other athletes will see.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 py-6">
            {!profilePhoto ? (
              /* Empty state — large circular upload area */
              <motion.button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative w-40 h-40 rounded-full border-2 border-dashed border-white/25 hover:border-purple-400/60
                  bg-white/[0.03] hover:bg-purple-500/10 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-10 h-10 text-white/25" />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Camera className="w-3.5 h-3.5" />
                  Upload
                </div>
              </motion.button>
            ) : (
              /* Profile photo preview */
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative"
              >
                <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-lg shadow-purple-500/20">
                  <img
                    src={profilePhoto.preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Uploading overlay */}
                {profilePhoto.status === 'uploading' && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
                    <span className="text-xs text-white/60">{profilePhoto.progress}%</span>
                  </div>
                )}

                {/* Error overlay */}
                {profilePhoto.status === 'error' && (
                  <div className="absolute inset-0 rounded-full bg-rose-950/80 flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-[11px] text-rose-300 font-semibold">Failed</span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={removeProfilePhoto}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90
                    border border-white/15 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Badge */}
                {profilePhoto.status === 'done' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-600/90 backdrop-blur-sm rounded-full px-3 py-0.5">
                    <span className="text-[10px] font-bold tracking-wide text-white whitespace-nowrap">PROFILE PHOTO</span>
                  </div>
                )}
              </motion.div>
            )}

            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleProfileFile(e.target.files)}
            />

            {!profilePhoto && (
              <p className="text-xs text-white/30">JPEG, PNG, WebP · Max 2MB</p>
            )}
          </div>

          {/* ═══════ Phase 2: Additional photos (slides in after profile is done) ═══════ */}
          <AnimatePresence>
            {profileDone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-white/10 pt-6 mt-4">
                  <h2 className="text-lg font-bold tracking-tight mb-1">
                    Add more photos
                  </h2>
                  <p className="text-white/40 text-sm mb-5">
                    Optional — up to 5 additional photos. Drag to reorder.
                  </p>

                  <div className="flex flex-col gap-4">
                    {/* Extras dropzone */}
                    {extras.length < MAX_EXTRAS && (
                      <div
                        onDragOver={onDropzoneDragOver}
                        onDragLeave={onDropzoneDragLeave}
                        onDrop={onDropzoneDrop}
                        onClick={() => extrasInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-8 cursor-pointer transition-all duration-200
                          ${dropzoneActive
                            ? 'border-purple-400 bg-purple-500/15'
                            : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                          ${dropzoneActive ? 'bg-purple-500/30' : 'bg-white/10'}`}>
                          <ImagePlus className="w-5 h-5 text-white/50" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-white/70">
                            {dropzoneActive ? 'Drop to add' : 'Drop photos or click to browse'}
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {MAX_EXTRAS - extras.length} slot{MAX_EXTRAS - extras.length !== 1 ? 's' : ''} remaining
                          </p>
                        </div>
                        <input
                          ref={extrasInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => e.target.files && addExtraFiles(e.target.files)}
                        />
                      </div>
                    )}

                    {/* Extras grid */}
                    {extras.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <AnimatePresence>
                          {extras.map((photo, index) => (
                            <motion.div
                              key={photo.clientId}
                              layout
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{
                                opacity: dragIndex === index ? 0.45 : 1,
                                scale:   dragIndex === index ? 0.93 : 1,
                              }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.18 }}
                              draggable={photo.status === 'done'}
                              onDragStartCapture={e => onCardDragStart(e as unknown as React.DragEvent, index)}
                              onDragOver={e => onCardDragOver(e, index)}
                              onDragEnd={onCardDragEnd}
                              className={`relative aspect-square rounded-2xl overflow-hidden border
                                ${photo.status === 'error' ? 'border-rose-500/50' : 'border-white/10'}
                                ${photo.status === 'done'  ? 'cursor-grab active:cursor-grabbing' : ''}
                              `}
                            >
                              <img
                                src={photo.preview}
                                alt={`Photo ${index + 2}`}
                                className="w-full h-full object-cover select-none pointer-events-none"
                                draggable={false}
                              />

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
                                  <span className="text-[11px] text-white/50">{photo.progress}%</span>
                                </div>
                              )}

                              {/* Error overlay */}
                              {photo.status === 'error' && (
                                <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center gap-1.5">
                                  <AlertCircle className="w-5 h-5 text-rose-400" />
                                  <span className="text-[11px] text-rose-300 font-semibold">Failed</span>
                                </div>
                              )}

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => removeExtra(photo.clientId)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85
                                  backdrop-blur-sm flex items-center justify-center transition-colors"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════ Errors & Continue ═══════ */}
          <div className="flex flex-col gap-4 mt-6">
            <AnimatePresence>
              {touched && !isValid && !anyUploading && (
                <motion.div
                  key="validation"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please upload a profile photo to continue.
                </motion.div>
              )}
              {apiError && (
                <motion.div
                  key="api-error"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleContinue}
              disabled={anyUploading || (touched && !isValid)}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base
                bg-gradient-to-br from-purple-500 to-purple-700
                hover:from-purple-400 hover:to-purple-600
                transition-all hover:scale-[1.02] active:scale-[0.98]
                shadow-xl shadow-purple-600/25
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {anyUploading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
                : 'Continue →'
              }
            </button>
          </div>
        </FormCard>

        <p className="text-center text-xs text-white/30 mt-6">
          Your profile photo is visible to all athletes. Additional photos are shown on your full profile.
        </p>
      </motion.div>
    </div>
  );
}
