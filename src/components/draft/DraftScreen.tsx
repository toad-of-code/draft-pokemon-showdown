import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { BattlePokemon, BattleMove } from '../../store/useGameStore';
import { fetchDraftPair, fetchPokemonWithMoves, type PokemonMove } from '../../api/pokeGraphql';
import { generateFakemonName } from '../../api/geminiAgent';
import { generateSpriteUrl } from '../../api/nanoBanana';
import DraftCard from './DraftCard';
import { X, Check, Shield, Zap, Skull } from 'lucide-react';
import physicalIcon from '../../assets/physical_move_icon_by_jormxdos_dfgb60u-fullview.png';
import specialIcon from '../../assets/special_move_icon_by_jormxdos_dfgb60n-fullview.png';
import statusIcon from '../../assets/status_move_icon_by_jormxdos_dfgb616-fullview.png';

const DraftScreen: React.FC = () => {
    const hasLoadedRef = useRef(false);
    const { addToUserTeam, setGamePhase, setBotTeam, difficulty, setDifficulty } = useGameStore();
    const [draftPair, setDraftPair] = useState<BattlePokemon[]>([]);
    const [loading, setLoading] = useState(false);
    const [draftCount, setDraftCount] = useState(0);

    // Move Selection State
    const [showMoveSelection, setShowMoveSelection] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<BattlePokemon | null>(null);
    const [movePool, setMovePool] = useState<BattleMove[]>([]);
    const [selectedMoves, setSelectedMoves] = useState<BattleMove[]>([]);

    // Track discarded Pokemon for bot team
    const [discardedTeam, setDiscardedTeam] = useState<BattlePokemon[]>([]);

    // Difficulty Color Mapping
    const difficultyColors = {
        EASY: {
            text: 'text-green-400',
            border: 'border-green-500',
            shadow: 'shadow-green-500/20',
            bg: 'bg-green-500/10',
            btnActive: 'bg-green-500 text-black',
            hover: 'hover:bg-green-500/20'
        },
        NORMAL: {
            text: 'text-yellow-400',
            border: 'border-yellow-500',
            shadow: 'shadow-yellow-500/20',
            bg: 'bg-yellow-500/10',
            btnActive: 'bg-yellow-500 text-black',
            hover: 'hover:bg-yellow-500/20'
        },
        HARD: {
            text: 'text-red-500',
            border: 'border-red-600',
            shadow: 'shadow-red-500/20',
            bg: 'bg-red-500/10',
            btnActive: 'bg-red-600 text-white',
            hover: 'hover:bg-red-500/20'
        }
    };

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

    const diffStyle = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.NORMAL;

    const loadNewPair = async () => {
        setLoading(true);
        try {
            // 1. Fetch 2 random base Pokemon with moves
            const basePair = await fetchDraftPair();

            if (basePair.length < 2) {
                console.error("Failed to fetch enough pokemon");
                setLoading(false);
                return;
            }

            // 2. Fetch full move data for these Pokemon
            const ids = basePair.map(p => p.id);
            const pairWithMoves = await fetchPokemonWithMoves(ids);

            // 3. Enhance them (AI Name + Sprite)
            const enhancedPair = await Promise.all(pairWithMoves.map(async (p) => {
                const aiName = await generateFakemonName(p.types[0], p.name);
                const spriteUrl = await generateSpriteUrl(p.name, p.id);

                const baseHp = p.stats.find((s: any) => s.name === 'hp')?.value || 50;
                const calculatedHp = baseHp + 60;

                return {
                    id: crypto.randomUUID(),
                    baseId: p.id,
                    name: aiName,
                    types: p.types,
                    stats: p.stats,
                    moves: [], // Will be selected by user
                    maxHp: calculatedHp,
                    currentHp: calculatedHp,
                    spriteUrl: spriteUrl,
                    isBot: false,
                    statusEffect: null,
                    statusTurns: 0,
                    learnset: p.moves || [], // Store the full learnset
                    battleStats: {
                        damageDealt: 0,
                        damageTaken: 0,
                        kills: 0
                    }
                } as BattlePokemon & { learnset: PokemonMove[] };
            }));

            setDraftPair(enhancedPair);
        } catch (error) {
            console.error("Error loading draft pair:", error);
        }
        setLoading(false);
    };

    const handleSelect = async (pokemon: BattlePokemon & { learnset?: PokemonMove[] }) => {
        // Convert PokemonMove[] to BattleMove[] and select up to 7
        const learnset = pokemon.learnset || [];

        const battleMoves: BattleMove[] = learnset
            .map(m => ({
                name: m.name,
                type: m.type,
                power: m.power || 0,
                accuracy: m.accuracy || 100,
                category: m.damageClass as 'physical' | 'special' | 'status',
                pp: m.pp || 15,
                currentPp: m.pp || 15
            }))
            .slice(0, 7); // Take top 7 moves

        setMovePool(battleMoves);
        setSelectedPokemon(pokemon);
        setSelectedMoves([]);
        setShowMoveSelection(true);
    };

    const toggleMoveSelection = (move: BattleMove) => {
        if (selectedMoves.find(m => m.name === move.name)) {
            setSelectedMoves(selectedMoves.filter(m => m.name !== move.name));
        } else if (selectedMoves.length < 4) {
            setSelectedMoves([...selectedMoves, move]);
        }
    };

    const confirmMoveSelection = async () => {
        if (!selectedPokemon || selectedMoves.length !== 4) return;

        const finalPokemon = { ...selectedPokemon, moves: selectedMoves };
        addToUserTeam(finalPokemon);

        // Find and prepare the discarded Pokemon (the one not selected)
        const discardedPokemon = draftPair.find(p => p.id !== selectedPokemon.id);
        let botPokemon: BattlePokemon | null = null;

        if (discardedPokemon) {
            // Give the discarded Pokemon 4 moves with diverse types for better coverage
            const learnset = (discardedPokemon as any).learnset || [];
            const battleMoves: BattleMove[] = learnset
                .map((m: any) => ({
                    name: m.name,
                    type: m.type,
                    power: m.power || 0,
                    accuracy: m.accuracy || 100,
                    category: m.damageClass as 'physical' | 'special' | 'status',
                    pp: m.pp || 15,
                    currentPp: m.pp || 15
                }))
                .filter((m: BattleMove) => m.power > 0); // Only damaging moves

            // Select moves with diverse types for better coverage
            const selectedBotMoves: BattleMove[] = [];
            const usedTypes = new Set<string>();

            // First pass: pick one move of each unique type (sorted by power)
            const sortedByPower = [...battleMoves].sort((a, b) => b.power - a.power);
            for (const move of sortedByPower) {
                if (selectedBotMoves.length >= 4) break;
                if (!usedTypes.has(move.type)) {
                    selectedBotMoves.push(move);
                    usedTypes.add(move.type);
                }
            }

            // Second pass: fill remaining slots with highest power moves
            for (const move of sortedByPower) {
                if (selectedBotMoves.length >= 4) break;
                if (!selectedBotMoves.find(m => m.name === move.name)) {
                    selectedBotMoves.push(move);
                }
            }

            const botMoves = selectedBotMoves.slice(0, 4);

            botPokemon = {
                ...discardedPokemon,
                id: crypto.randomUUID(),
                moves: botMoves,
                isBot: true,
                statusEffect: null,
                statusTurns: 0,
            };
            setDiscardedTeam(prev => [...prev, botPokemon!]);
        }

        const newCount = draftCount + 1;
        setDraftCount(newCount);
        setShowMoveSelection(false);
        setSelectedPokemon(null);

        if (newCount < 3) {
            await loadNewPair();
        } else {
            // Draft Complete - Use discarded Pokemon as bot team
            const finalBotTeam = botPokemon
                ? [...discardedTeam, botPokemon]
                : discardedTeam;

            setBotTeam(finalBotTeam as BattlePokemon[]);
            setGamePhase('BATTLE');
        }
    };

    useEffect(() => {
        // Guard against StrictMode double-mount causing flicker
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        loadNewPair();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-500">
            <header className="mb-12 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-tighter">
                    Infinite Draft Ops
                </h1>
                <p className="text-slate-400 mt-4 text-lg">
                    Drafting Unit {Math.min(draftCount + 1, 3)} / 3
                </p>

                {/* Difficulty Selector */}
                <div className="flex justify-center gap-4 mt-6">
                    {(['EASY', 'NORMAL', 'HARD'] as const).map((mode) => {
                        const style = difficultyColors[mode];
                        const isActive = difficulty === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => setDifficulty(mode)}
                                disabled={draftCount > 0} // Can only change before starting
                                className={`
                                    px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 border
                                    ${isActive
                                        ? `${style.btnActive} ${style.border} scale-110 shadow-lg`
                                        : `bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700`}
                                    ${draftCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {mode === 'EASY' && <Shield className="w-4 h-4" />}
                                {mode === 'NORMAL' && <Zap className="w-4 h-4" />}
                                {mode === 'HARD' && <Skull className="w-4 h-4" />}
                                {mode}
                            </button>
                        );
                    })}
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <Zap className={`w-12 h-12 ${diffStyle.text} animate-bounce`} />
                    <span className={`font-mono animate-pulse ${diffStyle.text}`}>Scanning Multiverse...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative">

                    {/* VS Badge */}
                    <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-10">
                        <div className={`bg-slate-900 border-2 ${diffStyle.border} rounded-full w-16 h-16 flex items-center justify-center shadow-lg ${diffStyle.shadow}`}>
                            <span className={`text-xl font-black italic ${diffStyle.text}`}>VS</span>
                        </div>
                    </div>

                    {draftPair.map((p) => (
                        <div key={p.id} className="flex justify-center">
                            <DraftCard pokemon={p} onSelect={() => handleSelect(p)} loading={loading} />
                        </div>
                    ))}
                </div>
            )}

            {/* Move Selection Modal */}
            {showMoveSelection && selectedPokemon && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`bg-slate-900 border-2 ${diffStyle.border} rounded-xl max-w-3xl w-full p-6 relative shadow-2xl ${diffStyle.shadow}`}>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">Select 4 Moves</h2>
                                <p className="text-slate-400 text-sm">for {selectedPokemon.name}</p>
                            </div>
                            <div className={`${diffStyle.text} font-bold text-lg`}>
                                {selectedMoves.length} / 4
                            </div>
                        </div>

                        {/* Move Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {movePool.map((move, idx) => {
                                const isSelected = selectedMoves.find(m => m.name === move.name);
                                const typeColor = typeColours[move.type.toLowerCase()] || '#A8A77A';

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleMoveSelection(move)}
                                        disabled={!isSelected && selectedMoves.length >= 4}
                                        style={{ backgroundColor: typeColor }}
                                        className={`
                                            relative p-4 rounded-lg border-2 text-left transition-all shadow-md group overflow-hidden
                                            ${isSelected
                                                ? `${diffStyle.border} ring-2 ring-offset-2 ring-offset-slate-900 ${diffStyle.text.replace('text', 'ring')}`
                                                : 'border-black/20 hover:border-white/50 opacity-90 hover:opacity-100'}
                                            ${!isSelected && selectedMoves.length >= 4 ? 'grayscale opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-lg drop-shadow-md">{move.name}</span>
                                                    {move.category === 'physical' && <img src={physicalIcon} alt="Physical" className="w-10 h-10 object-contain drop-shadow-md" />}
                                                    {move.category === 'special' && <img src={specialIcon} alt="Special" className="w-10 h-10 object-contain drop-shadow-md" />}
                                                    {move.category === 'status' && <img src={statusIcon} alt="Status" className="w-10 h-10 object-contain drop-shadow-md" />}
                                                </div>
                                                {isSelected && <Check className="w-6 h-6 text-white drop-shadow-md" />}
                                            </div>
                                            <div className="flex gap-2 text-xs text-white/90 font-mono">
                                                <span className="px-2 py-0.5 bg-black/30 rounded uppercase border border-white/10">{move.type}</span>
                                                <span className="px-2 py-0.5 bg-black/30 rounded border border-white/10">POW: {move.power || '-'}</span>
                                                <span className="px-2 py-0.5 bg-black/30 rounded border border-white/10">ACC: {move.accuracy}%</span>
                                                <span className="px-2 py-0.5 bg-black/30 rounded border border-white/10">PP: {move.pp}</span>
                                            </div>
                                        </div>

                                        {/* Subtle Shine Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowMoveSelection(false)}
                                className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 rounded-lg font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                Cancel
                            </button>
                            <button
                                onClick={confirmMoveSelection}
                                disabled={selectedMoves.length !== 4}
                                className={`
                                    flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2
                                    ${selectedMoves.length === 4
                                        ? `${diffStyle.btnActive} hover:opacity-90`
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                <Check className="w-5 h-5" />
                                Confirm Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DraftScreen;