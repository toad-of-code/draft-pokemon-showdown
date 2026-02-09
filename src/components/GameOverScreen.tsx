import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

const GameOverScreen: React.FC = () => {
    const { userTeam, botTeam, setGamePhase, resetGame } = useGameStore();

    const userAlive = userTeam.filter(p => p.currentHp > 0).length;
    const botAlive = botTeam.filter(p => p.currentHp > 0).length;
    const playerWon = userAlive > 0;

    const handlePlayAgain = () => {
        resetGame();
        setGamePhase('HOME');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
            <div className={`absolute inset-0 opacity-20 ${playerWon ? 'bg-gradient-to-t from-green-500/30 to-transparent' : 'bg-gradient-to-t from-red-500/30 to-transparent'}`} />

            {/* Main Content */}
            <div className="relative z-10 text-center">
                {/* Icon */}
                <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-8 ${playerWon ? 'bg-green-500/20 border-4 border-green-500' : 'bg-red-500/20 border-4 border-red-500'}`}>
                    {playerWon ? (
                        <Trophy className="w-16 h-16 text-green-400" />
                    ) : (
                        <Skull className="w-16 h-16 text-red-400" />
                    )}
                </div>

                {/* Title */}
                <h1 className={`text-6xl font-black mb-4 tracking-tight ${playerWon ? 'text-green-400' : 'text-red-400'}`}>
                    {playerWon ? 'VICTORY!' : 'DEFEAT'}
                </h1>
                <p className="text-2xl text-slate-400 mb-12">
                    {playerWon
                        ? 'You defeated the enemy team!'
                        : 'Your team has been defeated.'
                    }
                </p>

                {/* Stats */}
                <div className="flex gap-8 justify-center mb-12">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 min-w-[200px]">
                        <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Your Team</p>
                        <p className="text-3xl font-black text-cyan-400">{userAlive} / {userTeam.length}</p>
                        <p className="text-xs text-slate-500">Pokémon Remaining</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 min-w-[200px]">
                        <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Enemy Team</p>
                        <p className="text-3xl font-black text-red-400">{botAlive} / {botTeam.length}</p>
                        <p className="text-xs text-slate-500">Pokémon Remaining</p>
                    </div>
                </div>

                {/* Team Display */}
                <div className="flex gap-4 justify-center mb-12">
                    {userTeam.map((pokemon) => (
                        <div
                            key={pokemon.id}
                            className={`p-2 rounded-lg border ${pokemon.currentHp > 0 ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/50 opacity-50 grayscale'}`}
                        >
                            <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-16 h-16 object-contain" />
                            <p className="text-xs font-bold truncate max-w-[70px]">{pokemon.name}</p>
                        </div>
                    ))}
                </div>

                {/* Play Again Button */}
                <button
                    onClick={handlePlayAgain}
                    className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-xl uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/30 flex items-center gap-3 mx-auto"
                >
                    <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    Play Again
                </button>
            </div>
        </div>
    );
};

export default GameOverScreen;
