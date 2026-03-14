import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { MessageSquare, User, ChevronDown, MapPin, Clock, Heart } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const SORT_OPTIONS = [
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'newest_match',    label: 'Newest Match'    },
  { value: 'distance',        label: 'Distance'        },
  { value: 'shared_sports',   label: 'Shared Sports'   },
];

type Match = {
  id: number;
  name: string;
  age: number;
  sport: { icon: string; name: string };
  distance: string;
  lastActive: string;
  isOnline: boolean;
  image: string;
  matchedDaysAgo: number;
  sharedSports: number;
};

const MATCHES: Match[] = [
  {
    id: 1,
    name: 'Emma',
    age: 26,
    sport: { icon: '🏃', name: 'Runner' },
    distance: '4 km away',
    lastActive: 'Active now',
    isOnline: true,
    image: 'https://images.unsplash.com/photo-1771513699065-0f0f696341b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    matchedDaysAgo: 1,
    sharedSports: 2,
  },
  {
    id: 2,
    name: 'Alex',
    age: 28,
    sport: { icon: '🏋️', name: 'CrossFit' },
    distance: '2 km away',
    lastActive: 'Active 1h ago',
    isOnline: false,
    image: 'https://images.unsplash.com/photo-1752778597829-9e92e6d8b42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    matchedDaysAgo: 2,
    sharedSports: 1,
  },
  {
    id: 3,
    name: 'Sarah',
    age: 24,
    sport: { icon: '🏊‍♀️', name: 'Swimmer' },
    distance: '7 km away',
    lastActive: 'Active 3h ago',
    isOnline: false,
    image: 'https://images.unsplash.com/photo-1472521882609-05fb39814d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    matchedDaysAgo: 4,
    sharedSports: 1,
  },
  {
    id: 4,
    name: 'Jordan',
    age: 30,
    sport: { icon: '🚴', name: 'Cyclist' },
    distance: '5 km away',
    lastActive: 'Active yesterday',
    isOnline: false,
    image: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    matchedDaysAgo: 6,
    sharedSports: 3,
  },
  {
    id: 5,
    name: 'Mia',
    age: 25,
    sport: { icon: '🧘‍♀️', name: 'Yoga' },
    distance: '1 km away',
    lastActive: 'Active 2d ago',
    isOnline: false,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    matchedDaysAgo: 7,
    sharedSports: 2,
  },
  {
    id: 6,
    name: 'Ryan',
    age: 27,
    sport: { icon: '⚽', name: 'Footballer' },
    distance: '9 km away',
    lastActive: 'Active 3d ago',
    isOnline: false,
    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    matchedDaysAgo: 9,
    sharedSports: 1,
  },
];

function sortMatches(matches: Match[], sort: string): Match[] {
  return [...matches].sort((a, b) => {
    switch (sort) {
      case 'recently_active': return a.matchedDaysAgo - b.matchedDaysAgo;
      case 'newest_match':    return a.matchedDaysAgo - b.matchedDaysAgo;
      case 'distance':        return parseInt(a.distance) - parseInt(b.distance);
      case 'shared_sports':   return b.sharedSports - a.sharedSports;
      default:                return 0;
    }
  });
}

function MatchCard({ match }: { match: Match }) {
  const navigate = useNavigate();

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
          <p className="text-sm font-medium text-white/80 mt-0.5">
            {match.sport.icon} {match.sport.name}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.distance}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {match.lastActive}
            </span>
          </div>
        </div>

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6">
          <button
            onClick={() => navigate('/discovery')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/25"
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
          <button
            onClick={() => navigate('/profile')}
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

export function Matches() {
  const [sort, setSort] = useState('recently_active');
  const [sortOpen, setSortOpen] = useState(false);

  const sorted = sortMatches(MATCHES, sort);
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
              {MATCHES.length} mutual {MATCHES.length === 1 ? 'match' : 'matches'} — keep the momentum going!
            </p>
          </div>

          {/* Sort control */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
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

        {/* Matches grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sorted.map(match => (
              <MatchCard key={match.id} match={match} />
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
              <Link to="/discovery" className="text-purple-300 hover:text-white underline underline-offset-2 transition-colors">
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
