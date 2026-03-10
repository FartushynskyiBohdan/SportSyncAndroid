import { motion } from 'motion/react';

const heroImage = '/images/hero-couple.jpg';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background elements to mimic the reference image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] z-0"></div>
        
        {/* Circular graphic overlays */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] border border-white/5 rounded-full translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] border border-white/5 rounded-full translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] border border-white/5 rounded-full translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="text-white space-y-8">
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                 >
                    <h1 className="text-8xl md:text-[8rem] font-black tracking-tighter leading-[0.85]">
                        Sport<br/>Sync
                    </h1>
                 </motion.div>

                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                 >
                    <p className="text-2xl md:text-4xl font-light text-white mb-2">
                        The dating app for athletes.
                    </p>
                    <p className="text-lg md:text-xl text-purple-200 italic font-medium opacity-80">
                        Same drive. Same life. Perfect match.
                    </p>
                 </motion.div>

                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-wrap gap-4 pt-4"
                 >
                    <button className="bg-white text-purple-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-purple-100 transition-transform hover:scale-105 shadow-lg shadow-purple-900/20 cursor-pointer">
                        Find Your Match
                    </button>
                    <button className="px-8 py-4 rounded-full text-lg font-medium border border-white/30 hover:bg-white/10 transition-colors text-white cursor-pointer">
                        How It Works
                    </button>
                 </motion.div>
            </div>

            {/* Hero Image / Graphic */}
            <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, delay: 0.4 }}
                 className="relative hidden lg:block"
            >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-950/50 border border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500 max-w-lg ml-auto">
                    <img
                        src={heroImage}
                        alt="Couple stretching outdoors"
                        className="w-full h-[600px] object-cover object-top transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent pointer-events-none"></div>
                </div>
            </motion.div>
        </div>
    </section>
  );
}
