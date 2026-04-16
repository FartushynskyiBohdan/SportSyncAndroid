import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  MessageSquare, User, ChevronDown, MapPin, Clock, Heart,
  Loader2, RefreshCw, X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import apiClient from '../lib/api';

const SORT_OPTIONS = [
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'newest_match',    label: 'Newest Match'    },
  { value: 'shared_sports',   label: 'Shared Sports'   },
] as const;

type SortValue = typeof SORT_OPTIONS[number]['value'];

// Mirror of GET /api/matches response
type Match = {
  matchId: number;
  matchedAt: string;            // ISO timestamp
  userId: number;
  name: string;
  age: number;
  city: string;
  lastActive: string | null;    // ISO timestamp or null
  isOnline: boolean;
  sport: { icon: string; name: string } | null;
  image: string;
  sharedSports: number;
};

/* ─── Helpers ─── */

// Format "active X ago" string from a last_active ISO timestamp
function formatLastActive(iso: string | null, isOnline: boolean): string {
  if (isOnline) return 'Active now';
  if (!iso) return 'Last seen recently';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Active ${weeks}w ago`;
  return 'Active a while ago';
}

function sortMatches(matches: Match[], sort: SortValue): Match[] {
  const copy = [...matches];
  switch (sort) {
    case 'recently_active':
      // Most-recently-active first; nulls last
      return copy.sort((a, b) => {
        const aT = a.lastActive ? new Date(a.lastActive).getTime() : -Infinity;
        const bT = b.lastActive ? new Date(b.lastActive).getTime() : -Infinity;
        return bT - aT;
      });
    case 'newest_match':
      // Most-recently-matched first
      return copy.sort(
        (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
      );
    case 'shared_sports':
      return copy.sort((a, b) => b.sharedSports - a.sharedSports);
    default:
      return copy;
  }
}

/* ─── Match card ─── */

function MatchCard({ match }: { match: Match }) {
  const navigate = useNavigate();
  const lastActiveLabel = formatLastActive(match.lastActive, match.isOnline);

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-xl shadow-black/20 cursor-pointer">
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <ImageWithFallback
          src={match.image}
          alt={match.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Online indicator */}
        {match.isOnline && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-white">Online</span>
          </div>
        )}

        {/* Card info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold font-heading tracking-tight text-white">
            {match.name}, {match.age}
          </h3>
          {match.sport && (
            <p className="text-sm font-medium text-white/80 mt-0.5">
              {match.sport.icon} {match.sport.name}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastActiveLabel}
            </span>
          </div>
        </div>

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6">
          <button
            onClick={() => navigate(`/messages?matchId=${match.matchId}`)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/25"
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
          <button
            onClick={() => navigate(`/profile/${match.userId}`)}
            className="w-full flex items-center justify-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white font-semibold py-3 rounded-2xl hover:bg-white/25 transition-colors"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortValue>('recently_active');
  const [sortOpen, setSortOpen] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Match[]>('/api/matches');
      setMatches(res.data);
    } catch {
      setError('Failed to load matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const sorted = sortMatches(matches, sort);
  const currentLabel = SORT_OPTIONS.find(o => o.value === sort)?.label;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans overflow-x-hidden">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-32 pb-24">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-rose-400 fill-current" />
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Your Matches</h1>
            </div>
            <p className="text-white/60 text-sm">
              {loading
                ? 'Loading your matches…'
                : error
                  ? 'Could not load matches.'
                  : `${matches.length} mutual ${matches.length === 1 ? 'match' : 'matches'} — keep the momentum going!`
              }
            </p>
          </div>

          {/* Sort control */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen(v => !v)}
              disabled={loading || matches.length === 0}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-white/60 text-xs font-normal">Sort:</span>
              {currentLabel}
              <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#2E1065]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-20">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSort(option.value); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors
                      ${sort === option.value
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body: loading / error / empty / grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
            <p className="text-white/50 text-sm">Loading your matches…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
              <X className="w-10 h-10 text-rose-400 opacity-70" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-2">Something went wrong</h3>
            <p className="text-white/60 text-sm max-w-xs mb-6">{error}</p>
            <button
              onClick={fetchMatches}
              className="flex items-center gap-2 px-6 py-3 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-xl text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sorted.map(match => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-rose-400 opacity-40" />
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3">No matches yet</h3>
            <p className="text-white/60 max-w-sm text-sm leading-relaxed">
              If you keep{' '}
              <Link to="/discover" className="text-purple-300 hover:text-white underline underline-offset-2 transition-colors">
                discovering athletes
              </Link>
              , your matches will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Close sort dropdown on outside click */}
      {sortOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
      )}
    </div>
  );
}
