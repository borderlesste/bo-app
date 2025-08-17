import { useState, useEffect, useCallback, useRef } from 'react';

// Simple query cache implementation
const queryCache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// Cache entry structure: { data, timestamp, error, isLoading }
const getCacheKey = (key, params) => {
  return JSON.stringify({ key, params });
};

const isStale = (timestamp) => {
  return Date.now() - timestamp > STALE_TIME;
};

const isExpired = (timestamp) => {
  return Date.now() - timestamp > CACHE_TIME;
};

const useOptimizedQuery = (key, queryFn, options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    retry = 3,
    retryDelay = 1000,
    staleTime = STALE_TIME,
    cacheTime = CACHE_TIME,
    onSuccess,
    onError,
    params = {}
  } = options;

  const cacheKey = getCacheKey(key, params);
  const retryCount = useRef(0);
  const abortController = useRef(null);

  const [state, setState] = useState(() => {
    const cached = queryCache.get(cacheKey);
    if (cached && !isExpired(cached.timestamp)) {
      return {
        data: cached.data,
        error: cached.error,
        isLoading: cached.isLoading || isStale(cached.timestamp),
        isError: !!cached.error,
        isSuccess: !!cached.data && !cached.error,
        isStale: isStale(cached.timestamp)
      };
    }
    return {
      data: undefined,
      error: null,
      isLoading: enabled,
      isError: false,
      isSuccess: false,
      isStale: false
    };
  });

  const executeQuery = useCallback(async (retryAttempt = 0) => {
    if (!enabled) return;

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await queryFn({ signal, ...params });
      
      if (signal.aborted) return;

      const newState = {
        data: result,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isStale: false
      };

      setState(newState);

      // Update cache
      queryCache.set(cacheKey, {
        data: result,
        error: null,
        isLoading: false,
        timestamp: Date.now()
      });

      retryCount.current = 0;
      if (onSuccess) onSuccess(result);

    } catch (error) {
      if (signal.aborted) return;

      console.error(`Query error for ${key}:`, error);

      // Retry logic
      if (retryAttempt < retry) {
        retryCount.current = retryAttempt + 1;
        setTimeout(() => {
          executeQuery(retryAttempt + 1);
        }, retryDelay * Math.pow(2, retryAttempt)); // Exponential backoff
        return;
      }

      const errorState = {
        data: undefined,
        error: error,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isStale: false
      };

      setState(errorState);

      // Update cache with error
      queryCache.set(cacheKey, {
        data: undefined,
        error: error,
        isLoading: false,
        timestamp: Date.now()
      });

      if (onError) onError(error);
    }
  }, [key, queryFn, enabled, retry, retryDelay, cacheKey, onSuccess, onError, params]);

  const refetch = useCallback(() => {
    retryCount.current = 0;
    return executeQuery();
  }, [executeQuery]);

  const invalidate = useCallback(() => {
    queryCache.delete(cacheKey);
    if (enabled) {
      executeQuery();
    }
  }, [cacheKey, enabled, executeQuery]);

  // Execute query on mount or when dependencies change
  useEffect(() => {
    const cached = queryCache.get(cacheKey);
    
    if (!cached || isExpired(cached.timestamp)) {
      executeQuery();
    } else if (isStale(cached.timestamp) && enabled) {
      // Background refetch for stale data
      executeQuery();
    }
  }, [executeQuery, cacheKey, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = queryCache.get(cacheKey);
      if (cached && isStale(cached.timestamp)) {
        executeQuery();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, executeQuery, cacheKey]);

  return {
    ...state,
    refetch,
    invalidate
  };
};

// Utility function to clear all cache
export const clearQueryCache = () => {
  queryCache.clear();
};

// Utility function to invalidate specific queries
export const invalidateQueries = (keyPattern) => {
  for (const [key] of queryCache) {
    if (key.includes(keyPattern)) {
      queryCache.delete(key);
    }
  }
};

export default useOptimizedQuery;