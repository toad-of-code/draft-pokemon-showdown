import { STATUS_MOVES } from '../utils/battleLogic';

const POKE_GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta";

export interface PokemonMove {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  type: string;
  damageClass: string;
}

export interface PokemonBase {
  id: number;
  name: string;
  types: string[];
  stats: { name: string; value: number }[];
  base_stat_total: number;
  moves?: PokemonMove[];
}

const GET_POKEMON_QUERY = `
  query getPokemon($ids: [Int!]!) {
    pokemon_v2_pokemon(where: {id: {_in: $ids}}) {
      id
      name
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
    }
  }
`;

const GET_POKEMON_WITH_MOVES_QUERY = `
  query getPokemonWithMoves($ids: [Int!]!) {
    pokemon_v2_pokemon(where: {id: {_in: $ids}}) {
      id
      name
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemonmoves(
        where: {
          pokemon_v2_movelearnmethod: {name: {_in: ["level-up", "machine"]}}
        }
        order_by: {pokemon_v2_move: {power: desc_nulls_last}}
      ) {
        level
        pokemon_v2_move {
          id
          name
          power
          accuracy
          pp
          pokemon_v2_type {
            name
          }
          pokemon_v2_movedamageclass {
            name
          }
        }
      }
    }
  }
`;

// UPDATED: Equal probability for Gen 1, 2, and 3
const getRandomIds = (count: number): number[] => {
  const ids = new Set<number>();
  // Gen 1: 1-151, Gen 2: 152-251, Gen 3: 252-386
  const genRanges = [[1, 151], [152, 251], [252, 386]];

  while (ids.size < count) {
    const range = genRanges[Math.floor(Math.random() * genRanges.length)];
    const randomId = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    ids.add(randomId);
  }
  return Array.from(ids);
};

export const fetchDraftPair = async (): Promise<PokemonBase[]> => {
  // Fetch a batch of random IDs to ensure we get at least 2 valid ones after filtering
  const randomIds = getRandomIds(10);

  try {
    const response = await fetch(POKE_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_POKEMON_QUERY,
        variables: { ids: randomIds }
      })
    });

    const { data } = await response.json();
    const pokemonList: PokemonBase[] = data.pokemon_v2_pokemon.map((p: any) => {
      const stats = p.pokemon_v2_pokemonstats.map((s: any) => ({
        name: s.pokemon_v2_stat.name,
        value: s.base_stat
      }));
      const bst = stats.reduce((acc: number, cur: any) => acc + cur.value, 0);

      return {
        id: p.id,
        name: p.name,
        types: p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name),
        stats,
        base_stat_total: bst
      };
    });

    // Filter by BST >= 300
    const validPokemon = pokemonList.filter(p => p.base_stat_total >= 300);

    // Return the first 2
    return validPokemon.slice(0, 2);

  } catch (error) {
    console.error("Error fetching draft pair:", error);
    return [];
  }
};

export const fetchPokemonByIds = async (ids: number[]): Promise<PokemonBase[]> => {
  try {
    const response = await fetch(POKE_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_POKEMON_QUERY,
        variables: { ids }
      })
    });

    const { data } = await response.json();
    return data.pokemon_v2_pokemon.map((p: any) => {
      const stats = p.pokemon_v2_pokemonstats.map((s: any) => ({
        name: s.pokemon_v2_stat.name,
        value: s.base_stat
      }));
      const bst = stats.reduce((acc: number, cur: any) => acc + cur.value, 0);
      return {
        id: p.id,
        name: p.name,
        types: p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name),
        stats,
        base_stat_total: bst
      };
    });
  } catch (error) {
    console.error("Error fetching specific pokemon:", error);
    return [];
  }
}

export const fetchPokemonWithMoves = async (ids: number[]): Promise<PokemonBase[]> => {
  try {
    const response = await fetch(POKE_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_POKEMON_WITH_MOVES_QUERY,
        variables: { ids }
      })
    });

    const { data } = await response.json();
    return data.pokemon_v2_pokemon.map((p: any) => {
      const stats = p.pokemon_v2_pokemonstats.map((s: any) => ({
        name: s.pokemon_v2_stat.name,
        value: s.base_stat
      }));
      const bst = stats.reduce((acc: number, cur: any) => acc + cur.value, 0);

      // Process moves and deduplicate by name
      const movesMap = new Map<string, PokemonMove>();

      p.pokemon_v2_pokemonmoves.forEach((pm: any) => {
        const move = {
          id: pm.pokemon_v2_move.id,
          name: pm.pokemon_v2_move.name.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          power: pm.pokemon_v2_move.power,
          accuracy: pm.pokemon_v2_move.accuracy,
          pp: pm.pokemon_v2_move.pp,
          type: pm.pokemon_v2_move.pokemon_v2_type.name,
          damageClass: pm.pokemon_v2_move.pokemon_v2_movedamageclass?.name || 'status'
        };

        const isDamaging = move.damageClass === 'physical' || move.damageClass === 'special';
        const isSupportedStatus = move.damageClass === 'status' && STATUS_MOVES[move.name.toLowerCase()];

        // Only keep damaging moves OR supported status moves
        if ((isDamaging || isSupportedStatus) && !movesMap.has(move.name)) {
          movesMap.set(move.name, move);
        }
      });

      const moves: PokemonMove[] = Array.from(movesMap.values());

      // Shuffle moves for variety instead of always highest power
      const shuffledMoves = moves.sort(() => Math.random() - 0.5);

      return {
        id: p.id,
        name: p.name,
        types: p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name),
        stats,
        base_stat_total: bst,
        moves: shuffledMoves
      };
    });
  } catch (error) {
    console.error("Error fetching pokemon with moves:", error);
    return [];
  }
}