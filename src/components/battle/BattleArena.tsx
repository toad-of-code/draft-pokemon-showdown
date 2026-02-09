import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { BattlePokemon, BattleMove } from '../../store/useGameStore';
import { calculateDamage } from '../../utils/battleLogic';
import Sprite from './Sprite';
import NeuralLink from './NeuralLink';
import { X } from 'lucide-react';
import { generateBattleThought } from '../../api/geminiAgent';

const BattleArena: React.FC = () => {
    const {
        userTeam, botTeam, difficulty,
        updatePokemonHp, addLog, setGamePhase,
    } = useGameStore();

    const [activeUserIndex, setActiveUserIndex] = useState(0);
    const [activeBotIndex, setActiveBotIndex] = useState(0);
    const [turnState, setTurnState] = useState<'USER_TURN' | 'BOT_TURN' | 'PROCESSING' | 'GAME_OVER'>('USER_TURN');
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [isUserAttacking, setIsUserAttacking] = useState(false);
    const [isBotAttacking, setIsBotAttacking] = useState(false);
    const [menuMode, setMenuMode] = useState<'MAIN' | 'FIGHT' | 'PKMN'>('MAIN');

    // Random battle background
    const [battleBg] = useState(() => {
        const bgs = ['/bgs/images.jpg', '/bgs/DVMT-6OXcAE2rZY.jpg.afab972f972bd7fbd4253bc7aa1cf27f.jpg'];
        return bgs[Math.floor(Math.random() * bgs.length)];
    });

    const userMon = userTeam[activeUserIndex];
    const botMon = botTeam[activeBotIndex];

    // Check Win/Loss conditions
    useEffect(() => {
        const userAlive = userTeam.some(p => p.currentHp > 0);
        const botAlive = botTeam.some(p => p.currentHp > 0);

        if (!userAlive) {
            setTurnState('GAME_OVER');
            addLog("CRITICAL FAILURE: All units neutralized.");
            setTimeout(() => setGamePhase('RESULT'), 3000);
        } else if (!botAlive) {
            setTurnState('GAME_OVER');
            addLog("MISSION ACCOMPLISHED: Opponent neutralized.");
            setTimeout(() => setGamePhase('RESULT'), 3000);
        }
    }, [userTeam, botTeam, addLog, setGamePhase]);

    // Handle Fainted Units
    useEffect(() => {
        if (userMon && userMon.currentHp <= 0 && turnState !== 'GAME_OVER') {
            const nextIndex = userTeam.findIndex(p => p.currentHp > 0);
            if (nextIndex !== -1) {
                addLog(`${userMon.name} has fallen! Sending out ${userTeam[nextIndex].name}...`);
                setTimeout(() => setActiveUserIndex(nextIndex), 1000);
            }
        }
        if (botMon && botMon.currentHp <= 0 && turnState !== 'GAME_OVER') {
            const nextIndex = botTeam.findIndex(p => p.currentHp > 0);
            if (nextIndex !== -1) {
                addLog(`Enemy ${botMon.name} destroyed! Detected ${botTeam[nextIndex].name} entering field...`);
                setTimeout(() => setActiveBotIndex(nextIndex), 1000);
            }
        }
    }, [userMon, botMon, userTeam, botTeam, turnState, addLog]);


    const executeMove = async (attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove, isUserAttacker: boolean) => {
        addLog(`${attacker.name} used ${move.name}!`);

        // Trigger attack animation
        if (isUserAttacker) {
            setIsUserAttacking(true);
        } else {
            setIsBotAttacking(true);
        }

        // Wait for animation
        await new Promise(r => setTimeout(r, 400));

        // Reset animation
        if (isUserAttacker) {
            setIsUserAttacking(false);
        } else {
            setIsBotAttacking(false);
        }

        await new Promise(r => setTimeout(r, 100));

        const result = calculateDamage(attacker, defender, move);

        // EASY mode: Bot deals less damage, has miss chance
        let finalDamage = result.damage;
        if (difficulty === 'EASY' && !isUserAttacker) {
            // Bot has 15% chance to miss in EASY mode
            if (Math.random() < 0.15) {
                addLog(`${attacker.name}'s attack missed!`);
                return;
            }
            // Bot deals only 70% damage
            finalDamage = Math.floor(result.damage * 0.7);
        }

        // Critical Hit?
        if (result.critical) addLog("Critical Hit!");

        // Effectiveness?
        if (result.effectiveness > 1) addLog("It's super effective!");
        if (result.effectiveness < 1 && result.effectiveness > 0) addLog("It's not very effective...");
        if (result.effectiveness === 0) addLog("It had no effect...");

        const newHp = Math.max(0, defender.currentHp - finalDamage);
        updatePokemonHp(defender.id, newHp);

        // Log damage percentage approx
        const percentDmg = Math.floor((result.damage / defender.maxHp) * 100);
        addLog(`(Target took ${percentDmg}% structural damage)`);
    };

    const getSpeed = (pokemon: BattlePokemon): number => {
        return pokemon.stats.find(s => s.name === 'speed')?.value || 50;
    };

    const handleUserMove = async (move: BattleMove) => {
        if (turnState !== 'USER_TURN') return;
        setTurnState('PROCESSING');

        const userSpeed = getSpeed(userMon);
        const botSpeed = getSpeed(botMon);

        // Speed tie = random, otherwise faster goes first
        const userGoesFirst = userSpeed > botSpeed || (userSpeed === botSpeed && Math.random() > 0.5);

        if (userGoesFirst) {
            // User attacks first
            addLog(`${userMon.name} outspeeds! (SPD: ${userSpeed} vs ${botSpeed})`);
            await executeMove(userMon, botMon, move, true);

            // Bot retaliates if still alive
            if (botMon.currentHp > 0) {
                setTimeout(() => {
                    setTurnState('BOT_TURN');
                    triggerBotTurn();
                }, 1000);
            } else {
                setTurnState('USER_TURN');
            }
        } else {
            // Bot attacks first!
            addLog(`Enemy ${botMon.name} outspeeds! (SPD: ${botSpeed} vs ${userSpeed})`);

            // Bot picks a random move and attacks first
            const botMove = botMon.moves[Math.floor(Math.random() * botMon.moves.length)];
            const thought = await generateBattleThought(botMon.name, userMon.name, botMove.name);
            addLog(`[NEURAL LINK]: ${thought}`);
            await executeMove(botMon, userMon, botMove, false);

            // Re-check user HP from store (userMon is stale reference)
            const currentUserMon = userTeam[activeUserIndex];
            if (currentUserMon.currentHp > 0) {
                await new Promise(r => setTimeout(r, 500));
                await executeMove(currentUserMon, botMon, move, true);

                // Bot's next turn if it survives
                if (botMon.currentHp > 0) {
                    setTimeout(() => {
                        setTurnState('USER_TURN');
                    }, 1000);
                } else {
                    setTurnState('USER_TURN');
                }
            } else {
                // User fainted, will be handled by useEffect
                setTurnState('USER_TURN');
            }
        }
    };

    const triggerBotTurn = async (overrideUserIndex?: number) => {
        // Bot "Thinking" Simulation
        addLog("Enemy AI analyzing tactical options...");
        await new Promise(r => setTimeout(r, 1500));

        if (botTeam[activeBotIndex].currentHp <= 0) return; // Verify bot still alive

        const activeBot = botTeam[activeBotIndex];
        // Use override index if provided (for after switch), otherwise use current
        const targetUserIndex = overrideUserIndex !== undefined ? overrideUserIndex : activeUserIndex;
        const activeUser = userTeam[targetUserIndex];

        if (!activeUser || activeUser.currentHp <= 0) return; // Verify user still alive

        const randomMove = activeBot.moves[Math.floor(Math.random() * activeBot.moves.length)];

        // Generate thought
        const thought = await generateBattleThought(activeBot.name, activeUser.name, randomMove.name);
        addLog(`[NEURAL LINK]: ${thought}`);

        await executeMove(activeBot, activeUser, randomMove, false);

        setTurnState('USER_TURN');
    };

    const handleSwitch = (newIndex: number) => {
        if (turnState !== 'USER_TURN') return; // Can only switch on user's turn
        if (newIndex === activeUserIndex || userTeam[newIndex].currentHp <= 0) return;

        setTurnState('PROCESSING'); // Block further input
        addLog(`${userMon.name} returned! Go ${userTeam[newIndex].name}!`);
        setActiveUserIndex(newIndex);
        setShowSwitchModal(false);

        // Switching costs a turn - bot attacks after
        // Pass newIndex so bot attacks the NEW pokemon, not the old one
        setTimeout(() => {
            setTurnState('BOT_TURN');
            triggerBotTurn(newIndex);
        }, 1000);
    };

    if (!userMon || !botMon) return <div className="text-white">Loading Arena...</div>;

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col text-slate-200 font-sans overflow-hidden">

            {/* 1. BATTLE FIELD (Top 70%) */}
            <div className="flex-1 relative border-b-4 border-slate-950 shadow-inner overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('${battleBg}')` }}
                />
                {/* Dark overlay for better visibility */}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

                {/* --- OPPONENT (Top Right) --- */}
                <div className="absolute top-[15%] right-[10%] z-10 flex flex-col items-end">
                    {/* HUD */}
                    <div className="bg-slate-900/90 border border-slate-600 rounded-lg p-2 mb-2 w-64 shadow-lg transform translate-x-4">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-lg">{botMon.name}</span>
                            <span className="text-xs text-slate-400">L100</span>
                        </div>
                        <HPBar pokemon={botMon} />
                    </div>
                    {/* Sprite Platform & Sprite */}
                    <div className="relative">
                        <div className="w-56 h-16 bg-black/40 rounded-[100%] absolute bottom-2 blur-md transform scale-x-125 skew-x-12" />
                        <Sprite
                            src={botMon.spriteUrl}
                            alt={botMon.name}
                            className={`w-48 h-48 object-contain relative z-10 drop-shadow-2xl transition-transform duration-300 ${isBotAttacking ? '-translate-x-32 translate-y-16' : ''}`}
                        />
                    </div>
                </div>

                {/* --- PLAYER (Bottom Left) --- */}
                <div className="absolute bottom-[5%] left-[10%] z-20 flex flex-col items-start h-[300px] justify-end">
                    {/* Sprite Platform & Sprite */}
                    <div className="relative mb-4">
                        <div className="w-64 h-20 bg-black/40 rounded-[100%] absolute bottom-2 blur-md transform scale-x-125 -skew-x-12" />
                        <Sprite
                            src={userMon.spriteUrl}
                            alt={userMon.name}
                            isBack
                            className={`w-64 h-64 object-contain relative z-10 drop-shadow-2xl transition-transform duration-300 ${isUserAttacking ? 'translate-x-32 -translate-y-16' : ''}`}
                        />
                    </div>
                    {/* HUD */}
                    <div className="bg-slate-900/90 border border-slate-600 rounded-lg p-3 w-72 shadow-lg transform -translate-x-4">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-xl">{userMon.name}</span>
                            <span className="text-xs text-slate-400">L100</span>
                        </div>
                        <HPBar pokemon={userMon} showNumbers />
                    </div>
                </div>
            </div>

            {/* 2. CONTROLS CONSOLE (Bottom 30%) */}
            <div className="h-[320px] bg-slate-950 flex border-t border-slate-700 shadow-2xl z-30">

                {/* LEFT: ACTION PANEL */}
                <div className="flex-1 p-6 relative flex flex-col">
                    <div className="absolute inset-0 bg-slate-900/50 skew-x-12 -ml-20 w-1/2 opacity-20 pointer-events-none" />

                    {/* Message / Prompt */}
                    <div className="mb-4 text-xl font-bold text-white tracking-wide border-l-4 border-yellow-500 pl-4 h-10 flex items-center bg-black/20">
                        {turnState === 'USER_TURN'
                            ? `What will ${userMon.name} do?`
                            : turnState === 'BOT_TURN'
                                ? `Waiting for ${botMon.name}...`
                                : turnState === 'GAME_OVER'
                                    ? 'COMBAT ENDED'
                                    : 'Processing...'}
                    </div>

                    {/* Main Menu / Fight / PKMN conditional rendering */}
                    {menuMode === 'MAIN' && (
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                            {/* FIGHT Button */}
                            <button
                                disabled={turnState !== 'USER_TURN'}
                                onClick={() => setMenuMode('FIGHT')}
                                className={`
                                    p-6 rounded-lg border-2 text-center transition-all duration-200
                                    flex flex-col items-center justify-center gap-2
                                    ${turnState === 'USER_TURN'
                                        ? 'bg-red-900/60 border-red-500 hover:bg-red-800 hover:border-red-400 hover:-translate-y-1 shadow-lg hover:shadow-red-500/30'
                                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed grayscale'}
                                `}
                            >
                                <span className="font-black text-2xl uppercase tracking-tight">FIGHT</span>
                            </button>

                            {/* PKMN Button */}
                            <button
                                disabled={turnState !== 'USER_TURN' || userTeam.filter(p => p.currentHp > 0).length <= 1}
                                onClick={() => setMenuMode('PKMN')}
                                className={`
                                    p-6 rounded-lg border-2 text-center transition-all duration-200
                                    flex flex-col items-center justify-center gap-2
                                    ${turnState === 'USER_TURN' && userTeam.filter(p => p.currentHp > 0).length > 1
                                        ? 'bg-cyan-900/60 border-cyan-500 hover:bg-cyan-800 hover:border-cyan-400 hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/30'
                                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed grayscale'}
                                `}
                            >
                                <span className="font-black text-2xl uppercase tracking-tight">PKMN</span>
                            </button>
                        </div>
                    )}

                    {/* FIGHT MODE: Show Moves */}
                    {menuMode === 'FIGHT' && (
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setMenuMode('MAIN')}
                                className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2"
                            >
                                ← Back
                            </button>
                            <div className="grid grid-cols-2 gap-2 max-w-2xl">
                                {userMon.moves.map((move, idx) => (
                                    <button
                                        key={idx}
                                        disabled={turnState !== 'USER_TURN'}
                                        onClick={() => { handleUserMove(move); setMenuMode('MAIN'); }}
                                        className={`
                                            relative overflow-hidden group
                                            p-3 rounded-md border text-left transition-all duration-200
                                            flex flex-col justify-center
                                            ${turnState === 'USER_TURN'
                                                ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-yellow-400 hover:-translate-y-1 hover:shadow-yellow-500/20 shadow-lg'
                                                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed grayscale'}
                                        `}
                                    >
                                        <div className="flex justify-between items-center z-10 relative">
                                            <span className="font-black text-lg uppercase tracking-tight">{move.name}</span>
                                            <span className="text-xs font-mono px-2 py-1 rounded bg-black/40 text-slate-300 border border-slate-700">{move.type}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 z-10 relative font-mono">
                                            POW: <span className="text-white">{move.power || '-'}</span> | ACC: <span className="text-white">{move.accuracy}%</span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PKMN MODE: Show Team for Switching */}
                    {menuMode === 'PKMN' && (
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setMenuMode('MAIN')}
                                className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2"
                            >
                                ← Back
                            </button>
                            <div className="grid grid-cols-3 gap-2 max-w-2xl">
                                {userTeam.map((pokemon, idx) => {
                                    const isActive = idx === activeUserIndex;
                                    const isFainted = pokemon.currentHp <= 0;
                                    const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;

                                    return (
                                        <button
                                            key={pokemon.id}
                                            disabled={isActive || isFainted}
                                            onClick={() => { handleSwitch(idx); setMenuMode('MAIN'); }}
                                            className={`
                                                p-2 rounded-lg border-2 text-center transition-all flex flex-col items-center
                                                ${isActive ? 'border-yellow-500 bg-yellow-500/20' :
                                                    isFainted ? 'border-slate-800 bg-slate-900 opacity-50' :
                                                        'border-cyan-600 bg-slate-800 hover:border-cyan-400 hover:bg-slate-700'}
                                            `}
                                        >
                                            <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-12 h-12 object-contain" />
                                            <span className="text-xs font-bold truncate w-full">{pokemon.name}</span>
                                            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={`h-full ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                                    style={{ width: `${hpPercent}%` }}
                                                />
                                            </div>
                                            {isActive && <span className="text-[10px] text-yellow-400">ACTIVE</span>}
                                            {isFainted && <span className="text-[10px] text-red-400">FAINTED</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: BATTLE LOG (The "Neural Link") */}
                <div className="w-[400px] border-l-2 border-slate-800 bg-black flex flex-col relative shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
                    <div className="bg-slate-900 text-slate-400 text-xs px-3 py-1 font-mono uppercase tracking-widest border-b border-slate-800 flex justify-between items-center z-10">
                        <span>Neural Link v2.0</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 opacity-50" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-50" />
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <NeuralLink />
                    </div>
                    {/* Fake Input */}
                    <div className="p-2 border-t border-slate-800 bg-slate-950 z-10">
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
                            <span className="text-yellow-500 pointer-events-none">{'>'}</span>
                            <span className="animate-pulse">_</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Switch Modal */}
            {showSwitchModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl max-w-2xl w-full p-6 relative shadow-2xl shadow-cyan-500/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white">Switch Pokémon</h2>
                            <button onClick={() => setShowSwitchModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {userTeam.map((pokemon, idx) => {
                                const isActive = idx === activeUserIndex;
                                const isFainted = pokemon.currentHp <= 0;
                                const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;

                                return (
                                    <button
                                        key={pokemon.id}
                                        disabled={isActive || isFainted}
                                        onClick={() => handleSwitch(idx)}
                                        className={`
                                            p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4
                                            ${isActive ? 'border-yellow-500 bg-yellow-500/20 cursor-default' :
                                                isFainted ? 'border-slate-800 bg-slate-900 opacity-50 cursor-not-allowed' :
                                                    'border-cyan-600 bg-slate-800 hover:border-cyan-400 hover:bg-slate-700 cursor-pointer'}
                                        `}
                                    >
                                        <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-16 h-16 object-contain" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-white text-lg">{pokemon.name}</span>
                                                {isActive && <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-bold">ACTIVE</span>}
                                                {isFainted && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold">FAINTED</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-400' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${hpPercent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {Math.ceil(pokemon.currentHp)}/{pokemon.maxHp}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HPBar: React.FC<{ pokemon: BattlePokemon, showNumbers?: boolean }> = ({ pokemon, showNumbers }) => {
    const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;

    // Showdown colors: Green > 50, Yellow > 20, Red <= 20
    const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-400' : 'bg-red-500';

    return (
        <div className="w-full">
            <div className="flex items-center gap-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                <div className="absolute left-1 text-[8px] font-bold text-slate-500 z-10 pointer-events-none">HP</div>
                <div className="flex-1 h-full relative ml-6">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${hpColor}`}
                        style={{ width: `${Math.max(0, hpPercent)}%` }}
                    />
                </div>
            </div>
            {showNumbers && (
                <div className="text-right text-xs font-mono text-slate-300 mt-1">
                    {Math.ceil(pokemon.currentHp)} / {pokemon.maxHp}
                </div>
            )}
        </div>
    );
}

export default BattleArena;
