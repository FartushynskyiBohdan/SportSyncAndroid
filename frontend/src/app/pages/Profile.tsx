import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Heart, MessageSquare, Flag, Ban,
  MapPin, ChevronLeft, ChevronRight,
  Clock, TrendingUp, Trophy, Zap, Target,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

/* ─── Data ─── */

const ATHLETE = {
  name: 'Emma',
  age: 26,
  distance: '4 km away',
  isOnline: true,
  photos: [
    'https://images.unsplash.com/photo-1771513699065-0f0f696341b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  ],
  sports: [
    { icon: '🏃', name: 'Running',  level: 'Competitive'  },
    { icon: '🚴', name: 'Cycling',  level: 'Intermediate' },
  ],
  frequency: '5x per week',
  bio: "Training for my next marathon. I love early morning runs and exploring new trails. Looking for someone who shares the same passion for endurance sports and doesn't mind a 6 AM start 🌄",
  goal: 'Marathon training partner',
  stats: [
    { label: 'Weekly Training', value: '8 hrs',        Icon: Clock       },
    { label: 'Weekly Distance', value: '60 km',         Icon: TrendingUp  },
    { label: 'Avg Pace',        value: '5:30 /km',      Icon: Zap         },
    { label: 'Recent Race',     value: 'Half Marathon',  Icon: Trophy      },
  ],
  compatibility: [
    { label: 'Shared Sports',          detail: 'Running, Cycling', pct: 85 },
    { label: 'Training Frequency',     detail: 'High match',       pct: 80 },
    { label: 'Lifestyle Compatibility',detail: 'Good',             pct: 72 },
  ],
};

/* ─── Small reusable bits ─── */

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    'Competitive':  'bg-rose-500/20   text-rose-300   border border-rose-500/30',
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

function PhotoGallery({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1)                 % photos.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Main photo */}
      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 group">
        <ImageWithFallback
          src={photos[idx]}
          alt="Profile photo"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Counter */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
          {idx + 1} / {photos.length}
        </div>

        {/* Arrows */}
        {photos.length > 1 && (
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
          </>
        )}

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2">
        {photos.map((src, i) => (
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
    </div>
  );
}

/* ─── Main Page ─── */

export function Profile() {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans overflow-x-hidden">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-24">

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Matches
        </button>

        {/* ── Top split: gallery + profile summary ── */}
        <div className="grid lg:grid-cols-5 gap-8 mb-8">

          {/* Photo gallery */}
          <div className="lg:col-span-2">
            <PhotoGallery photos={ATHLETE.photos} />
          </div>

          {/* Profile summary */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Name & basics */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight font-heading">
                    {ATHLETE.name}, {ATHLETE.age}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="flex items-center gap-1.5 text-white/70 text-sm">
                      <MapPin className="w-4 h-4 text-purple-300" />
                      {ATHLETE.distance}
                    </span>
                    {ATHLETE.isOnline && (
                      <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Active now
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sport quick-tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {ATHLETE.sports.map(s => (
                  <span
                    key={s.name}
                    className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
                  >
                    {s.icon} {s.name}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-xs text-white/60 px-3 py-1.5 rounded-full">
                  🗓 {ATHLETE.frequency}
                </span>
              </div>
            </div>

            {/* Compatibility */}
            <Card>
              <SectionTitle>Compatibility with you</SectionTitle>
              <div className="space-y-5">
                {ATHLETE.compatibility.map(c => (
                  <div key={c.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-white/80">{c.label}</span>
                      <span className="text-xs font-semibold text-white/50">{c.detail}</span>
                    </div>
                    <CompatBar pct={c.pct} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLiked(l => !l)}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl
                    ${liked
                      ? 'bg-rose-500 shadow-rose-500/30'
                      : 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-rose-500/25 hover:from-pink-400 hover:to-rose-400'
                    }`}
                >
                  <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-current scale-110' : ''}`} />
                  {liked ? 'Liked!' : 'Like'}
                </button>

                <button
                  onClick={() => navigate('/messages')}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-600/25"
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

          {/* Sports & Training */}
          <Card>
            <SectionTitle>Sports & Training</SectionTitle>
            <div className="space-y-3">
              {ATHLETE.sports.map(sport => (
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
          </Card>

          {/* Training Stats */}
          <Card>
            <SectionTitle>Training Stats</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {ATHLETE.stats.map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                  </div>
                  <span className="text-lg font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Bio */}
          <Card className="md:col-span-2">
            <SectionTitle>About Emma</SectionTitle>
            <p className="text-white/80 text-sm leading-relaxed">{ATHLETE.bio}</p>
          </Card>

          {/* Goal */}
          <Card className="md:col-span-2">
            <SectionTitle>Looking for</SectionTitle>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-4">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-purple-300" />
              </div>
              <span className="font-semibold text-white">{ATHLETE.goal}</span>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
