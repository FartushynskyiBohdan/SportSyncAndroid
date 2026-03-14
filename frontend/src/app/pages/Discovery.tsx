import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Heart, X, MapPin, Activity, Target } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const ATHLETES = [
  {
    id: 1,
    name: "Emma",
    age: 26,
    distance: "4 km away",
    image: "https://images.unsplash.com/photo-1771513699065-0f0f696341b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBydW5uZXIlMjBwb3J0cmFpdCUyMGF0aGxldGV8ZW58MXx8fHwxNzcyODMzMTc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sports: [
      { icon: "🏃", name: "Running", level: "Competitive" },
      { icon: "🚴", name: "Cycling", level: "Intermediate" }
    ],
    frequency: "5x per week",
    goal: "Marathon training partner",
    tag: "New today"
  },
  {
    id: 2,
    name: "Alex",
    age: 28,
    distance: "2 km away",
    image: "https://images.unsplash.com/photo-1752778597829-9e92e6d8b42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwY3Jvc3NmaXQlMjBhdGhsZXRlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyODMzMTkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    sports: [
      { icon: "🏋️", name: "CrossFit", level: "Advanced" },
      { icon: "💪", name: "Weightlifting", level: "Advanced" }
    ],
    frequency: "6x per week",
    goal: "Competition prep",
    tag: "Recently active"
  },
  {
    id: 3,
    name: "Sarah",
    age: 24,
    distance: "7 km away",
    image: "https://images.unsplash.com/photo-1472521882609-05fb39814d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBzd2ltbWVyJTIwcG9ydHJhaXQlMjBhdGhsZXRlfGVufDF8fHx8MTc3MjgzMzE5MXww&ixlib=rb-4.1.0&q=80&w=1080",
    sports: [
      { icon: "🏊‍♀️", name: "Swimming", level: "Intermediate" },
      { icon: "🧘‍♀️", name: "Yoga", level: "Beginner" }
    ],
    frequency: "3x per week",
    goal: "Active lifestyle"
  }
];

export function Discovery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimation();
  const [exitX, setExitX] = useState<number>(0);

  // Filter out the profiles we've already swiped past
  const currentAthlete = ATHLETES[currentIndex];

  const handleSwipe = async (direction: 'left' | 'right') => {
    const xOff = direction === 'right' ? 300 : -300;
    setExitX(xOff);
    await controls.start({
      x: xOff,
      opacity: 0,
      rotate: direction === 'right' ? 15 : -15,
      transition: { duration: 0.3 }
    });
    setCurrentIndex((prev) => prev + 1);
    controls.set({ x: 0, opacity: 1, rotate: 0 }); // Reset for next card
  };

  const onDragEnd = async (event: any, info: any) => {
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
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative z-10">
        
        {/* Card Container */}
        <div className="w-full max-w-[420px] relative">
          
          {currentAthlete ? (
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
              disabled={!currentAthlete}
              className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
            >
              <X className="w-7 h-7 group-hover:text-red-400 transition-colors" />
            </button>
            <button 
              onClick={() => handleSwipe('right')}
              disabled={!currentAthlete}
              className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-rose-500/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Heart className="w-10 h-10 fill-current" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}