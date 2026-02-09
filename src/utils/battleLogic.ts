import type { BattlePokemon, BattleMove } from '../store/useGameStore';

const MOVES_POOL: Record<string, BattleMove[]> = {
    normal: [
        { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, category: 'physical' },
        { name: 'Hyper Voice', type: 'normal', power: 90, accuracy: 100, category: 'special' },
        { name: 'Slash', type: 'normal', power: 70, accuracy: 100, category: 'physical' },
        { name: 'Take Down', type: 'normal', power: 90, accuracy: 85, category: 'physical' },
    ],
    fire: [
        { name: 'Ember', type: 'fire', power: 40, accuracy: 100, category: 'special' },
        { name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, category: 'special' },
        { name: 'Fire Punch', type: 'fire', power: 75, accuracy: 100, category: 'physical' },
        { name: 'Flare Blitz', type: 'fire', power: 120, accuracy: 100, category: 'physical' },
    ],
    water: [
        { name: 'Water Gun', type: 'water', power: 40, accuracy: 100, category: 'special' },
        { name: 'Surf', type: 'water', power: 90, accuracy: 100, category: 'special' },
        { name: 'Waterfall', type: 'water', power: 80, accuracy: 100, category: 'physical' },
        { name: 'Hydro Pump', type: 'water', power: 110, accuracy: 80, category: 'special' },
    ],
    grass: [
        { name: 'Vine Whip', type: 'grass', power: 45, accuracy: 100, category: 'physical' },
        { name: 'Energy Ball', type: 'grass', power: 90, accuracy: 100, category: 'special' },
        { name: 'Leaf Blade', type: 'grass', power: 90, accuracy: 100, category: 'physical' },
        { name: 'Solar Beam', type: 'grass', power: 120, accuracy: 100, category: 'special' },
    ],
    electric: [
        { name: 'Thunder Shock', type: 'electric', power: 40, accuracy: 100, category: 'special' },
        { name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, category: 'special' },
        { name: 'Thunder Punch', type: 'electric', power: 75, accuracy: 100, category: 'physical' },
        { name: 'Thunder', type: 'electric', power: 110, accuracy: 70, category: 'special' },
    ],
    // Fallback/Generic moves for other types
    generic: [
        { name: 'Hidden Power', type: 'normal', power: 60, accuracy: 100, category: 'special' },
        { name: 'Return', type: 'normal', power: 102, accuracy: 100, category: 'physical' },
        { name: 'Toxic', type: 'poison', power: 0, accuracy: 90, category: 'status' },
        { name: 'Protect', type: 'normal', power: 0, accuracy: 100, category: 'status' },
    ]
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
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, darker: 2, steel: 2, fairy: 0.5 },
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
