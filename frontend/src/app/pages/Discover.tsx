import { useState, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Heart, X, MapPin, Activity, Target, Sliders, Loader2, RefreshCw } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import DiscoverySettings from '../components/DiscoverySettings';
import apiClient from '../lib/api';

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

interface Athlete {
  id: number;
  name: string;
  age: number;
  distance: string;
  image: string;
  sports: { icon: string; name: string; level: string }[];
  frequency: string;
  goal: string;
  tag?: string | null;
}

export function Discovery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    interestedInGender: '2',
    minAge: 20,
    maxAge: 35,
    maxDistance: 25,
    selectedSports: [],
    minSkillLevel: '1',
    preferredFrequency: '2',
    minPhotos: 1,
    showOutOfRange: false,
  });
  const controls = useAnimation();

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/discover');
      setAthletes(res.data);
      setCurrentIndex(0);
    } catch {
      setError('Failed to load profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profiles on mount and when filters change
  useEffect(() => {
    fetchProfiles();
  }, [filters, fetchProfiles]);

  const currentAthlete = athletes[currentIndex];

  const handleSwipe = async (direction: 'left' | 'right') => {
    const xOff = direction === 'right' ? 300 : -300;
    await controls.start({
      x: xOff,
      opacity: 0,
      rotate: direction === 'right' ? 15 : -15,
      transition: { duration: 0.3 }
    });
    setCurrentIndex((prev) => prev + 1);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  };

  const onDragEnd = async (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) {
      await handleSwipe('right');
    } else if (info.offset.x < -100) {
      await handleSwipe('left');
    } else {
      controls.start({ x: 0, opacity: 1, rotate: 0, transition: { type: 'spring', bounce: 0.5 } });
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans flex flex-col overflow-hidden">
      <Navbar />

      {/* Filter Button - Top Left */}
      <div className="fixed top-24 left-4 z-20">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl group"
          aria-label="Discovery filters"
          title="Discovery Settings"
        >
          <Sliders className="w-5 h-5 group-hover:text-purple-300 transition-colors" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative z-10">

        {/* Card Container */}
        <div className="w-full max-w-[420px] relative">

          {loading ? (
            /* Loading State */
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl shadow-xl backdrop-blur-md">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
              <p className="text-white/50 text-sm">Finding athletes near you...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl shadow-xl backdrop-blur-md text-center p-8">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                <X className="w-10 h-10 text-rose-400 opacity-70" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-2">Something went wrong</h3>
              <p className="text-white/60 text-sm max-w-xs mb-6">{error}</p>
              <button
                onClick={fetchProfiles}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-xl text-sm font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : currentAthlete ? (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={onDragEnd}
              animate={controls}
              whileDrag={{ scale: 1.02 }}
              className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
              style={{ minHeight: '600px' }}
            >
              {/* Top Section - Large Photo (~70% visually) */}
              <div className="relative h-[400px] w-full shrink-0">
                <ImageWithFallback
                  src={currentAthlete.image}
                  alt={currentAthlete.name}
                  className="w-full h-full object-cover"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"></div>

                {/* Optional Tag (New today / Recently active) */}
                {currentAthlete.tag && (
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm border border-white/10">
                    {currentAthlete.tag}
                  </div>
                )}

                {/* Name & Details overlaying the image bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pt-12">
                  <h2 className="text-3xl font-black font-heading tracking-tight text-white mb-1 drop-shadow-md">
                    {currentAthlete.name}, {currentAthlete.age}
                  </h2>
                  <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium drop-shadow-md">
                    <MapPin className="w-4 h-4 text-purple-300" />
                    {currentAthlete.distance}
                  </div>
                </div>
              </div>

              {/* Bottom Section - Sports & Training Details */}
              <div className="p-6 bg-[#210c4a]/90 flex-1 flex flex-col justify-between border-t border-white/10">

                <div className="space-y-4">
                  {/* Sports List */}
                  <div>
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Sports</h3>
                    <div className="flex flex-col gap-2">
                      {currentAthlete.sports.map((sport, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                          <span className="text-lg">{sport.icon}</span>
                          <span className="text-sm font-semibold">{sport.name}</span>
                          <span className="text-xs text-white/60 ml-auto bg-black/20 px-2 py-0.5 rounded-full">{sport.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frequency & Goal */}
                  <div className="flex gap-4 pt-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                        <Activity className="w-3.5 h-3.5" />
                        Frequency
                      </div>
                      <p className="text-sm font-medium text-white/90">{currentAthlete.frequency}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                        <Target className="w-3.5 h-3.5" />
                        Goal
                      </div>
                      <p className="text-sm font-medium text-white/90">{currentAthlete.goal}</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl shadow-xl backdrop-blur-md text-center p-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-purple-300 opacity-50" />
              </div>
              <h3 className="text-2xl font-bold font-heading mb-2">You're all caught up!</h3>
              <p className="text-white/60 text-sm max-w-xs">
                Check back later for more athletes matching your preferences or expand your search distance.
              </p>
            </div>
          )}

          {/* Swipe Buttons (Outside Card to remain stationary) */}
          <div className="flex justify-center items-center gap-8 mt-8 pb-8">
            <button
              onClick={() => handleSwipe('left')}
              disabled={!currentAthlete || loading}
              className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
            >
              <X className="w-7 h-7 group-hover:text-red-400 transition-colors" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              disabled={!currentAthlete || loading}
              className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-rose-500/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Heart className="w-10 h-10 fill-current" />
            </button>
          </div>

        </div>
      </div>

      {/* Discovery Settings Drawer */}
      <DiscoverySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newFilters) => {
          setFilters(newFilters);
        }}
        initialFilters={filters}
      />
    </div>
  );
}
