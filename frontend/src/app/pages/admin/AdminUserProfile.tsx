import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, ChevronRight, MapPin,
  Activity, Trophy, Target, Loader2,
  RefreshCw, X, ShieldAlert,
} from 'lucide-react';
import apiClient from '../../lib/api';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

/* ─── Types ─── */

type AdminUserSport = {
  icon: string;
  name: string;
  level: string;
  frequency: string;
  yearsExperience: number | null;
};

type PriorAction = {
  action_type: 'warn' | 'suspend' | 'ban' | 'dismiss';
  previous_account_status: string;
  new_account_status: string;
  note: string | null;
  suspended_until: string | null;
  created_at: string;
  admin_email: string;
};

type AdminUserProfileData = {
  id: number;
  email: string;
  accountStatus: 'active' | 'suspended' | 'banned';
  suspendedUntil: string | null;
  suspensionReason: string | null;
  createdAt: string;
  lastActive: string | null;
  isOnline: boolean;
  name: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  goal: string | null;
  primaryFrequency: string | null;
  photos: string[];
  sports: AdminUserSport[];
  priorActions: PriorAction[];
};

/* ─── Helpers ─── */

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function accountAge(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
}

/* ─── Reused design primitives ─── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{children}</h2>
  );
}

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Professional: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    Advanced: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    Intermediate: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    Beginner: 'bg-green-500/20 text-green-300 border border-green-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[level] ?? 'bg-white/10 text-white/60'}`}>
      {level}
    </span>
  );
}

/* ─── Photo gallery ─── */

