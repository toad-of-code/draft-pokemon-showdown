import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { BattlePokemon } from '../../store/useGameStore';
import { Sword, Shield, Zap, Heart, Activity } from 'lucide-react';

interface DraftCardProps {
    pokemon: BattlePokemon;
    onSelect: () => void;
    loading?: boolean;
}

const DraftCard: React.FC<DraftCardProps> = ({ pokemon, onSelect, loading }) => {
    const { difficulty } = useGameStore();

    // Dynamic styles based on difficulty
    const difficultyStyles = {
        EASY: {
            hoverBorder: 'hover:border-green-500',
            selectHover: 'group-hover:text-green-400 group-hover:border-green-400'
        },
        NORMAL: {
            hoverBorder: 'hover:border-yellow-400',
            selectHover: 'group-hover:text-yellow-400 group-hover:border-yellow-400'
        },
        HARD: {
            hoverBorder: 'hover:border-red-500',
            selectHover: 'group-hover:text-red-500 group-hover:border-red-500'
        }
    };

    const style = difficultyStyles[difficulty as keyof typeof difficultyStyles] || difficultyStyles.NORMAL;

    // Standard Type Hex Codes
    const typeColours: Record<string, string> = {
        normal: '#A8A77A',
        fire: '#EE8130',
        water: '#6390F0',
        electric: '#F7D02C',
        grass: '#7AC74C',
        ice: '#96D9D6',
        fighting: '#C22E28',
        poison: '#A33EA1',
        ground: '#E2BF65',
        flying: '#A98FF3',
        psychic: '#F95587',
        bug: '#A6B91A',
        rock: '#B6A136',
        ghost: '#735797',
        dragon: '#6F35FC',
        dark: '#705746',
        steel: '#B7B7CE',
        fairy: '#D685AD',
    };

    return (
        <div
            onClick={!loading ? onSelect : undefined}
            className={`
        relative group cursor-pointer 
        w-full max-w-sm rounded-xl overflow-hidden 
        border-2 border-slate-700 bg-slate-800/50 
        ${style.hoverBorder} hover:bg-slate-800 
        transition-all duration-300 transform hover:scale-105
        ${loading ? 'opacity-50 pointer-events-none' : ''}
      `}
        >
            {/* Background Gradient based on type */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10" />

            {/* Image Container */}
            <div className="relative h-64 w-full flex items-center justify-center p-6 bg-slate-900/30">
                <img
                    src={pokemon.spriteUrl}
                    alt={pokemon.name}
                    className="h-full w-full object-contain filter drop-shadow-lg animate-float"
                />
                {/* Type Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {pokemon.types.map((type) => (
                        <span
                            key={type}
                            style={{ backgroundColor: typeColours[type.toLowerCase()] || '#777' }}
                            className="px-2 py-1 text-xs font-black uppercase tracking-wider text-white rounded backdrop-blur-sm border border-white/20 shadow-sm text-shadow-sm"
                        >
                            {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* Info Section */}
            <div className="p-6">
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">
                    {pokemon.name}
                </h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="font-mono">{pokemon.maxHp} HP</span>
                    </div>
                    {pokemon.stats.map((stat) => {
                        if (stat.name === 'attack') return (
                            <div key={stat.name} className="flex items-center gap-2 text-slate-300">
                                <Sword className="w-4 h-4 text-orange-400" />
                                <span className="font-mono">{stat.value} ATK</span>
                            </div>
                        );
                        if (stat.name === 'defense') return (
                            <div key={stat.name} className="flex items-center gap-2 text-slate-300">
                                <Shield className="w-4 h-4 text-blue-400" />
                                <span className="font-mono">{stat.value} DEF</span>
                            </div>
                        );
                        if (stat.name === 'speed') return (
                            <div key={stat.name} className="flex items-center gap-2 text-slate-300">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="font-mono">{stat.value} SPD</span>
                            </div>
                        );
                        if (stat.name === 'special-attack') return (
                            <div key={stat.name} className="flex items-center gap-2 text-slate-300">
                                <Sword className="w-4 h-4 text-pink-400" />
                                <span className="font-mono">{stat.value} SPA</span>
                            </div>
                        );
                        if (stat.name === 'special-defense') return (
                            <div key={stat.name} className="flex items-center gap-2 text-slate-300">
                                <Shield className="w-4 h-4 text-teal-400" />
                                <span className="font-mono">{stat.value} SPD</span>
                            </div>
                        );
                        return null;
                    })}
                    <div className="flex items-center gap-2 text-slate-300">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="font-mono">BST: {pokemon.stats.reduce((a, b) => a + b.value, 0)}</span>
                    </div>
                </div>

                {/* Select Button Hint */}
                <div className={`mt-6 w-full py-2 text-center rounded border border-dashed border-slate-600 text-slate-400 ${style.selectHover} transition-colors`}>
                    SELECT UNIT
                </div>
            </div>
        </div>
    );
};

export default DraftCard;