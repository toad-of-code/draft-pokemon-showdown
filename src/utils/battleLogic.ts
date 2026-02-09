import type { BattlePokemon, BattleMove } from '../store/useGameStore';

const MOVES_POOL: Record<string, BattleMove[]> = {
    normal: [
        { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, category: 'physical', pp: 35, currentPp: 35 },
        { name: 'Hyper Voice', type: 'normal', power: 90, accuracy: 100, category: 'special', pp: 10, currentPp: 10 },
        { name: 'Slash', type: 'normal', power: 70, accuracy: 100, category: 'physical', pp: 20, currentPp: 20 },
        { name: 'Take Down', type: 'normal', power: 90, accuracy: 85, category: 'physical', pp: 20, currentPp: 20 },
        { name: 'Explosion', type: 'normal', power: 250, accuracy: 100, category: 'physical', pp: 5, currentPp: 5 },
        { name: 'Self-Destruct', type: 'normal', power: 200, accuracy: 100, category: 'physical', pp: 5, currentPp: 5 },
    ],
    fire: [
        { name: 'Ember', type: 'fire', power: 40, accuracy: 100, category: 'special', pp: 25, currentPp: 25 },
        { name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, category: 'special', pp: 15, currentPp: 15 },
        { name: 'Fire Punch', type: 'fire', power: 75, accuracy: 100, category: 'physical', pp: 15, currentPp: 15 },
        { name: 'Flare Blitz', type: 'fire', power: 120, accuracy: 100, category: 'physical', pp: 15, currentPp: 15 },
    ],
    water: [
        { name: 'Water Gun', type: 'water', power: 40, accuracy: 100, category: 'special', pp: 25, currentPp: 25 },
        { name: 'Surf', type: 'water', power: 90, accuracy: 100, category: 'special', pp: 15, currentPp: 15 },
        { name: 'Waterfall', type: 'water', power: 80, accuracy: 100, category: 'physical', pp: 15, currentPp: 15 },
        { name: 'Hydro Pump', type: 'water', power: 110, accuracy: 80, category: 'special', pp: 5, currentPp: 5 },
    ],
    grass: [
        { name: 'Vine Whip', type: 'grass', power: 45, accuracy: 100, category: 'physical', pp: 25, currentPp: 25 },
        { name: 'Energy Ball', type: 'grass', power: 90, accuracy: 100, category: 'special', pp: 10, currentPp: 10 },
        { name: 'Leaf Blade', type: 'grass', power: 90, accuracy: 100, category: 'physical', pp: 15, currentPp: 15 },
        { name: 'Solar Beam', type: 'grass', power: 120, accuracy: 100, category: 'special', pp: 10, currentPp: 10 },
    ],
    electric: [
        { name: 'Thunder Shock', type: 'electric', power: 40, accuracy: 100, category: 'special', pp: 30, currentPp: 30 },
        { name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, category: 'special', pp: 15, currentPp: 15 },
        { name: 'Thunder Punch', type: 'electric', power: 75, accuracy: 100, category: 'physical', pp: 15, currentPp: 15 },
        { name: 'Thunder', type: 'electric', power: 110, accuracy: 70, category: 'special', pp: 10, currentPp: 10 },
    ],
    // Fallback/Generic moves for other types
    generic: [
        { name: 'Hidden Power', type: 'normal', power: 60, accuracy: 100, category: 'special', pp: 15, currentPp: 15 },
        { name: 'Return', type: 'normal', power: 102, accuracy: 100, category: 'physical', pp: 20, currentPp: 20 },
        { name: 'Toxic', type: 'poison', power: 0, accuracy: 90, category: 'status', pp: 10, currentPp: 10 },
        { name: 'Protect', type: 'normal', power: 0, accuracy: 100, category: 'status', pp: 10, currentPp: 10 },
    ]
};

// Map of moves to their status effects
export const STATUS_MOVES: Record<string, 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze'> = {
    'will-o-wisp': 'burn',
    'toxic': 'poison',
    'poison powder': 'poison',
    'thunder wave': 'paralysis',
    'stun spore': 'paralysis',
    'glare': 'paralysis',
    'sleep powder': 'sleep',
    'spore': 'sleep',
    'hypnosis': 'sleep',
    'sing': 'sleep',
    'lovely kiss': 'sleep',
    'grass whistle': 'sleep',
    'dark void': 'sleep'
};

export const getRandomMoves = (types: string[], count: number = 7): BattleMove[] => {
    const moves: BattleMove[] = [];
    const pool = { ...MOVES_POOL };

    // Try to find moves matching types
    types.forEach(type => {
        const t = type.toLowerCase();
        if (pool[t]) {
            pool[t].forEach(m => {
                if (moves.length < count && Math.random() > 0.3) {
                    moves.push(m);
                }
            });
        }
    });

    // Fill remaining with random moves from pool or generic
    while (moves.length < count) {
        const typeKeys = Object.keys(pool);
        const randomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const randomMove = pool[randomType][Math.floor(Math.random() * pool[randomType].length)];
        if (!moves.find(m => m.name === randomMove.name)) {
            moves.push(randomMove);
        }
    }

    return moves.slice(0, count);
};

// Simple Type Chart (1 = Normal, 2 = Super Effective, 0.5 = Not Very Effective, 0 = Immune)
// For this lite version, we'll implement a subset or a simplified logic.
// Let's implement full chart for Gen 1-4 types if possible, or just a few key ones.
// To save space/time, we'll use a simplified effectiveness function.

const TYPE_CHART: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

