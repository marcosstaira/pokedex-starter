import { fetchJson } from './http';
import { CacheManager } from '../cache/CacheManager';

const BASE_URL = 'https://pokeapi.co/api/v2';

// Helper para limitar concorrência (Chunking)
// Baixa 'items' em lotes de 'batchSize'
export async function fetchInChunks<T>(items: any[], batchSize: number, fn: (item: any) => Promise<T>): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export const PokeApi = {
  // 1. Pegar lista de Tipos (Fire, Water, etc) para o Menu
  getTypesList: async () => {
    const url = `${BASE_URL}/type`;
    const cached = await CacheManager.get(url);
    if (cached) return cached;

    const data = await fetchJson<any>(url);
    // Filtra tipos especiais que não têm pokemon (opcional)
    const results = data.results.filter((t: any) => !['unknown', 'shadow'].includes(t.name));
    
    await CacheManager.set(url, results);
    return results;
  },

  // 2. Pegar lista de Pokémon de um Tipo específico
  // Retorna a lista "crua" (apenas nome e url) de TODOS os pokémons do tipo.
  // A paginação será feita no Hook.
  getRawPokemonByType: async (type: string) => {
    const url = `${BASE_URL}/type/${type}`;
    const cached = await CacheManager.get(url);
    if (cached) return cached;

    const data = await fetchJson<any>(url);
    // O endpoint /type retorna { pokemon: [ { pokemon: { name, url } } ] }
    // Vamos limpar isso para ficar igual ao endpoint padrão { name, url }
    const cleanList = data.pokemon.map((p: any) => p.pokemon);
    
    await CacheManager.set(url, cleanList);
    return cleanList;
  },

  // ... (Mantenha getPokemonList e getPokemonDetail iguais ao anterior) ...
  getPokemonList: async (offset: number, limit: number) => {
    const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
    const cached = await CacheManager.get(url);
    if (cached) return cached;

    const data = await fetchJson<any>(url);
    await CacheManager.set(url, data);
    return data;
  },

  getPokemonDetail: async (nameOrUrl: string, signal?: AbortSignal) => {
    const url = nameOrUrl.startsWith('http') ? nameOrUrl : `${BASE_URL}/pokemon/${nameOrUrl}`;
    const cached = await CacheManager.get(url);
    if (cached) return cached;

    const data = await fetchJson<any>(url, { signal });
    await CacheManager.set(url, data);
    return data;
  },
};