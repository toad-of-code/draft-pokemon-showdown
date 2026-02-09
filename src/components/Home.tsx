import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Zap, Sparkles, Swords } from 'lucide-react';

const Home: React.FC = () => {
    const { setGamePhase } = useGameStore();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 -z-10" />

            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-500/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="max-w-4xl w-full text-center space-y-8 z-10">
                {/* Title */}
                <div className="space-y-4">
                    <div className="flex justify-center gap-4 mb-6">
                        <Swords className="w-12 h-12 text-yellow-500 animate-bounce" style={{ animationDelay: '0s' }} />
                        <Sparkles className="w-12 h-12 text-cyan-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <Zap className="w-12 h-12 text-red-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-tighter drop-shadow-2xl">
                        Infinite Draft Ops
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 font-mono tracking-wide">
                        AI-Powered Competitive Battler
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                    <FeatureCard
                        icon={<Sparkles className="w-8 h-8" />}
                        title="AI Draft"
                        description="Unique AI-generated names for every unit"
                    />
                    <FeatureCard
                        icon={<Swords className="w-8 h-8" />}
                        title="Strategic Combat"
                        description="Turn-based battles with type effectiveness"
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8" />}
                        title="Smart AI"
                        description="Adaptive AI opponent with 3 difficulty levels"
                    />
                </div>

                {/* Start Button */}
                <div className="mt-16">
                    <button
                        onClick={() => setGamePhase('DRAFT')}
                        className="group relative px-12 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black text-2xl uppercase tracking-wider rounded-xl overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-yellow-500/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-3">
                            <Zap className="w-8 h-8 group-hover:animate-spin" />
                            Let's Battle
                            <Zap className="w-8 h-8 group-hover:animate-spin" />
                        </span>
                    </button>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-slate-600 text-sm font-mono">
                    <p>Powered by Google Gemini AI • PokeAPI</p>
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
    return (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="text-yellow-500 mb-3 flex justify-center">
                {icon}
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
        </div>
    );
};

export default Home;
