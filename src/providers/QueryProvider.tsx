import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

// Configure Query Client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes default
      
      // GC time: How long unused data stays in cache
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      
      // Retry logic
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch behavior
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

// Prefetch utilities for hover optimization
export const prefetchMovieDetails = (id: number, type: 'movie' | 'tv') => {
  queryClient.prefetchQuery({
    queryKey: ['details', type, id],
    queryFn: async () => {
      const { tmdb } = await import('@/services/tmdb');
      return tmdb.getDetails(id, type);
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Usage in MovieCard:
// onMouseEnter={() => prefetchMovieDetails(movie.id, type)}