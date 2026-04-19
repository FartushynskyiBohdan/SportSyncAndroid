import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Heart, MessageSquare, Flag, Ban,
  MapPin, ChevronLeft, ChevronRight,
  Activity, Trophy, Target, HelpCircle,
  Loader2, RefreshCw, X, Pencil,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '../components/ui/tooltip';
import apiClient, { isAxiosError } from '../lib/api';

/* ─── Own-profile type (no compatibility / relation) ─── */

type OwnUserSport = {
  icon:            string;
  name:            string;
  level:           string;
  frequency:       string;
  yearsExperience: number | null;
};

type OwnUserProfile = {
  id:               number;
  name:             string;
  age:              number;
  city:             string;
  country:          string;
  bio:              string | null;
  goal:             string | null;
  lastActive:       string | null;
  isOnline:         boolean;
  photos:           string[];
  primaryFrequency: string | null;
  sports:           OwnUserSport[];
};

/* ─── API types (mirror GET /api/users/:id) ─── */

type CompatMetric = { pct: number; detail: string };

type Compatibility = {
  sharedSports:      CompatMetric;
  trainingFrequency: CompatMetric;
  goalAlignment:     CompatMetric;
};

type Relation = {
  isSelf:        boolean;
  alreadyLiked:  boolean;
  alreadyPassed: boolean;
  matched:       boolean;
  matchId:       number | null;
  blockedByMe:   boolean;
};

type UserSport = {
  icon:            string;
  name:            string;
  level:           string;
  frequency:       string;
  yearsExperience: number | null;
};

type UserProfile = {
  id:               number;
  name:             string;
  age:              number;
  city:             string;
  country:          string;
  bio:              string | null;
  goal:             string | null;
  lastActive:       string | null;
  isOnline:         boolean;
  photos:           string[];
  primaryFrequency: string | null;
  sports:           UserSport[];
  compatibility:    Compatibility;
  relation:         Relation;
};

/* ─── Small reusable bits ─── */

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    'Professional': 'bg-rose-500/20   text-rose-300   border border-rose-500/30',
    'Advanced':     'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    'Intermediate': 'bg-blue-500/20   text-blue-300   border border-blue-500/30',
    'Beginner':     'bg-green-500/20  text-green-300  border border-green-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[level] ?? 'bg-white/10 text-white/60'}`}>
      {level}
    </span>
  );
}

function CompatBar({ pct }: { pct: number }) {
  const colour =
    pct >= 75 ? 'from-emerald-500 to-green-400' :
    pct >= 50 ? 'from-purple-500  to-purple-400' :
                'from-gray-500    to-gray-400';
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colour} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

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