function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const safePhotos = photos.length > 0 ? photos : [''];

  const prev = () => setIdx(i => (i - 1 + safePhotos.length) % safePhotos.length);
  const next = () => setIdx(i => (i + 1) % safePhotos.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 group bg-white/5">
        <ImageWithFallback
          src={safePhotos[idx]}
          alt={`${name}'s photo`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
        {safePhotos.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
            {idx + 1} / {safePhotos.length}
          </div>
        )}
        {safePhotos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100" aria-label="Previous photo">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100" aria-label="Next photo">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {safePhotos.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`} aria-label={`Photo ${i + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {safePhotos.length > 1 && (
        <div className="flex gap-2">
          {safePhotos.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === idx ? 'border-purple-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}>
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Account status banner ─── */

function AccountStatusBanner({ user }: { user: AdminUserProfileData }) {
  if (user.accountStatus === 'active') return null;

  const isBanned = user.accountStatus === 'banned';
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
      isBanned
        ? 'bg-red-500/10 border-red-500/20 text-red-300'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    }`}>
      <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold capitalize">{user.accountStatus}</p>
        {user.suspendedUntil && (
          <p className="text-xs opacity-80">Until: {formatDate(user.suspendedUntil)}</p>
        )}
        {user.suspensionReason && (
          <p className="text-xs opacity-80 mt-0.5">Reason: {user.suspensionReason}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─── */

export function AdminUserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<AdminUserProfileData | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'notfound' | 'idle'>('loading');

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      const res = await apiClient.get<AdminUserProfileData>(`/api/admin/users/${userId}/profile`);
      setProfile(res.data);
      setStatus('idle');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setStatus(status === 404 ? 'notfound' : 'error');
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const bg = 'min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans overflow-x-hidden';

  if (status === 'loading') {
    return (
      <div className={bg}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
          <p className="text-white/50 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className={bg}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
            <X className="w-10 h-10 text-white/60" />
          </div>
          <h3 className="text-2xl font-bold mb-2">User not found</h3>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm font-semibold transition-colors mt-4">
            <ChevronLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <div className={bg}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
            <X className="w-10 h-10 text-rose-400 opacity-70" />
          </div>
          <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
          <button onClick={fetchProfile} className="flex items-center gap-2 px-6 py-3 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-xl text-sm font-semibold transition-colors mt-4">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.name || profile.email;
  const locationLabel = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div className={bg}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 pb-24">

        <div className="mb-6 flex justify-end">
          <span className="text-xs text-purple-300/70 uppercase tracking-widest font-semibold">Admin view</span>
        </div>

        {/* Account status banner (only shown when not active) */}
        {profile.accountStatus !== 'active' && (
          <div className="mb-6">
            <AccountStatusBanner user={profile} />
          </div>
        )}

        {/* Top split: gallery + summary */}
        <div className="grid lg:grid-cols-5 gap-8 mb-8">

          <div className="lg:col-span-2">
            <PhotoGallery photos={profile.photos} name={displayName} />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Name / age / location */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-heading">
                {profile.name ? `${profile.name}, ${profile.age}` : profile.email}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {locationLabel && (
                  <span className="flex items-center gap-1.5 text-white/70 text-sm">
                    <MapPin className="w-4 h-4 text-purple-300" />
                    {locationLabel}
                  </span>
                )}
                {profile.isOnline && (
                  <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active now
                  </span>
                )}
              </div>
              {profile.sports.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.sports.map(s => (
                    <span key={s.name} className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {s.icon} {s.name}
                    </span>
                  ))}
                  {profile.primaryFrequency && (
                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-xs text-white/60 px-3 py-1.5 rounded-full">
                      🗓 {profile.primaryFrequency}
                    </span>
                  )}
                  {profile.goal && (
                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-xs text-white/60 px-3 py-1.5 rounded-full">
                      🎯 {profile.goal}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Admin metadata */}
            <Card>
              <SectionTitle>Account info</SectionTitle>
              <div className="space-y-1.5 text-sm text-white/70">
                <p><span className="text-white/40">Email:</span> {profile.email}</p>
                <p><span className="text-white/40">Status:</span> <span className="capitalize">{profile.accountStatus}</span></p>
                <p><span className="text-white/40">Account age:</span> {accountAge(profile.createdAt)}</p>
                <p><span className="text-white/40">Member since:</span> {formatDate(profile.createdAt)}</p>
                {profile.lastActive && (
                  <p><span className="text-white/40">Last active:</span> {formatDate(profile.lastActive)}</p>
                )}
              </div>
            </Card>

            {/* Moderation history */}
            <Card>
              <SectionTitle>Moderation history</SectionTitle>
              {profile.priorActions.length === 0 ? (
                <p className="text-sm text-white/50">No moderation actions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {profile.priorActions.map((action, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm">
                      <p className="font-semibold text-white capitalize">
                        {action.action_type}
                        <span className="text-white/40 font-normal ml-2">
                          {action.previous_account_status} → {action.new_account_status}
                        </span>
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">By {action.admin_email} · {formatDate(action.created_at)}</p>
                      {action.action_type === 'suspend' && action.suspended_until && (
                        <p className="text-white/40 text-xs mt-0.5">Until: {formatDate(action.suspended_until)}</p>
                      )}
                      {action.note && <p className="text-white/60 text-xs mt-1">{action.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        </div>

        {/* Detail cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Sports */}
          <Card>
            <SectionTitle>Sports & Training</SectionTitle>
            {profile.sports.length > 0 ? (
              <div className="space-y-3">
                {profile.sports.map(sport => (
                  <div key={sport.name} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sport.icon}</span>
                      <span className="font-semibold text-sm">{sport.name}</span>
                    </div>
                    <LevelBadge level={sport.level} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No sports added yet.</p>
            )}
          </Card>

          {/* Training Details */}
          <Card>
            <SectionTitle>Training Details</SectionTitle>
            {profile.sports.length > 0 ? (
              <div className="space-y-3">
                {profile.sports.map(sport => (
                  <div key={sport.name} className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-white/80">
                      <span className="text-lg">{sport.icon}</span>
                      <span className="font-semibold text-sm">{sport.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pl-7 text-xs">
                      <span className="flex items-center gap-1 text-white/60">
                        <Activity className="w-3 h-3" />
                        {sport.frequency}
                      </span>
                      {typeof sport.yearsExperience === 'number' && (
                        <span className="flex items-center gap-1 text-white/60">
                          <Trophy className="w-3 h-3" />
                          {sport.yearsExperience} {sport.yearsExperience === 1 ? 'yr' : 'yrs'} exp.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No training details available.</p>
            )}
          </Card>

          {/* About */}
          <Card className="md:col-span-2">
            <SectionTitle>About {profile.name || 'user'}</SectionTitle>
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {profile.bio || 'No bio yet.'}
            </p>
          </Card>

          {/* Looking for */}
          <Card className="md:col-span-2">
            <SectionTitle>Looking for</SectionTitle>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-4">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-purple-300" />
              </div>
              <span className="font-semibold text-white">{profile.goal || 'Not specified'}</span>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
