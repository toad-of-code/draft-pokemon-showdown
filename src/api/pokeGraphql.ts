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

const getRandomIds = (count: number, max: number = 493): number[] => {
  const ids = new Set<number>();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * max) + 1);
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

      console.log(`[MOVE DEBUG] Processing moves for ${p.name} (ID: ${p.id})`);
      console.log(`[MOVE DEBUG] Raw moves from API:`, p.pokemon_v2_pokemonmoves.length);

      // Log ALL raw moves for debugging
      console.log(`[MOVE DEBUG] === RAW MOVE ANALYSIS ===`);
      const rawMoveAnalysis = p.pokemon_v2_pokemonmoves.map((pm: any) => ({
        name: pm.pokemon_v2_move.name,
        power: pm.pokemon_v2_move.power,
        level: pm.level,
        type: pm.pokemon_v2_move.pokemon_v2_type?.name,
        damageClass: pm.pokemon_v2_move.pokemon_v2_movedamageclass?.name
      }));
      console.table(rawMoveAnalysis);

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

        // Only keep attacking moves (power > 0) and deduplicate by name
        if (move.power !== null && move.power > 0 && !movesMap.has(move.name)) {
          movesMap.set(move.name, move);
        }
      });

      const moves: PokemonMove[] = Array.from(movesMap.values());

      // Shuffle moves for variety instead of always highest power
      const shuffledMoves = moves.sort(() => Math.random() - 0.5);

      console.log(`[MOVE DEBUG] Total unique attacking moves:`, moves.length);
      console.log(`[MOVE DEBUG] Moves:`, shuffledMoves.slice(0, 7).map(m => `${m.name} (${m.type}, PWR:${m.power})`));

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