/* ─── Photo Gallery ─── */

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
          className="w-full h-full object-cover" // removed zoom on hover
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {safePhotos.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
            {idx + 1} / {safePhotos.length}
          </div>
        )}

        {safePhotos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {safePhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {safePhotos.length > 1 && (
        <div className="flex gap-2">
          {safePhotos.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all
                ${i === idx ? 'border-purple-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── States: loading / error / 404 ─── */

function FullPageState({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <FullPageState>
      <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
      <p className="text-white/50 text-sm">Loading profile…</p>
    </FullPageState>
  );
}

function NotFoundState() {
  const navigate = useNavigate();
  return (
    <FullPageState>
      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
        <X className="w-10 h-10 text-white/60" />
      </div>
      <h3 className="text-2xl font-bold font-heading mb-2">Profile unavailable</h3>
      <p className="text-white/60 text-sm max-w-sm mb-6">
        This user doesn't exist, isn't active, or hasn't finished setting up their profile.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm font-semibold transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Go back
      </button>
    </FullPageState>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <FullPageState>
      <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
        <X className="w-10 h-10 text-rose-400 opacity-70" />
      </div>
      <h3 className="text-xl font-bold font-heading mb-2">Something went wrong</h3>
      <p className="text-white/60 text-sm max-w-sm mb-6">We couldn't load this profile. Please try again.</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-xl text-sm font-semibold transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </FullPageState>
  );
}

/* ─── Shared profile-content sub-components ─── */

function ProfileHeader({ name, age, city, country, isOnline, sports, primaryFrequency }: {
  name: string; age: number; city: string; country: string; isOnline: boolean;
  sports: OwnUserSport[]; primaryFrequency: string | null;
}) {
  const locationLabel = country ? `${city}, ${country}` : city;
  return (
    <div>
      <h1 className="text-4xl md:text-5xl font-black tracking-tight font-heading">
        {name}, {age}
      </h1>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <span className="flex items-center gap-1.5 text-white/70 text-sm">
          <MapPin className="w-4 h-4 text-purple-300" />
          {locationLabel}
        </span>
        {isOnline && (
          <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Active now
          </span>
        )}
      </div>
      {sports.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {sports.map(s => (
            <span
              key={s.name}
              className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              {s.icon} {s.name}
            </span>
          ))}
          {primaryFrequency && (
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-xs text-white/60 px-3 py-1.5 rounded-full">
              🗓 {primaryFrequency}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function AboutCard({ name, bio }: { name: string; bio: string | null }) {
  return (
    <Card>
      <SectionTitle>About {name}</SectionTitle>
      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
        {bio || 'No bio yet.'}
      </p>
    </Card>
  );
}

function LookingForCard({ goal }: { goal: string | null }) {
  return (
    <Card>
      <SectionTitle>Looking for</SectionTitle>
      <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-4">
        <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-purple-300" />
        </div>
        <span className="font-semibold text-white">
          {goal || 'Not specified'}
        </span>
      </div>
    </Card>
  );
}

function SportsAndTrainingCards({ sports }: { sports: OwnUserSport[] }) {
  return (
    <>
      <Card>
        <SectionTitle>Sports & Training</SectionTitle>
        {sports.length > 0 ? (
          <div className="space-y-3">
            {sports.map(sport => (
              <div
                key={sport.name}
                className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl px-4 py-3"
              >
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

      <Card>
        <SectionTitle>Training Details</SectionTitle>
        {sports.length > 0 ? (
          <div className="space-y-3">
            {sports.map(sport => (
              <div
                key={sport.name}
                className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex flex-col gap-1.5"
              >
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
    </>
  );
}

/* ─── Own-profile page ─── */

function OwnProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OwnUserProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');

  const fetchProfile = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await apiClient.get<OwnUserProfile>('/api/users/me');
      setProfile(res.data);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (status === 'loading') return <LoadingState />;
  if (status === 'error' || !profile) return <ErrorState onRetry={fetchProfile} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans overflow-x-hidden">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24">

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <button
            onClick={() => navigate('/profile/edit')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {/* ── Top split: gallery + summary ── */}
        <div className="grid lg:grid-cols-5 gap-8 mb-8">

          <div className="lg:col-span-2">
            <PhotoGallery photos={profile.photos} name={profile.name} />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">
            <ProfileHeader
              name={profile.name}
              age={profile.age}
              city={profile.city}
              country={profile.country}
              isOnline={profile.isOnline}
              sports={profile.sports}
              primaryFrequency={profile.primaryFrequency}
            />
            <AboutCard name={profile.name} bio={profile.bio} />
            <LookingForCard goal={profile.goal} />
          </div>
        </div>

        {/* ── Detail cards ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <SportsAndTrainingCards sports={profile.sports} />
        </div>

      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'notfound'>('loading');
  const [liking, setLiking] = useState(false);
  const [justMatched, setJustMatched] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      const res = await apiClient.get<UserProfile>(`/api/users/${userId}`);
      setProfile(res.data);
      setJustMatched(false);
      setStatus('idle');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          setStatus('notfound');
          return;
        }
        if (err.response?.status === 409 && err.response.data?.redirect) {
          navigate(err.response.data.redirect, { replace: true });
          return;
        }
      }
      setStatus('error');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  const handleLike = async () => {
    if (!profile || liking || profile.relation.alreadyLiked) return;
    setLiking(true);
    try {
      const res = await apiClient.post<{ matched: boolean; matchId: number | null }>(
        `/api/discover/like/${profile.id}`
      );
      setProfile(p => p && ({
        ...p,
        relation: {
          ...p.relation,
          alreadyLiked: true,
          matched: res.data.matched || p.relation.matched,
          matchId: res.data.matchId ?? p.relation.matchId,
        },
      }));
      if (res.data.matched) setJustMatched(true);
    } catch (err) {
      console.error('Failed to like user:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleMessage = () => {
    if (!profile?.relation.matched || !profile.relation.matchId) return;
    navigate(`/messages?matchId=${profile.relation.matchId}`);
  };

  /* ─── Route to own-profile page if no userId param ─── */
  if (!userId) return <OwnProfilePage />;

  if (status === 'loading')  return <LoadingState />;
  if (status === 'notfound') return <NotFoundState />;
  if (status === 'error' || !profile) return <ErrorState onRetry={fetchProfile} />;

  /* ─── Derived view-model ─── */

  const likeLabel = justMatched ? "It's a match!" : profile.relation.alreadyLiked ? 'Liked' : 'Like';
  const canMessage = profile.relation.matched && profile.relation.matchId !== null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans overflow-x-hidden">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24">

          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          {/* ── Top split: gallery + profile summary ── */}
          <div className="grid lg:grid-cols-5 gap-8 mb-8">

            {/* Photo gallery */}
            <div className="lg:col-span-2">
              <PhotoGallery photos={profile.photos} name={profile.name} />
            </div>

            {/* Profile summary */}
            <div className="lg:col-span-3 flex flex-col gap-6">

              <ProfileHeader
                name={profile.name}
                age={profile.age}
                city={profile.city}
                country={profile.country}
                isOnline={profile.isOnline}
                sports={profile.sports}
                primaryFrequency={profile.primaryFrequency}
              />

              {/* Compatibility */}
              <Card>
                <SectionTitle>Compatibility with you</SectionTitle>
                <div className="space-y-5">
                  <CompatRow
                    label="Shared Sports"
                    metric={profile.compatibility.sharedSports}
                  />
                  <CompatRow
                    label="Training Frequency"
                    metric={profile.compatibility.trainingFrequency}
                  />
                  <CompatRow
                    label="Goal Alignment"
                    metric={profile.compatibility.goalAlignment}
                    hint={
                      'Based on your relationship goals. Same goal scores highest; ' +
                      'compatible goals (e.g. Casual + Friendship) are partial; ' +
                      'opposing goals score lowest.'
                    }
                  />
                </div>
              </Card>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleLike}
                    disabled={liking || profile.relation.alreadyLiked}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:hover:scale-100 disabled:cursor-default
                      ${profile.relation.alreadyLiked
                        ? 'bg-rose-500 shadow-rose-500/30'
                        : 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-rose-500/25 hover:from-pink-400 hover:to-rose-400'
                      }`}
                  >
                    <Heart className={`w-5 h-5 transition-all ${profile.relation.alreadyLiked ? 'fill-current scale-110' : ''}`} />
                    {likeLabel}
                  </button>

                  <button
                    onClick={handleMessage}
                    disabled={!canMessage}
                    title={canMessage ? 'Open conversation' : 'Match first to message'}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all shadow-xl
                      ${canMessage
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 hover:scale-[1.02] active:scale-[0.98] shadow-purple-600/25'
                        : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed shadow-transparent'
                      }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <Ban className="w-4 h-4" />
                    Block
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-rose-400/70 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 transition-colors">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── Detail cards ── */}
          <div className="grid md:grid-cols-2 gap-6">

            <SportsAndTrainingCards sports={profile.sports} />

            {/* Bio */}
            <Card className="md:col-span-2">
              <SectionTitle>About {profile.name}</SectionTitle>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                {profile.bio || 'No bio yet.'}
              </p>
            </Card>

            {/* Goal */}
            <Card className="md:col-span-2">
              <SectionTitle>Looking for</SectionTitle>
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-4">
                <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-purple-300" />
                </div>
                <span className="font-semibold text-white">
                  {profile.goal || 'Not specified'}
                </span>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ─── Compatibility row (with optional hint tooltip) ─── */

function CompatRow({
  label, metric, hint,
}: {
  label:  string;
  metric: CompatMetric;
  hint?:  string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="flex items-center gap-1 text-sm font-medium text-white/80">
          {label}
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`How ${label} is calculated`}
                  className="inline-flex items-center text-white/40 hover:text-white/80 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-left leading-snug">
                {hint}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="text-xs font-semibold text-white/50">{metric.detail}</span>
      </div>
      <CompatBar pct={metric.pct} />
    </div>
  );
}
