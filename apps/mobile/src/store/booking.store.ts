import { create } from 'zustand';
import { api } from '../services/api';

export type BookingStatus =
  | 'PENDING_PAYMENT' | 'PAID' | 'ACCEPTED' | 'SCHEDULED'
  | 'IN_TRANSIT' | 'IN_PROGRESS' | 'COMPLETED'
  | 'CANCELLED_BY_CLIENT' | 'CANCELLED_BY_PROVIDER'
  | 'IN_DISPUTE' | 'REFUNDED';

export interface PriceBreakdown {
  label: string;
  amount: number;
  type: 'base' | 'fee' | 'discount' | 'total';
}

export interface BookingDraft {
  providerId: string;
  serviceId: string;
  bookingType: 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING';
  scheduledAt?: string;
  addressId?: string;
  paymentMethodId?: string;
  couponCode?: string;
  notes?: string;
  addInsurance?: boolean;
}

export interface PriceEstimate {
  servicePrice: number;
  displacementFee: number;
  urgencyFee: number;
  platformFee: number;
  couponDiscount: number;
  insuranceFee: number;
  totalAmount: number;
  currency: string;
  breakdown: PriceBreakdown[];
}

export interface Booking {
  id: string;
  status: BookingStatus;
  bookingType: string;
  scheduledAt?: string;
  completedAt?: string;
  totalAmount: number;
  currency: string;
  priceBreakdown: PriceBreakdown[];
  notes?: string;
  provider: {
    id: string;
    user: { fullName: string; avatarUrl?: string };
    averageRating: number;
  };
  service: { name: any };
  address: {
    street: string; number: string; neighborhood: string;
    city: string; state: string; postalCode: string;
  };
  createdAt: string;
}

interface BookingStore {
  // Active booking draft
  draft: BookingDraft | null;
  priceEstimate: PriceEstimate | null;
  isEstimating: boolean;

  // My bookings list
  bookings: Booking[];
  isLoadingBookings: boolean;
  activeBooking: Booking | null;

  // Actions
  setDraft: (draft: BookingDraft) => void;
  clearDraft: () => void;
  estimatePrice: (draft: BookingDraft) => Promise<PriceEstimate>;
  confirmBooking: (draft: BookingDraft) => Promise<Booking>;
  loadMyBookings: () => Promise<void>;
  loadBooking: (id: string) => Promise<Booking>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  draft: null,
  priceEstimate: null,
  isEstimating: false,
  bookings: [],
  isLoadingBookings: false,
  activeBooking: null,

  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null, priceEstimate: null }),

  estimatePrice: async (draft) => {
    set({ isEstimating: true });
    try {
      const estimate = await api.bookings.estimate(draft);
      set({ priceEstimate: estimate, isEstimating: false });
      return estimate;
    } catch (err) {
      set({ isEstimating: false });
      throw err;
    }
  },

  confirmBooking: async (draft) => {
    const booking = await api.bookings.create(draft);
    // Add to top of list
    set((state) => ({ bookings: [booking, ...state.bookings] }));
    return booking;
  },

  loadMyBookings: async () => {
    set({ isLoadingBookings: true });
    try {
      const { items } = await api.bookings.myBookings();
      set({ bookings: items, isLoadingBookings: false });
    } catch {
      set({ isLoadingBookings: false });
    }
  },

  loadBooking: async (id) => {
    const booking = await api.bookings.getOne(id);
    set({ activeBooking: booking });
    return booking;
  },

  cancelBooking: async (id, reason) => {
    await api.bookings.cancel(id, reason);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'CANCELLED_BY_CLIENT' as BookingStatus } : b
      ),
    }));
  },
}));
