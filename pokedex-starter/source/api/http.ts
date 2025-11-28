import NetInfo from '@react-native-community/netinfo';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoff?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 8000, retries = 3, backoff = 1000, ...fetchOptions } = options;

  // 1. Verificação de Conectividade antes de tentar
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    throw new Error('OFFLINE_MODE');
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Se o usuário passou um signal (para cancelamento manual), combinamos a lógica
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      clearTimeout(id);
      controller.abort();
    });
  }

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });

    if (!response.ok) {
      // Se for erro 5xx (servidor), lançamos erro para tentar retry
      if (response.status >= 500) {
        throw new Error(`SERVER_ERROR:${response.status}`);
      }
      throw new Error(`HTTP_ERROR:${response.status}`);
    }

    return (await response.json()) as T;

  } catch (error: any) {
    const isAbort = error.name === 'AbortError';
    
    // Se foi cancelado pelo usuário ou timeout, não fazemos retry
    if (isAbort) throw error;

    // Lógica de Retry com Backoff + Jitter
    if (retries > 0) {
      // Jitter: adiciona um tempo aleatório para evitar "thundering herd"
      const jitter = Math.random() * 200;
      await wait(backoff + jitter);
      
      return fetchJson<T>(url, {
        ...options,
        retries: retries - 1,
        backoff: backoff * 2, // Exponencial
      });
    }

    throw error;
  } finally {
    clearTimeout(id);
  }
}