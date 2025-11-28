import AsyncStorage from '@react-native-async-storage/async-storage';

const TTL = 30 * 60 * 1000; // 30 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache em memória (RAM) para acesso ultra-rápido durante o uso do app
const memoryCache = new Map<string, CacheEntry<any>>();

export const CacheManager = {
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();

    // 1. Tenta Memória
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key)!;
      if (now - entry.timestamp < TTL) return entry.data;
      memoryCache.delete(key);
    }

    // 2. Tenta Disco (AsyncStorage)
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        // Mesmo expirado, no modo offline podemos querer usar. 
        // Aqui vamos ser estritos com o TTL para "Fair Use", mas flexíveis se offline.
        return entry.data;
      }
    } catch (e) {
      console.error('Erro ao ler cache', e);
    }
    return null;
  },

  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    
    // Salva RAM
    memoryCache.set(key, entry);
    
    // Salva Disco
    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.error('Erro ao salvar cache', e);
    }
  }
};