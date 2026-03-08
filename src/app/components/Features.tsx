export function Features() {
    return (
        <section className="py-24 bg-[#2E1065] text-white overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

             <div className="max-w-[1440px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-12">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Train Together,<br/>Stay Together</h2>
                        <p className="text-lg text-purple-200">
                            Connect with partners who won't ask you to skip leg day. SportSync is designed for those who prioritize health, fitness, and competition.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-200 font-bold text-xl">1</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Smart Matching</h3>
                                <p className="text-purple-200 text-sm leading-relaxed max-w-md">Our algorithm accounts for your VO2 max, training hours, and rest days to ensure compatibility.</p>
                            </div>
                        </div>
                         <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-200 font-bold text-xl">2</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Event Integration</h3>
                                <p className="text-purple-200 text-sm leading-relaxed max-w-md">Find a date for your next 5K, Triathlon, or CrossFit competition directly through our event finder.</p>
                            </div>
                        </div>
                         <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-200 font-bold text-xl">3</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Active Dates</h3>
                                <p className="text-purple-200 text-sm leading-relaxed max-w-md">Skip the coffee. Go for a run, hike, or climb as your first date with curated active date ideas.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative h-[600px] flex items-center justify-center">
                     <div className="relative w-full h-full">
                        <img 
                            src="https://images.unsplash.com/photo-1758875569612-94d5e0f1a35f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlbnNlJTIwY3Jvc3NmaXQlMjB3b3Jrb3V0JTIwYXRobGV0ZXxlbnwxfHx8fDE3NzE3MTY1MTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                            className="absolute top-0 right-0 w-3/4 h-3/5 object-cover rounded-2xl shadow-2xl z-10 border-4 border-[#2E1065]" 
                            alt="Crossfit Athlete" 
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1686323955670-0bde6a3aba73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wZXRpdGl2ZSUyMHN3aW1taW5nJTIwcmFjZXxlbnwxfHx8fDE3NzE3MTY1MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                            className="absolute bottom-0 left-0 w-3/4 h-3/5 object-cover rounded-2xl shadow-2xl z-20 border-4 border-[#2E1065]" 
                            alt="Swimmer" 
                        />
                     </div>
                </div>
             </div>
        </section>
    );
}
