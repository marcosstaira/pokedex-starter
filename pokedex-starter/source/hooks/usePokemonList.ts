import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PokeApi, fetchInChunks } from '../api/pokeApi';

export function usePokemonList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [offset, setOffset] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const [types, setTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [typePokemonQueue, setTypePokemonQueue] = useState<any[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<any>(null);


  useEffect(() => {
    PokeApi.getTypesList().then(setTypes).catch(() => { });
    const unsubscribe = NetInfo.addEventListener(state => setIsOffline(!state.isConnected));
    return () => unsubscribe();
  }, []);


  const loadMore = useCallback(async () => {

    if (loading || searchQuery || (selectedType && typePokemonQueue.length === 0)) return;

    setLoading(true);
    setError(null);

    try {
      let itemsToFetchDetails: any[] = [];


      if (selectedType) {

        if (typePokemonQueue.length === 0 && data.length > 0) {
          setLoading(false);
          return;
        }
        const nextBatch = typePokemonQueue.slice(offset, offset + 20);
        if (nextBatch.length === 0) {
          setLoading(false);
          return;
        }
        itemsToFetchDetails = nextBatch;
      }

      else {
        const response: any = await PokeApi.getPokemonList(offset, 20);
        itemsToFetchDetails = response.results;
      }


      const details = await fetchInChunks(itemsToFetchDetails, 5, async (p: any) => {
        try {
          return await PokeApi.getPokemonDetail(p.url);
        } catch (e) {
          return null;
        }
      });

      const validDetails = details.filter(Boolean);


      setData(prev => {

        const existingIds = new Set(prev.map(p => p.id));


        const uniqueNewPokemon = validDetails.filter((p: any) => !existingIds.has(p.id));


        return [...prev, ...uniqueNewPokemon];
      });

      setOffset(prev => prev + 20);

    } catch (err: any) {
      if (err.message !== 'OFFLINE_MODE') setError('Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [offset, loading, searchQuery, selectedType, typePokemonQueue, data]);


  const handleTypeSelect = async (type: string) => {

    if (selectedType === type) {
      setSelectedType(null);
      setData([]);
      setOffset(0);

      return;
    }

    setLoading(true);
    setError(null);
    setData([]);
    setOffset(0);
    setSelectedType(type);
    setSearchQuery('');

    try {

      const rawList = await PokeApi.getRawPokemonByType(type);


      setTypePokemonQueue(rawList);



      const firstBatch = rawList.slice(0, 20);
      const details = await fetchInChunks(firstBatch, 5, async (p: any) => {
        try { return await PokeApi.getPokemonDetail(p.url); } catch { return null; }
      });

      setData(details.filter(Boolean));
      setOffset(20);

    } catch (e) {
      setError('Erro ao carregar tipo.');
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (text: string) => {

    setSearchQuery(text);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (!text.trim()) {
      setData([]);
      setOffset(0);
      if (selectedType) {

        setSelectedType(null);
      }

      setTimeout(() => { setOffset(0); loadMore(); }, 100);
      return;
    }


    debounceTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setData([]);
      setError(null);
      setSelectedType(null);

      abortControllerRef.current = new AbortController();
      try {
        const detail = await PokeApi.getPokemonDetail(text.toLowerCase(), abortControllerRef.current.signal);
        setData([detail]);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não encontrado.');
      } finally {
        setLoading(false);
      }
    }, 600);
  };


  useEffect(() => {
    if (offset === 0 && !selectedType && !searchQuery) {
      loadMore();
    }
  }, [offset === 0]);

  return {
    data,
    loading,
    error,
    loadMore,
    searchQuery,
    handleSearch,
    isOffline,
    retry: loadMore,
    types,
    selectedType,
    handleTypeSelect
  };
}