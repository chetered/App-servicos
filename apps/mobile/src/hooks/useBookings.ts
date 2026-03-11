import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { showMessage } from 'react-native-flash-message';

export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: () => api.bookings.myBookings(),
    staleTime: 30_000,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.bookings.getOne(id),
    enabled: !!id,
  });
}

export function useEstimatePrice() {
  return useMutation({
    mutationFn: api.bookings.estimate,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.bookings.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings', 'mine'] });
      showMessage({ message: 'Pedido realizado!', type: 'success' });
    },
    onError: (err: any) => {
      showMessage({
        message: err?.response?.data?.message ?? 'Erro ao criar pedido',
        type: 'danger',
      });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.bookings.cancel(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings', 'mine'] });
      showMessage({ message: 'Pedido cancelado', type: 'info' });
    },
  });
}
