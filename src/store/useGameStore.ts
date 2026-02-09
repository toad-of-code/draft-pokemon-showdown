import { create } from 'zustand';

export interface BattleMove {
    name: string;
    type: string;
    power: number;
    accuracy: number;
    category: 'physical' | 'special' | 'status';
}

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
    addToUserTeam: (pokemon: BattlePokemon) => void;
    setBotTeam: (team: BattlePokemon[]) => void;
    updatePokemonHp: (instanceId: string, newHp: number) => void;
    addLog: (message: string) => void;
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
        userTeam: [...state.userTeam, pokemon]
    })),

    setBotTeam: (team) => set({ botTeam: team }),

    updatePokemonHp: (instanceId, newHp) => set((state) => ({
        userTeam: state.userTeam.map(p => p.id === instanceId ? { ...p, currentHp: newHp } : p),
        botTeam: state.botTeam.map(p => p.id === instanceId ? { ...p, currentHp: newHp } : p)
    })),

    addLog: (message) => set((state) => ({
        battleLog: [...state.battleLog, message]
    })),

    resetGame: () => set({
        gamePhase: 'HOME',
        userTeam: [],
        botTeam: [],
        currentTurn: 1,
        battleLog: []
    })
}));