export const getTypeEffectiveness = (moveType: string, defenderTypes: string[]): number => {
    let multiplier = 1;
    const mt = moveType.toLowerCase();

    defenderTypes.forEach(dt => {
        const defendType = dt.toLowerCase();
        if (TYPE_CHART[mt] && TYPE_CHART[mt][defendType] !== undefined) {
            multiplier *= TYPE_CHART[mt][defendType];
        }
    });

    return multiplier;
};

export const calculateDamage = (attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove): { damage: number, effectiveness: number, critical: boolean } => {
    // Simplified Damage Formula
    // Damage = (((2 * Level / 5 + 2) * Power * A / D) / 50 + 2) * Modifier

    const level = 100;
    const attackStat = move.category === 'special'
        ? attacker.stats.find(s => s.name === 'special-attack')?.value || 50
        : attacker.stats.find(s => s.name === 'attack')?.value || 50;

    const defenseStat = move.category === 'special'
        ? defender.stats.find(s => s.name === 'special-defense')?.value || 50
        : defender.stats.find(s => s.name === 'defense')?.value || 50;

    const effectiveness = getTypeEffectiveness(move.type, defender.types);

    const stab = attacker.types.map(t => t.toLowerCase()).includes(move.type.toLowerCase()) ? 1.5 : 1;
    const random = (Math.floor(Math.random() * 16) + 85) / 100;
    const critical = Math.random() < 0.0625; // 1/16 crit chance
    const critMultiplier = critical ? 1.5 : 1;

    let damage = (((2 * level / 5 + 2) * move.power * attackStat / defenseStat) / 50 + 2);
    damage = damage * stab * effectiveness * random * critMultiplier;

    return {
        damage: Math.floor(damage),
        effectiveness,
        critical
    };
};

// AI UTILITY FUNCTIONS

/**
 * Predicts damage without RNG for AI decision-making.
 */
export const predictDamage = (attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove): number => {
    if (move.power === 0) return 0; // Status moves deal no direct damage

    const level = 100;
    const attackStat = move.category === 'special'
        ? attacker.stats.find(s => s.name === 'special-attack')?.value || 50
        : attacker.stats.find(s => s.name === 'attack')?.value || 50;

    const defenseStat = move.category === 'special'
        ? defender.stats.find(s => s.name === 'special-defense')?.value || 50
        : defender.stats.find(s => s.name === 'defense')?.value || 50;

    const effectiveness = getTypeEffectiveness(move.type, defender.types);
    const stab = attacker.types.map(t => t.toLowerCase()).includes(move.type.toLowerCase()) ? 1.5 : 1;

    // Use average random factor (0.925) for prediction
    let damage = (((2 * level / 5 + 2) * move.power * attackStat / defenseStat) / 50 + 2);
    damage = damage * stab * effectiveness * 0.925;

    return Math.floor(damage);
};

/**
 * Selects the move with the highest predicted damage.
 */
export const selectBestMove = (attacker: BattlePokemon, defender: BattlePokemon): BattleMove => {
    let bestMove = attacker.moves[0];
    let bestDamage = -1;

    for (const move of attacker.moves) {
        const predictedDamage = predictDamage(attacker, defender, move);
        if (predictedDamage > bestDamage) {
            bestDamage = predictedDamage;
            bestMove = move;
        }
    }

    return bestMove;
};

/**
 * Finds the best Pokemon to switch into (HARD mode only).
 * Returns the index of the best switch-in, or -1 if none is better than current.
 */
export const findBestSwitchIn = (
    botTeam: BattlePokemon[],
    userPokemon: BattlePokemon,
    currentBotIndex: number
): number => {
    const currentBot = botTeam[currentBotIndex];
    if (!currentBot || currentBot.currentHp <= 0) return -1;

    // HP-BASED SWITCHING: Check if current bot is critically low on HP
    const currentHpPercent = (currentBot.currentHp / currentBot.maxHp) * 100;
    const isCriticallyLow = currentHpPercent <= 25;

    // Calculate current matchup score (how much damage we can deal vs take)
    const currentBestMove = selectBestMove(currentBot, userPokemon);
    const currentDamageDealt = predictDamage(currentBot, userPokemon, currentBestMove);

    // Estimate damage we might take (assume user's best move)
    let currentDamageTaken = 0;
    for (const userMove of userPokemon.moves.slice(0, 4)) {
        const dmg = predictDamage(userPokemon, currentBot, userMove);
        if (dmg > currentDamageTaken) currentDamageTaken = dmg;
    }

    // Apply HP penalty to current score - low HP makes current Pokemon less desirable
    const hpPenalty = isCriticallyLow ? 0.5 : 1.0;
    const currentScore = (currentDamageDealt - currentDamageTaken * 0.5) * hpPenalty;

    let bestIndex = -1;
    let bestScore = currentScore;

    for (let i = 0; i < botTeam.length; i++) {
        if (i === currentBotIndex) continue;
        const candidate = botTeam[i];
        if (candidate.currentHp <= 0) continue;

        const candidateBestMove = selectBestMove(candidate, userPokemon);
        const candidateDamageDealt = predictDamage(candidate, userPokemon, candidateBestMove);

        let candidateDamageTaken = 0;
        for (const userMove of userPokemon.moves.slice(0, 4)) {
            const dmg = predictDamage(userPokemon, candidate, userMove);
            if (dmg > candidateDamageTaken) candidateDamageTaken = dmg;
        }

        const candidateScore = candidateDamageDealt - candidateDamageTaken * 0.5;

        // HP-BASED: If current is critically low, lower the threshold for switching
        const switchThreshold = isCriticallyLow ? 1.0 : 1.2; // No improvement needed if critical HP

        // Only switch if significantly better (at least 20% improvement, or any if critical)
        if (candidateScore > bestScore * switchThreshold) {
            bestScore = candidateScore;
            bestIndex = i;
        }
    }

    return bestIndex;
};
