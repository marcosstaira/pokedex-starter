import NetInfo from '@react-native-community/netinfo';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoff?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 8000, retries = 3, backoff = 1000, ...fetchOptions } = options;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    throw new Error('OFFLINE_MODE');
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);


  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      clearTimeout(id);
      controller.abort();
    });
  }

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });

    if (!response.ok) {
      
      if (response.status >= 500) {
        throw new Error(`SERVER_ERROR:${response.status}`);
      }
      throw new Error(`HTTP_ERROR:${response.status}`);
    }

    return (await response.json()) as T;

  } catch (error: any) {
    const isAbort = error.name === 'AbortError';
    
    if (isAbort) throw error;

    if (retries > 0) {
      const jitter = Math.random() * 200;
      await wait(backoff + jitter);
      
      return fetchJson<T>(url, {
        ...options,
        retries: retries - 1,
        backoff: backoff * 2, 
      });
    }

    throw error;
  } finally {
    clearTimeout(id);
  }
}