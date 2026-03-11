import { create } from 'zustand';
import { api } from '../services/api';

export interface Provider {
  id: string;
  status: string;
  bio?: string;
  averageRating: number;
  totalReviews: number;
  totalCompletedJobs: number;
  responseTimeMinutes?: number;
  rankingScore?: number;
  isFeatured: boolean;
  isPremium: boolean;
  isAvailableNow: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  serviceRadiusKm?: number;
  isSponsored?: boolean;
  user: { fullName: string; avatarUrl?: string };
  services: Array<{ service: { id: string; name: any; category: { name: any } } }>;
  pricingRules: Array<{ serviceId: string; basePrice: number }>;
  verification?: { status: string };
  sponsoredSlots?: any[];
}

export interface SearchParams {
  query?: string;
  categorySlug?: string;
  serviceSlug?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  bookingType?: 'IMMEDIATE' | 'SCHEDULED';
  page?: number;
  limit?: number;
}

interface MarketplaceStore {
  // Provider search
  providers: Provider[];
  totalProviders: number;
  isSearching: boolean;
  lastSearchParams: SearchParams | null;
  currentPage: number;
  hasMore: boolean;

  // Provider profile cache
  providerProfiles: Record<string, Provider & { reviews: any[] }>;
  isLoadingProfile: boolean;

  // Featured
  featuredProviders: Provider[];

  // User location
  userLatitude?: number;
  userLongitude?: number;

  // Actions
  searchProviders: (params: SearchParams) => Promise<void>;
  loadMoreProviders: () => Promise<void>;
  loadProviderProfile: (id: string) => Promise<Provider & { reviews: any[] }>;
  loadFeatured: () => Promise<void>;
  setUserLocation: (lat: number, lng: number) => void;
}

export const useMarketplaceStore = create<MarketplaceStore>((set, get) => ({
  providers: [],
  totalProviders: 0,
  isSearching: false,
  lastSearchParams: null,
  currentPage: 1,
  hasMore: false,
  providerProfiles: {},
  isLoadingProfile: false,
  featuredProviders: [],

  searchProviders: async (params) => {
    set({ isSearching: true, lastSearchParams: params, currentPage: 1 });
    try {
      const result = await api.marketplace.search({ ...params, page: 1 });
      set({
        providers: result.items,
        totalProviders: result.total,
        hasMore: result.page < result.totalPages,
        isSearching: false,
      });
    } catch {
      set({ isSearching: false });
    }
  },

  loadMoreProviders: async () => {
    const { lastSearchParams, currentPage, isSearching, hasMore } = get();
    if (isSearching || !hasMore || !lastSearchParams) return;

    const nextPage = currentPage + 1;
    set({ isSearching: true });
    try {
      const result = await api.marketplace.search({ ...lastSearchParams, page: nextPage });
      set((state) => ({
        providers: [...state.providers, ...result.items],
        currentPage: nextPage,
        hasMore: nextPage < result.totalPages,
        isSearching: false,
      }));
    } catch {
      set({ isSearching: false });
    }
  },

  loadProviderProfile: async (id) => {
    const cached = get().providerProfiles[id];
    if (cached) return cached;

    set({ isLoadingProfile: true });
    try {
      const profile = await api.marketplace.getProvider(id);
      set((state) => ({
        providerProfiles: { ...state.providerProfiles, [id]: profile },
        isLoadingProfile: false,
      }));
      return profile;
    } catch {
      set({ isLoadingProfile: false });
      throw new Error('Provider not found');
    }
  },

  loadFeatured: async () => {
    try {
      const result = await api.marketplace.featured();
      set({ featuredProviders: result });
    } catch {}
  },

  setUserLocation: (lat, lng) => set({ userLatitude: lat, userLongitude: lng }),
}));
