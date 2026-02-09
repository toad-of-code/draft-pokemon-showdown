import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { BattlePokemon, BattleMove } from '../../store/useGameStore';
import { fetchDraftPair, fetchPokemonByIds, fetchPokemonWithMoves, type PokemonMove } from '../../api/pokeGraphql';
import { generateFakemonName, generateCounterTeam } from '../../api/geminiAgent';
import { generateSpriteUrl } from '../../api/nanoBanana';
import DraftCard from './DraftCard';
import { Zap, Skull, Shield, X, Check } from 'lucide-react';

const DraftScreen: React.FC = () => {
    const hasLoadedRef = useRef(false);
    const { addToUserTeam, userTeam, setGamePhase, setBotTeam, difficulty, setDifficulty } = useGameStore();
    const [draftPair, setDraftPair] = useState<BattlePokemon[]>([]);
    const [loading, setLoading] = useState(false);
    const [draftCount, setDraftCount] = useState(0);

    // Move Selection State
    const [showMoveSelection, setShowMoveSelection] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<BattlePokemon | null>(null);
    const [movePool, setMovePool] = useState<BattleMove[]>([]);
    const [selectedMoves, setSelectedMoves] = useState<BattleMove[]>([]);

    const loadNewPair = async () => {
        setLoading(true);
        try {
            // 1. Fetch 2 random base Pokemon with moves
            const basePair = await fetchDraftPair();
            console.log(`[DRAFT DEBUG] fetchDraftPair returned ${basePair.length} Pokémon:`, basePair.map(p => `${p.name} (ID:${p.id})`));

            if (basePair.length < 2) {
                console.error("Failed to fetch enough pokemon");
                setLoading(false);
                return;
            }

            // 2. Fetch full move data for these Pokemon
            const ids = basePair.map(p => p.id);
            console.log(`[DRAFT DEBUG] Fetching moves for IDs:`, ids);
            const pairWithMoves = await fetchPokemonWithMoves(ids);
            console.log(`[DRAFT DEBUG] fetchPokemonWithMoves returned ${pairWithMoves.length} Pokémon:`, pairWithMoves.map(p => `${p.name} (ID:${p.id})`));

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
                    learnset: p.moves || [] // Store the full learnset
                } as BattlePokemon & { learnset: PokemonMove[] };
            }));

            console.log(`[DRAFT DEBUG] Final enhanced pair: ${enhancedPair.length} Pokémon`);
            setDraftPair(enhancedPair);
        } catch (error) {
            console.error("Error loading draft pair:", error);
        }
        setLoading(false);
    };

    const handleSelect = async (pokemon: BattlePokemon & { learnset?: PokemonMove[] }) => {
        // Convert PokemonMove[] to BattleMove[] and select up to 7
        const learnset = pokemon.learnset || [];

        console.log(`[MOVE SELECTION] ${pokemon.name} has ${learnset.length} moves in learnset`);

        const battleMoves: BattleMove[] = learnset
            .map(m => ({
                name: m.name,
                type: m.type,
                power: m.power || 0,
                accuracy: m.accuracy || 100,
                category: m.damageClass as 'physical' | 'special' | 'status'
            }))
            .slice(0, 7); // Take top 7 moves (already sorted by level desc)

        console.log(`[MOVE SELECTION] Offering ${battleMoves.length} moves to user`);

        // Fallback if Pokemon has fewer than 7 moves
        if (battleMoves.length < 7) {
            console.warn(`[MOVE SELECTION] ⚠️ ${pokemon.name} only has ${battleMoves.length} learnable moves`);
        }

        if (battleMoves.length < 4) {
            console.error(`[MOVE SELECTION] ❌ CRITICAL: ${pokemon.name} has fewer than 4 moves!`);
        }

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

        const newCount = draftCount + 1;
        setDraftCount(newCount);
        setShowMoveSelection(false);
        setSelectedPokemon(null);

        if (newCount < 3) {
            await loadNewPair();
        } else {
            // Draft Complete - Generate Bot Team
            await generateBotTeam();
            setGamePhase('BATTLE');
        }
    };

    const generateBotTeam = async () => {
        setLoading(true);
        let botBase: any[] = [];

        if (difficulty === 'HARD') {
            // Gemini Counter-Picking
            console.log("Generating Counter Team via Gemini...");
            const simpleUserTeam = userTeam.map(p => ({
                name: p.name,
                types: p.types,
                stats: p.stats
            }));

            const counterData = await generateCounterTeam(simpleUserTeam);

            if (counterData && counterData.counter_picks) {
                const ids = counterData.counter_picks.map((p: any) => p.base_species_id);
                botBase = await fetchPokemonByIds(ids);
                console.log("✅ Gemini counter-pick successful:", counterData.analysis);
            } else {
                console.warn("⚠️ FALLBACK: Gemini counter-pick failed, using random team");
            }
        }

        // Fallback or Normal/Easy mode
        if (botBase.length < 3) {
            if (difficulty === 'HARD') {
                console.warn("⚠️ FALLBACK: Gemini returned insufficient Pokémon, filling with random");
            }
            const randoms = await fetchDraftPair();
            const randoms2 = await fetchDraftPair();
            botBase = [...botBase, ...randoms, ...randoms2].slice(0, 3);
        }

        // Fetch moves for bot Pokemon
        const botWithMoves = await fetchPokemonWithMoves(botBase.map(p => p.id));

        const botTeam = await Promise.all(botWithMoves.map(async (p) => {
            const spriteUrl = await generateSpriteUrl(p.name, p.id);
            const baseHp = p.stats.find((s: any) => s.name === 'hp')?.value || 50;
            const calculatedHp = baseHp + 60;

            // Convert moves to BattleMove format and select 4 random ones
            const learnset = p.moves || [];
            const battleMoves: BattleMove[] = learnset
                .map(m => ({
                    name: m.name,
                    type: m.type,
                    power: m.power || 0,
                    accuracy: m.accuracy || 100,
                    category: m.damageClass as 'physical' | 'special' | 'status'
                }));

            // Randomly select 4 moves from learnset
            const shuffled = battleMoves.sort(() => Math.random() - 0.5);
            const selectedMoves = shuffled.slice(0, 4);

            return {
                id: crypto.randomUUID(),
                baseId: p.id,
                name: `Bot-${p.name}`,
                types: p.types,
                stats: p.stats,
                moves: selectedMoves,
                maxHp: calculatedHp,
                currentHp: calculatedHp,
                spriteUrl: spriteUrl,
                isBot: true,
            } as BattlePokemon;
        }));
        setBotTeam(botTeam);
        setLoading(false);
    }

    useEffect(() => {
        // Guard against StrictMode double-mount causing flicker
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        loadNewPair();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-tighter">
                    Infinite Draft Ops
                </h1>
                <p className="text-slate-400 mt-4 text-lg">
                    Drafting Unit {Math.min(draftCount + 1, 3)} / 3
                </p>

                {/* Difficulty Selector */}
                <div className="flex justify-center gap-4 mt-6">
                    {(['EASY', 'NORMAL', 'HARD'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setDifficulty(mode)}
                            disabled={draftCount > 0} // Can only change before starting
                            className={`
                                px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2
                                ${difficulty === mode
                                    ? 'bg-yellow-500 text-black scale-110'
                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}
                                ${draftCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {mode === 'EASY' && <Shield className="w-4 h-4" />}
                            {mode === 'NORMAL' && <Zap className="w-4 h-4" />}
                            {mode === 'HARD' && <Skull className="w-4 h-4" />}
                            {mode}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <Zap className="w-12 h-12 text-yellow-400 animate-bounce" />
                    <span className="text-slate-400 font-mono animate-pulse">Scanning Multiverse...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative">

                    {/* VS Badge */}
                    <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-10">
                        <div className="bg-slate-900 border-2 border-slate-700 rounded-full w-16 h-16 flex items-center justify-center">
                            <span className="text-xl font-black text-white italic">VS</span>
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
                    <div className="bg-slate-900 border-2 border-yellow-500 rounded-xl max-w-3xl w-full p-6 relative shadow-2xl shadow-yellow-500/20">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">Select 4 Moves</h2>
                                <p className="text-slate-400 text-sm">for {selectedPokemon.name}</p>
                            </div>
                            <div className="text-yellow-500 font-bold text-lg">
                                {selectedMoves.length} / 4
                            </div>
                        </div>

                        {/* Move Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {movePool.map((move, idx) => {
                                const isSelected = selectedMoves.find(m => m.name === move.name);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleMoveSelection(move)}
                                        disabled={!isSelected && selectedMoves.length >= 4}
                                        className={`
                                            relative p-4 rounded-lg border-2 text-left transition-all
                                            ${isSelected
                                                ? 'border-yellow-500 bg-yellow-500/20'
                                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'}
                                            ${!isSelected && selectedMoves.length >= 4 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-white text-lg">{move.name}</span>
                                            {isSelected && <Check className="w-5 h-5 text-yellow-500" />}
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span className="px-2 py-1 bg-black/40 rounded uppercase">{move.type}</span>
                                            <span>POW: {move.power || '-'}</span>
                                            <span>ACC: {move.accuracy}%</span>
                                        </div>
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
                                        ? 'bg-yellow-500 text-black hover:bg-yellow-400'
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
