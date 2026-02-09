import { create } from 'zustand';

export interface BattleMove {
    name: string;
    type: string;
    power: number;
    accuracy: number;
    category: 'physical' | 'special' | 'status';
    pp: number;        // Max PP
    currentPp: number; // Current PP (decrements on use)
}

export type StatusEffect = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze' | null;

export interface BattlePokemon {
    id: string; // Unique instance ID
    baseId: number; // Pokedex ID
    name: string;
    types: string[];
    stats: { name: string; value: number }[];
    moves: BattleMove[];
    maxHp: number;
    currentHp: number;
    spriteUrl: string;
    isBot: boolean;
    statusEffect: StatusEffect; // Current status condition
    statusTurns: number;        // Turns remaining for sleep/freeze
    battleStats: {              // NEW: Battle data tracking
        damageDealt: number;
        damageTaken: number;
        kills: number;
    };
}

interface GameState {
    gamePhase: 'HOME' | 'DRAFT' | 'BATTLE' | 'RESULT';
    difficulty: 'EASY' | 'NORMAL' | 'HARD';
    userTeam: BattlePokemon[];
    botTeam: BattlePokemon[];
    currentTurn: number;
    battleLog: string[];

    // Actions
    setGamePhase: (phase: 'HOME' | 'DRAFT' | 'BATTLE' | 'RESULT') => void;
    setDifficulty: (difficulty: 'EASY' | 'NORMAL' | 'HARD') => void;
    addToUserTeam: (pokemon: Omit<BattlePokemon, 'battleStats'>) => void;
    setBotTeam: (team: Omit<BattlePokemon, 'battleStats'>[]) => void;
    updatePokemonHp: (instanceId: string, newHp: number) => void;
    updateMovePp: (instanceId: string, moveName: string) => void;
    setStatusEffect: (instanceId: string, status: StatusEffect, turns?: number) => void;
    // NEW Stats actions
    recordDamage: (attackerId: string, damage: number) => void;
    recordDamageTaken: (defenderId: string, damage: number) => void;
    recordKill: (killerId: string) => void;

    addLog: (message: string) => void;
    nextTurn: () => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    gamePhase: 'HOME',
    difficulty: 'NORMAL',
    userTeam: [],
    botTeam: [],
    currentTurn: 1,
    battleLog: [],

    setGamePhase: (phase) => set({ gamePhase: phase }),
    setDifficulty: (difficulty) => set({ difficulty }),

    addToUserTeam: (pokemon) => set((state) => ({
        userTeam: [...state.userTeam, {
            ...pokemon,
            battleStats: { damageDealt: 0, damageTaken: 0, kills: 0 } // Init stats
        }]
    })),

    setBotTeam: (team) => set({
        botTeam: team.map(p => ({
            ...p,
            battleStats: { damageDealt: 0, damageTaken: 0, kills: 0 } // Init stats 
        }))
    }),

    updatePokemonHp: (instanceId, newHp) => set((state) => ({
        userTeam: state.userTeam.map(p => p.id === instanceId ? { ...p, currentHp: newHp } : p),
        botTeam: state.botTeam.map(p => p.id === instanceId ? { ...p, currentHp: newHp } : p)
    })),

    updateMovePp: (instanceId, moveName) => set((state) => {
        const updateMoves = (pokemon: BattlePokemon) => {
            if (pokemon.id !== instanceId) return pokemon;
            return {
                ...pokemon,
                moves: pokemon.moves.map(m =>
                    m.name === moveName ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m
                )
            };
        };
        return {
            userTeam: state.userTeam.map(updateMoves),
            botTeam: state.botTeam.map(updateMoves)
        };
    }),

    setStatusEffect: (instanceId, status, turns = 0) => set((state) => {
        const updateStatus = (pokemon: BattlePokemon) => {
            if (pokemon.id !== instanceId) return pokemon;
            return {
                ...pokemon,
                statusEffect: status,
                statusTurns: turns
            };
        };
        return {
            userTeam: state.userTeam.map(updateStatus),
            botTeam: state.botTeam.map(updateStatus)
        };
    }),

    recordDamage: (attackerId, damage) => set((state) => {
        const updateStats = (p: BattlePokemon) => p.id === attackerId
            ? { ...p, battleStats: { ...p.battleStats, damageDealt: p.battleStats.damageDealt + damage } }
            : p;
        return {
            userTeam: state.userTeam.map(updateStats),
            botTeam: state.botTeam.map(updateStats)
        };
    }),

    recordDamageTaken: (defenderId, damage) => set((state) => {
        const updateStats = (p: BattlePokemon) => p.id === defenderId
            ? { ...p, battleStats: { ...p.battleStats, damageTaken: p.battleStats.damageTaken + damage } }
            : p;
        return {
            userTeam: state.userTeam.map(updateStats),
            botTeam: state.botTeam.map(updateStats)
        };
    }),

    recordKill: (killerId) => set((state) => {
        const updateStats = (p: BattlePokemon) => p.id === killerId
            ? { ...p, battleStats: { ...p.battleStats, kills: p.battleStats.kills + 1 } }
            : p;
        return {
            userTeam: state.userTeam.map(updateStats),
            botTeam: state.botTeam.map(updateStats)
        };
    }),

    addLog: (message) => set((state) => ({
        battleLog: [...state.battleLog, message]
    })),

    nextTurn: () => set((state) => ({ currentTurn: state.currentTurn + 1 })),


    resetGame: () => set({
        gamePhase: 'HOME',
        difficulty: 'NORMAL',
        userTeam: [],
        botTeam: [],
        currentTurn: 1,
        battleLog: [],
    }),
}));
