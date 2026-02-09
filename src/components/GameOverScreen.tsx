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

                {/* MVP Highlight */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-yellow-500 mb-4 uppercase tracking-widest">Match MVP</h3>
                    {(() => {
                        const allPokemon = [...userTeam, ...botTeam];
                        const mvp = allPokemon.reduce((prev, current) =>
                            (current.battleStats.kills > prev.battleStats.kills ||
                                (current.battleStats.kills === prev.battleStats.kills && current.battleStats.damageDealt > prev.battleStats.damageDealt))
                                ? current : prev
                            , allPokemon[0]);

                        return (
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-4 inline-flex items-center gap-4">
                                <img src={mvp.spriteUrl} alt={mvp.name} className="w-16 h-16 object-contain drop-shadow-lg" />
                                <div className="text-left">
                                    <p className="font-black text-white text-lg">{mvp.name}</p>
                                    <p className="text-yellow-400 text-sm font-mono">{mvp.battleStats.kills} Kills • {mvp.battleStats.damageDealt} Dmg</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Team Stats Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto w-full px-4">
                    {/* User Team Stats */}
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                        <h3 className="text-cyan-400 font-bold mb-4 border-b border-slate-800 pb-2">YOUR TEAM</h3>
                        <div className="space-y-3">
                            {userTeam.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-slate-800/30 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <img src={p.spriteUrl} className="w-8 h-8 opacity-75" />
                                        <span className={`text-sm font-bold ${p.currentHp === 0 ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{p.name}</span>
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 flex gap-3">
                                        <span title="Damage Dealt" className="text-green-400">dmg: {p.battleStats.damageDealt}</span>
                                        <span title="Damage Taken" className="text-red-400">taken: {p.battleStats.damageTaken}</span>
                                        <span title="Kills" className="text-yellow-400 px-1 border border-yellow-500/30 rounded bg-yellow-500/10">{p.battleStats.kills} K</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Enemy Team Stats */}
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                        <h3 className="text-red-400 font-bold mb-4 border-b border-slate-800 pb-2">ENEMY TEAM</h3>
                        <div className="space-y-3">
                            {botTeam.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-slate-800/30 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <img src={p.spriteUrl} className="w-8 h-8 opacity-75" />
                                        <span className={`text-sm font-bold ${p.currentHp === 0 ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{p.name}</span>
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 flex gap-3">
                                        <span title="Damage Dealt" className="text-green-400">dmg: {p.battleStats.damageDealt}</span>
                                        <span title="Damage Taken" className="text-red-400">taken: {p.battleStats.damageTaken}</span>
                                        <span title="Kills" className="text-yellow-400 px-1 border border-yellow-500/30 rounded bg-yellow-500/10">{p.battleStats.kills} K</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Display (Simple) - Keeping as footer */}
                <div className="flex gap-4 justify-center mb-12 opacity-50">
                    {userTeam.map((pokemon) => (
                        <div
                            key={pokemon.id}
                            className={`p-2 rounded-lg border ${pokemon.currentHp > 0 ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/50 grayscale'}`}
                        >
                            <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-10 h-10 object-contain" />
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
