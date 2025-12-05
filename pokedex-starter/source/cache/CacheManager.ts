import AsyncStorage from '@react-native-async-storage/async-storage';

const TTL = 30 * 60 * 1000;
const MAX_CACHE_ITEMS = 50;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const CacheManager = {
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();


    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key)!;
      if (now - entry.timestamp < TTL) return entry.data;
      memoryCache.delete(key);
    }


    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);

        memoryCache.set(key, entry);
        return entry.data;
      }
    } catch (e) {

    }
    return null;
  },

  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);

    try {

      const keys = await AsyncStorage.getAllKeys();

      if (keys.length >= MAX_CACHE_ITEMS) {

        const keysToRemove = keys.slice(0, 10);
        await AsyncStorage.multiRemove(keysToRemove);


        keysToRemove.forEach(k => memoryCache.delete(k));
      }


      await AsyncStorage.setItem(key, JSON.stringify(entry));

    } catch (e: any) {

      if (e.message && e.message.includes('database or disk is full')) {
        console.warn('Cache crítico! Limpando tudo para recuperar app.');
        await this.clearAll();


        try {
          await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch { }
      } else {
        console.error('Erro ao salvar cache', e);
      }
    }
  },

  async clearAll(): Promise<void> {
    memoryCache.clear();
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Erro ao limpar cache', e);
    }
  }
};