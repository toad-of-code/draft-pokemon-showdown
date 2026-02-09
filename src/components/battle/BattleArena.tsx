import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { BattlePokemon, BattleMove } from '../../store/useGameStore';
import { calculateDamage } from '../../utils/battleLogic';
import Sprite from './Sprite';
import NeuralLink from './NeuralLink';
import { X, CircleDot, ArrowLeft, RefreshCw, Sword } from 'lucide-react';
import { generateBattleThought } from '../../api/geminiAgent';
import physicalIcon from '../../assets/physical_move_icon_by_jormxdos_dfgb60u-fullview.png';
import specialIcon from '../../assets/special_move_icon_by_jormxdos_dfgb60n-fullview.png';

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

    // Difficulty Color Mapping
    const difficultyColors = {
        EASY: { text: 'text-green-400', border: 'border-green-500', shadow: 'shadow-green-500/20', bg: 'bg-green-500/10' },
        NORMAL: { text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-yellow-500/20', bg: 'bg-yellow-500/10' },
        HARD: { text: 'text-red-500', border: 'border-red-600', shadow: 'shadow-red-500/20', bg: 'bg-red-500/10' }
    };
    const diffStyle = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.NORMAL;

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
        // Prevent moves if either is already dead (Fresh Check)
        if (attacker.currentHp <= 0 || defender.currentHp <= 0) return;

        if (move.accuracy !== null) {
            const accuracyRoll = Math.random() * 100;
            if (accuracyRoll > move.accuracy) {
                addLog(`${attacker.name}'s attack missed!`);
                return;
            }
        }

        addLog(`${attacker.name} used ${move.name}!`);

        if (isUserAttacker) setIsUserAttacking(true);
        else setIsBotAttacking(true);

        await new Promise(r => setTimeout(r, 400));

        if (isUserAttacker) setIsUserAttacking(false);
        else setIsBotAttacking(false);

        await new Promise(r => setTimeout(r, 100));

        const result = calculateDamage(attacker, defender, move);

        let finalDamage = result.damage;
        if (!isUserAttacker) {
            if (difficulty === 'EASY') finalDamage = Math.floor(result.damage * 0.7);
            else if (difficulty === 'HARD') finalDamage = Math.floor(result.damage * 1.3);
        }

        if (result.critical) addLog("Critical Hit!");
        if (result.effectiveness > 1) addLog("It's super effective!");
        if (result.effectiveness < 1 && result.effectiveness > 0) addLog("It's not very effective...");
        if (result.effectiveness === 0) addLog("It had no effect...");

        const newHp = Math.max(0, defender.currentHp - finalDamage);
        updatePokemonHp(defender.id, newHp);

        const percentDmg = Math.floor((finalDamage / defender.maxHp) * 100);
        addLog(`(Target took ${percentDmg}% damage)`);
    };

    const getSpeed = (pokemon: BattlePokemon): number => {
        return pokemon.stats.find(s => s.name === 'speed')?.value || 50;
    };

    const handleUserMove = async (move: BattleMove) => {
        if (turnState !== 'USER_TURN') return;
        setTurnState('PROCESSING');

        const userSpeed = getSpeed(userMon);
        const botSpeed = getSpeed(botMon);
        const userGoesFirst = userSpeed > botSpeed || (userSpeed === botSpeed && Math.random() > 0.5);

        if (userGoesFirst) {
            addLog(`${userMon.name} outspeeds! (SPD: ${userSpeed} vs ${botSpeed})`);
            await executeMove(userMon, botMon, move, true);

            // FIX: Check FRESH state from store, not the stale 'botMon' variable
            const freshBot = useGameStore.getState().botTeam[activeBotIndex];
            if (freshBot && freshBot.currentHp > 0) {
                setTimeout(() => {
                    setTurnState('BOT_TURN');
                    triggerBotTurn();
                }, 1000);
            } else {
                setTurnState('USER_TURN');
            }
        } else {
            addLog(`Enemy ${botMon.name} outspeeds! (SPD: ${botSpeed} vs ${userSpeed})`);
            const botMove = botMon.moves[Math.floor(Math.random() * botMon.moves.length)];
            const thought = await generateBattleThought(botMon.name, userMon.name, botMove.name);
            addLog(`[NEURAL LINK]: ${thought}`);
            await executeMove(botMon, userMon, botMove, false);

            // FIX: Check FRESH state for user pokemon as well
            const freshUser = useGameStore.getState().userTeam[activeUserIndex];
            if (freshUser && freshUser.currentHp > 0) {
                await new Promise(r => setTimeout(r, 500));
                // We must also use the fresh reference for the attacker
                await executeMove(freshUser, botMon, move, true);

                // Re-check bot health after retaliation
                const freshBotAfter = useGameStore.getState().botTeam[activeBotIndex];
                if (freshBotAfter && freshBotAfter.currentHp > 0) {
                    setTimeout(() => setTurnState('USER_TURN'), 1000);
                } else {
                    setTurnState('USER_TURN');
                }
            } else {
                setTurnState('USER_TURN');
            }
        }
    };

    const triggerBotTurn = async (overrideUserIndex?: number) => {
        addLog("Enemy AI analyzing tactical options...");
        await new Promise(r => setTimeout(r, 1500));

        // FIX: Get FRESH bot reference
        const freshBot = useGameStore.getState().botTeam[activeBotIndex];

        // Double check liveliness before acting
        if (!freshBot || freshBot.currentHp <= 0) return;

        const targetUserIndex = overrideUserIndex !== undefined ? overrideUserIndex : activeUserIndex;
        // FIX: Get FRESH user reference
        const freshUser = useGameStore.getState().userTeam[targetUserIndex];

        if (!freshUser || freshUser.currentHp <= 0) return;

        const randomMove = freshBot.moves[Math.floor(Math.random() * freshBot.moves.length)];
        const thought = await generateBattleThought(freshBot.name, freshUser.name, randomMove.name);
        addLog(`[NEURAL LINK]: ${thought}`);

        await executeMove(freshBot, freshUser, randomMove, false);
        setTurnState('USER_TURN');
    };

    const handleSwitch = (newIndex: number) => {
        if (turnState !== 'USER_TURN') return;
        if (newIndex === activeUserIndex || userTeam[newIndex].currentHp <= 0) return;

        setTurnState('PROCESSING');
        addLog(`${userMon.name} returned! Go ${userTeam[newIndex].name}!`);
        setActiveUserIndex(newIndex);
        setShowSwitchModal(false);

        setTimeout(() => {
            setTurnState('BOT_TURN');
            triggerBotTurn(newIndex);
        }, 1000);
    };

    const getCategoryIcon = (category: string) => {
        if (category === 'physical') return <img src={physicalIcon} alt="Physical" className="w-8 h-8 object-contain opacity-90" />;
        if (category === 'special') return <img src={specialIcon} alt="Special" className="w-8 h-8 object-contain opacity-90" />;
        return <CircleDot className="w-6 h-6 opacity-70" />;
    };

    if (!userMon || !botMon) return <div className="text-white">Loading Arena...</div>;

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col text-slate-200 font-sans overflow-hidden relative">

            {/* 0. FULL SCREEN BACKGROUND LAYER */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 transition-all duration-1000 ease-in-out"
                style={{ backgroundImage: `url('${battleBg}')` }}
            />
            <div className="fixed inset-0 bg-black/40 z-0" />

            {/* Content Wrapper (z-10 to sit above background) */}
            <div className="relative z-10 flex flex-col h-full">

                {/* 1. BATTLE FIELD */}
                <div className="flex-1 relative">
                    <div className={`absolute top-4 left-4 z-20 px-4 py-1.5 rounded-full border ${diffStyle.border} ${diffStyle.bg} backdrop-blur-md shadow-lg flex items-center gap-2`}>
                        <div className={`w-2 h-2 rounded-full ${diffStyle.bg.replace('/10', '')} animate-pulse`} />
                        <span className={`font-black text-xs tracking-[0.2em] uppercase ${diffStyle.text}`}>
                            Mode: {difficulty}
                        </span>
                    </div>

                    {/* OPPONENT */}
                    <div className="absolute top-[15%] right-[10%] z-10 flex flex-col items-end">
                        <div className="bg-slate-900/90 border border-slate-600 rounded-lg p-2 mb-2 w-64 shadow-lg transform translate-x-4">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-lg">{botMon.name}</span>
                                <span className="text-xs text-slate-400">L100</span>
                            </div>
                            <div className="flex gap-1 mb-1 justify-end">
                                {botMon.types.map(t => (
                                    <span key={t} style={{ backgroundColor: typeColours[t.toLowerCase()] }} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <HPBar pokemon={botMon} />
                            <TeamHealthIndicator team={botTeam} />
                        </div>
                        <div className="relative">
                            <div className="w-56 h-16 bg-black/40 rounded-[100%] absolute bottom-2 blur-md transform scale-x-125 skew-x-12" />
                            <Sprite
                                src={botMon.spriteUrl}
                                alt={botMon.name}
                                className={`w-48 h-48 object-contain relative z-10 drop-shadow-2xl transition-transform duration-300 ${isBotAttacking ? '-translate-x-32 translate-y-16' : ''}`}
                            />
                        </div>
                    </div>

                    {/* PLAYER */}
                    <div className="absolute bottom-[5%] left-[10%] z-20 flex flex-col items-start h-[300px] justify-end">
                        <div className="relative mb-4">
                            <div className="w-64 h-20 bg-black/40 rounded-[100%] absolute bottom-2 blur-md transform scale-x-125 -skew-x-12" />
                            <Sprite
                                src={userMon.spriteUrl}
                                alt={userMon.name}
                                isBack
                                className={`w-64 h-64 object-contain relative z-10 drop-shadow-2xl transition-transform duration-300 ${isUserAttacking ? 'translate-x-32 -translate-y-16' : ''}`}
                            />
                        </div>
                        <div className="bg-slate-900/90 border border-slate-600 rounded-lg p-3 w-72 shadow-lg transform -translate-x-4">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-xl">{userMon.name}</span>
                                <span className="text-xs text-slate-400">L100</span>
                            </div>
                            <div className="flex gap-1 mb-1">
                                {userMon.types.map(t => (
                                    <span key={t} style={{ backgroundColor: typeColours[t.toLowerCase()] }} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <HPBar pokemon={userMon} showNumbers />
                            <div className="flex justify-start"> {/* Align player indicators to left */}
                                <TeamHealthIndicator team={userTeam} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CONTROLS CONSOLE */}
                <div className="h-[320px] bg-slate-950/95 backdrop-blur-md flex border-t border-slate-700 shadow-2xl z-30">
                    <div className="flex-1 p-6 relative flex flex-col">
                        <div className="absolute inset-0 bg-slate-900/50 skew-x-12 -ml-20 w-1/2 opacity-20 pointer-events-none" />

                        {/* Prompt */}
                        <div className={`mb-4 text-xl font-bold text-white tracking-wide border-l-4 ${diffStyle.border} pl-4 h-10 flex items-center bg-black/20`}>
                            {turnState === 'USER_TURN'
                                ? `What will ${userMon.name} do?`
                                : turnState === 'BOT_TURN'
                                    ? `Waiting for ${botMon.name}...`
                                    : turnState === 'GAME_OVER'
                                        ? 'COMBAT ENDED'
                                        : 'Processing...'}
                        </div>

                        {/* --- MAIN MENU MODE --- */}
                        {menuMode === 'MAIN' && (
                            <div className="grid grid-cols-2 gap-4 max-w-lg h-full max-h-[160px]">
                                <button
                                    disabled={turnState !== 'USER_TURN'}
                                    onClick={() => setMenuMode('FIGHT')}
                                    className={`
                                    rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                                    flex flex-col items-center justify-center gap-2
                                    ${turnState === 'USER_TURN'
                                            ? 'bg-red-600 border-red-800 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                                            : 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed'}
                                `}
                                >
                                    <Sword className="w-8 h-8" />
                                    <span className="font-black text-2xl uppercase tracking-wider">FIGHT</span>
                                </button>

                                <button
                                    disabled={turnState !== 'USER_TURN' || userTeam.filter(p => p.currentHp > 0).length <= 1}
                                    onClick={() => setMenuMode('PKMN')}
                                    className={`
                                    rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                                    flex flex-col items-center justify-center gap-2
                                    ${turnState === 'USER_TURN' && userTeam.filter(p => p.currentHp > 0).length > 1
                                            ? 'bg-cyan-600 border-cyan-800 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/50'
                                            : 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed'}
                                `}
                                >
                                    <RefreshCw className="w-8 h-8" />
                                    <span className="font-black text-2xl uppercase tracking-wider">PKMN</span>
                                </button>
                            </div>
                        )}

                        {/* --- FIGHT MODE (MOVES) --- */}
                        {menuMode === 'FIGHT' && (
                            <div className="flex flex-col h-full">
                                <button
                                    onClick={() => setMenuMode('MAIN')}
                                    className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2 w-fit px-2 py-1 hover:bg-white/10 rounded"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Menu
                                </button>

                                <div className="grid grid-cols-2 gap-3 max-w-3xl flex-1">
                                    {userMon.moves.map((move, idx) => {
                                        const typeColor = typeColours[move.type.toLowerCase()] || '#A8A77A';

                                        return (
                                            <button
                                                key={idx}
                                                disabled={turnState !== 'USER_TURN'}
                                                onClick={() => { handleUserMove(move); setMenuMode('MAIN'); }}
                                                style={{ backgroundColor: typeColor }}
                                                className={`
                                                relative overflow-hidden group rounded-lg border-2 border-black/20
                                                transition-all duration-200 shadow-md text-left
                                                ${turnState === 'USER_TURN'
                                                        ? 'hover:scale-[1.02] hover:shadow-lg hover:brightness-110 cursor-pointer'
                                                        : 'opacity-50 grayscale cursor-not-allowed'}
                                            `}
                                            >
                                                {/* Button Content */}
                                                <div className="relative z-10 p-3 flex flex-col justify-between h-full">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-black text-white text-lg drop-shadow-md uppercase tracking-tight">
                                                            {move.name}
                                                        </span>
                                                        <div className="p-1 bg-black/20 rounded-full backdrop-blur-sm">
                                                            {getCategoryIcon(move.category)}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-end mt-2">
                                                        <span className="px-2 py-0.5 bg-black/30 rounded text-xs font-bold text-white/90 backdrop-blur-md uppercase border border-white/10">
                                                            {move.type}
                                                        </span>
                                                        <div className="text-xs font-mono text-white/90 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                                                            POW: {move.power || '-'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Shine Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- PKMN MODE (SWITCHING) --- */}
                        {menuMode === 'PKMN' && (
                            <div className="flex flex-col h-full">
                                <button
                                    onClick={() => setMenuMode('MAIN')}
                                    className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2 w-fit px-2 py-1 hover:bg-white/10 rounded"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Menu
                                </button>
                                <div className="grid grid-cols-3 gap-3 max-w-2xl flex-1">
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
                                                p-2 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center
                                                ${isActive ? 'border-yellow-500 bg-yellow-500/20' :
                                                        isFainted ? 'border-slate-800 bg-slate-900 opacity-50' :
                                                            'border-cyan-600 bg-slate-800 hover:border-cyan-400 hover:bg-slate-700'}
                                            `}
                                            >
                                                <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-10 h-10 object-contain" />
                                                <span className="text-xs font-bold truncate w-full mt-1">{pokemon.name}</span>
                                                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                                        style={{ width: `${hpPercent}%` }}
                                                    />
                                                </div>
                                                {isActive && <span className="text-[9px] text-yellow-400 mt-0.5">ACTIVE</span>}
                                                {isFainted && <span className="text-[9px] text-red-400 mt-0.5">FAINTED</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: BATTLE LOG */}
                    <div className={`w-[400px] border-l-2 ${diffStyle.border} bg-black/80 flex flex-col relative shadow-[-10px_0_20px_rgba(0,0,0,0.5)]`}>
                        <div className={`bg-slate-900 text-slate-400 text-xs px-3 py-1 font-mono uppercase tracking-widest border-b border-slate-800 flex justify-between items-center z-10`}>
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
                        <div className="p-2 border-t border-slate-800 bg-slate-950 z-10">
                            <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
                                <span className={`pointer-events-none ${diffStyle.text}`}>{'>'}</span>
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
                            {/* ... (Modal Content) ... */}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

const HPBar: React.FC<{ pokemon: BattlePokemon, showNumbers?: boolean }> = ({ pokemon, showNumbers }) => {
    const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;
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

const TeamHealthIndicator: React.FC<{ team: BattlePokemon[] }> = ({ team }) => {
    return (
        <div className="flex gap-1.5 mt-2 justify-end">
            {team.map((p) => {
                const hpPercent = (p.currentHp / p.maxHp) * 100;
                let colorClass = 'bg-slate-800 border-slate-700'; // Dead/Fainted

                if (hpPercent > 50) colorClass = 'bg-green-500 border-green-600 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
                else if (hpPercent > 20) colorClass = 'bg-yellow-400 border-yellow-500 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
                else if (hpPercent > 0) colorClass = 'bg-red-500 border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.6)]';

                return (
                    <div
                        key={p.id}
                        className={`w-3.5 h-3.5 rounded-full border ${colorClass} transition-all duration-500`}
                        title={`${p.name}: ${Math.ceil(p.currentHp)}/${p.maxHp}`}
                    />
                );
            })}
        </div>
    );
};

export default BattleArena;