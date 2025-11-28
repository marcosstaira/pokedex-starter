import { useState, useEffect, useRef, useCallback } from 'react';
import { PokeApi, fetchInChunks } from '../api/pokeApi'; // Importe o fetchInChunks
import NetInfo from '@react-native-community/netinfo';

export function usePokemonList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Controle
  const [offset, setOffset] = useState(0); 
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Novos Estados para Filtro
  const [types, setTypes] = useState<any[]>([]); // Lista de tipos para o menu
  const [selectedType, setSelectedType] = useState<string | null>(null); // Tipo selecionado
  const [typePokemonQueue, setTypePokemonQueue] = useState<any[]>([]); // A lista gigante do tipo para paginar localmente

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<any>(null);

  // Carrega a lista de tipos (Menu) ao iniciar
  useEffect(() => {
    PokeApi.getTypesList().then(setTypes).catch(() => {});
    const unsubscribe = NetInfo.addEventListener(state => setIsOffline(!state.isConnected));
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE CARREGAMENTO (Dual Mode) ---
  const loadMore = useCallback(async () => {
    if (loading || searchQuery) return;

    setLoading(true);
    setError(null);

    try {
      let itemsToFetchDetails: any[] = [];

      // MODO 1: FILTRO POR TIPO ATIVO
      if (selectedType) {
        // Se a fila estiver vazia e já carregamos dados, acabou a lista do tipo
        if (typePokemonQueue.length === 0 && data.length > 0) {
            setLoading(false);
            return;
        }

        // Pega os próximos 20 da fila local
        const nextBatch = typePokemonQueue.slice(offset, offset + 20);
        if (nextBatch.length === 0) {
            setLoading(false);
            return;
        }
        itemsToFetchDetails = nextBatch;
      } 
      // MODO 2: PAGINAÇÃO PADRÃO
      else {
        const response: any = await PokeApi.getPokemonList(offset, 20);
        itemsToFetchDetails = response.results;
      }

      // --- CONCORRÊNCIA CONTROLADA ---
      // Aqui usamos o fetchInChunks para baixar detalhes de 5 em 5
      // Isso impede que a gente mande 20 requisições simultâneas e estoure o timeout
      const details = await fetchInChunks(itemsToFetchDetails, 5, async (p: any) => {
        try {
            return await PokeApi.getPokemonDetail(p.url);
        } catch (e) {
            return null;
        }
      });
      
      const validDetails = details.filter(Boolean);

      setData(prev => [...prev, ...validDetails]);
      setOffset(prev => prev + 20);

    } catch (err: any) {
      if (err.message !== 'OFFLINE_MODE') setError('Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [offset, loading, searchQuery, selectedType, typePokemonQueue]);

  // --- FUNÇÃO PARA ATIVAR O FILTRO ---
  const handleTypeSelect = async (type: string) => {
    // Se clicar no mesmo, desativa (toggle)
    if (selectedType === type) {
        setSelectedType(null);
        setData([]);
        setOffset(0);
        // O useEffect do offset 0 vai disparar o loadMore padrão
        return;
    }

    setLoading(true);
    setError(null);
    setData([]);
    setOffset(0);
    setSelectedType(type);
    setSearchQuery(''); // Limpa busca se filtrar

    try {
        // 1. Baixa a lista GIGANTE (ex: 100 pokemons de agua)
        // Isso é rápido porque é só texto { name, url }
        const rawList = await PokeApi.getRawPokemonByType(type);
        
        // 2. Guarda na fila para paginar depois
        setTypePokemonQueue(rawList);

        // 3. A mágica: chamamos manualmente a lógica de carregar os primeiros 20
        // Precisamos repetir a lógica do loadMore aqui ou usar um useEffect. 
        // Vamos forçar o estado inicial.
        
        const firstBatch = rawList.slice(0, 20);
        const details = await fetchInChunks(firstBatch, 5, async (p: any) => {
            try { return await PokeApi.getPokemonDetail(p.url); } catch { return null; }
        });

        setData(details.filter(Boolean));
        setOffset(20); // Já carregamos 20

    } catch (e) {
        setError('Erro ao carregar tipo.');
    } finally {
        setLoading(false);
    }
  };

  // ... (handleSearch permanece igual ao anterior) ...
  const handleSearch = (text: string) => {
    // ... (copie o handleSearch do exemplo anterior) ...
    // Apenas adicione: setSelectedType(null); ao começar a buscar
    setSearchQuery(text);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (!text.trim()) {
        setData([]);
        setOffset(0);
        if (selectedType) {
            // Se limpou a busca mas tinha tipo selecionado, recarrega o tipo? 
            // Para simplificar, reseta tudo.
            setSelectedType(null);
        }
        // Dispara reload padrão
        setTimeout(() => { setOffset(0); loadMore(); }, 100); 
        return;
    }
    
    // ... lógica de debounce igual ...
    debounceTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setData([]);
        setError(null);
        setSelectedType(null); // Limpa filtro visualmente

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

  // Monitora mudança de offset para carregar mais apenas no modo padrão
  // No modo filtro, o controle é mais manual dentro do handleTypeSelect
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
    // Novos exports
    types,
    selectedType,
    handleTypeSelect
  };
}