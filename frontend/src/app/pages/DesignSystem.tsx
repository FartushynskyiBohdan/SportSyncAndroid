import { Heart, X, Star, MessageSquare, Bell, User, Search, ChevronRight, Check } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function DesignSystem() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] to-[#581C87] text-white overflow-x-hidden">
      {/* Navbar example inline (relative instead of fixed for preview purposes) */}
      <div className="relative border-b border-white/10 mb-12">
        <Navbar />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pb-24">
        <div className="mb-16 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">SportSync Design System</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            A comprehensive overview of our UI components, typography, and visual language designed for athletic performance and motivation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Typography & Colors */}
          <div className="lg:col-span-5 space-y-16">
            
            {/* Typography */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-white/20 pb-2">Typography</h2>
              <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div>
                  <div className="text-xs text-white/50 mb-1 font-sans">Font: Montserrat (Headings)</div>
                  <h1 className="text-5xl font-extrabold tracking-tight font-heading">Heading 1</h1>
                </div>
                <div>
                  <h2 className="text-4xl font-bold tracking-tight">Heading 2</h2>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Heading 3</h3>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">Heading 4</h4>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-1 font-sans">Font: Inter (Body)</div>
                  <p className="text-base text-white/80 leading-relaxed">
                    This is a standard body paragraph. It uses the Inter font for optimal readability on screens.
                    SportSync connects athletes based on performance, goals, and training intensity.
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Small Label / Caption</span>
                </div>
              </div>
            </section>

            {/* Colors */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-white/20 pb-2">Color Palette</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2E1065] p-4 rounded-xl border border-white/10 shadow-lg">
                  <div className="h-16 rounded-lg bg-[#2E1065] mb-2 shadow-inner"></div>
                  <div className="font-bold text-sm">Deep Purple</div>
                  <div className="text-xs text-white/60">#2E1065</div>
                </div>
                <div className="bg-[#581C87] p-4 rounded-xl border border-white/10 shadow-lg">
                  <div className="h-16 rounded-lg bg-[#581C87] mb-2 shadow-inner"></div>
                  <div className="font-bold text-sm">Vibrant Purple</div>
                  <div className="text-xs text-white/60">#581C87</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg text-purple-900">
                  <div className="h-16 rounded-lg bg-white mb-2 shadow-inner border border-gray-100"></div>
                  <div className="font-bold text-sm">Pure White</div>
                  <div className="text-xs text-purple-900/60">#FFFFFF</div>
                </div>
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
                  <div className="h-16 rounded-lg bg-white/10 mb-2 shadow-inner"></div>
                  <div className="font-bold text-sm">Glass Surface</div>
                  <div className="text-xs text-white/60">white/10 + Blur</div>
                </div>
                <div className="bg-[#E11D48] p-4 rounded-xl border border-white/10 shadow-lg">
                  <div className="h-16 rounded-lg bg-[#E11D48] mb-2 shadow-inner"></div>
                  <div className="font-bold text-sm">Action Red</div>
                  <div className="text-xs text-white/60">#E11D48 (Likes)</div>
                </div>
                <div className="bg-[#06B6D4] p-4 rounded-xl border border-white/10 shadow-lg">
                  <div className="h-16 rounded-lg bg-[#06B6D4] mb-2 shadow-inner"></div>
                  <div className="font-bold text-sm">Action Blue</div>
                  <div className="text-xs text-white/60">#06B6D4 (Super)</div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Components */}
          <div className="lg:col-span-7 space-y-16">
            
            {/* Buttons & Interactions */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-white/20 pb-2">Buttons & Inputs</h2>
              
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm space-y-8">
                {/* Standard Buttons */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Standard Buttons</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button className="bg-white text-purple-900 px-6 py-3 rounded-full font-bold hover:bg-purple-100 transition-colors shadow-lg shadow-black/20">
                      Primary Action
                    </button>
                    <button className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full font-bold hover:bg-white/20 transition-colors backdrop-blur-md">
                      Secondary Glass
                    </button>
                    <button className="text-white font-medium hover:text-purple-300 transition-colors flex items-center gap-1">
                      Text Button <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Input Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium pl-1 text-white/80">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="athlete@example.com"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium pl-1 text-white/80">Search Users</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search..."
                          className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Profile Components */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-white/20 pb-2">Profile & Cards</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Swipe Card Concept */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">Match Card</h3>
                  
                  <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl group">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1645081522795-231884bfcbfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGZpdG5lc3MlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzI3ODU0Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                      alt="Athlete portrait"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Card Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <h3 className="text-2xl font-bold font-heading flex items-center gap-2">
                            Sarah, 26
                            <span className="w-2.5 h-2.5 bg-green-400 rounded-full" title="Online"></span>
                          </h3>
                          <p className="text-white/80 font-medium">CrossFit Competitor</p>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">Weightlifting</span>
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">High Intensity</span>
                      </div>
                    </div>
                  </div>

                  {/* Swipe Actions */}
                  <div className="flex justify-center items-center gap-6 pt-2">
                    <button className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg">
                      <X className="w-6 h-6" />
                    </button>
                    <button className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-xl shadow-rose-500/30">
                      <Heart className="w-8 h-8 fill-current" />
                    </button>
                    <button className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-cyan-400 transition-all hover:scale-110 active:scale-95 shadow-lg">
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Avatars and Small Components */}
                <div className="space-y-8">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Avatars</h3>
                    <div className="flex items-end gap-4">
                      {/* Large */}
                      <div className="relative">
                        <img 
                          src="https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyODMyMTQxfDA&ixlib=rb-4.1.0&q=80&w=1080" 
                          alt="Avatar" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-[#3B1473] rounded-full"></span>
                      </div>
                      {/* Medium */}
                      <div className="relative">
                        <img 
                          src="https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyODMyMTQxfDA&ixlib=rb-4.1.0&q=80&w=1080" 
                          alt="Avatar" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      </div>
                      {/* Small */}
                      <img 
                        src="https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyODMyMTQxfDA&ixlib=rb-4.1.0&q=80&w=1080" 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full object-cover border border-white"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Interactive Elements</h3>
                    <div className="space-y-4">
                      {/* Checkbox item */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-purple-500 border border-purple-400">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-medium">Looking for training partner</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded border border-white/30 group-hover:border-white/60 transition-colors"></div>
                        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Competitive only</span>
                      </label>
                    </div>
                  </div>
                  
                </div>

              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}