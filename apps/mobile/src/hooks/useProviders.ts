import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useProviderProfile(id: string) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => api.marketplace.getProvider(id),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });
}

export function useFeaturedProviders() {
  return useQuery({
    queryKey: ['providers', 'featured'],
    queryFn: () => api.marketplace.featured(),
    staleTime: 5 * 60_000,
  });
}

export function useSearchProviders(params: any) {
  return useQuery({
    queryKey: ['providers', 'search', params],
    queryFn: () => api.marketplace.search(params),
    staleTime: 30_000,
  });
}
