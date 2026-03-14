import { Dumbbell, HeartPulse, Trophy, Timer } from 'lucide-react';

const steps = [
    {
        icon: Dumbbell,
        title: "Sport Type",
        desc: "Find someone who understands your specific discipline, from CrossFit to Marathon running."
    },
    {
        icon: HeartPulse,
        title: "Training Intensity",
        desc: "Match with athletes who share your drive and daily grind."
    },
    {
        icon: Trophy,
        title: "Competition Level",
        desc: "Whether you're pro, amateur, or recreational, find your equal."
    },
    {
        icon: Timer,
        title: "Regimen & Goals",
        desc: "Sync your schedules and align your fitness ambitions."
    }
];

export function HowItWorks() {
    return (
        <section className="py-24 bg-[#1e1b4b] text-white relative">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
                    <p className="text-purple-200 max-w-2xl mx-auto text-lg">
                        We don't just match personalities; we match lifestyles. Your training schedule shouldn't be a dealbreaker.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors group">
                            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                                <step.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-purple-200 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
