'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BookingDto, BookingStatus } from '@servicos/types';

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAYMENT_AUTHORIZED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROVIDER_EN_ROUTE: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED_CLIENT: 'bg-red-100 text-red-800',
  CANCELLED_PROVIDER: 'bg-red-100 text-red-800',
  CANCELLED_SYSTEM: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-orange-100 text-orange-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Aguard. Pagamento',
  PAYMENT_AUTHORIZED: 'Pagto. Autorizado',
  CONFIRMED: 'Confirmado',
  PROVIDER_EN_ROUTE: 'A Caminho',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED_CLIENT: 'Canc. pelo Cliente',
  CANCELLED_PROVIDER: 'Canc. pelo Prestador',
  CANCELLED_SYSTEM: 'Canc. pelo Sistema',
  DISPUTED: 'Em Disputa',
  REFUNDED: 'Reembolsado',
};

const nextActions: Partial<Record<BookingStatus, { label: string; status: string }[]>> = {
  CONFIRMED: [{ label: 'Iniciar', status: 'IN_PROGRESS' }, { label: 'Cancelar', status: 'CANCELLED_CLIENT' }],
  IN_PROGRESS: [{ label: 'Concluir', status: 'COMPLETED' }],
  PAYMENT_AUTHORIZED: [{ label: 'Confirmar', status: 'CONFIRMED' }, { label: 'Cancelar', status: 'CANCELLED_CLIENT' }],
};

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, filterStatus],
    queryFn: () =>
      api.get(`/v1/bookings?page=${page}&perPage=10${filterStatus ? `&status=${filterStatus}` : ''}`).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/v1/bookings/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const bookings: BookingDto[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-gray-500 mt-1">
              {meta ? `${meta.total} agendamentos no total` : 'Carregando...'}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-lg font-medium">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Data Agendada</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <p className="font-mono text-sm text-gray-700">#{b.id.slice(0, 8)}</p>
                        {b.clientNotes && (
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{b.clientNotes}</p>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-700">{formatDate(b.scheduledAt)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[b.status] ?? b.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-900">{formatBRL(b.totalCents)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {(nextActions[b.status] ?? []).map((action) => (
                            <button
                              key={action.status}
                              onClick={() => updateStatus.mutate({ id: b.id, status: action.status })}
                              disabled={updateStatus.isPending}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                action.status.startsWith('CANCEL')
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPrevPage}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Página {meta.page} de {meta.totalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasNextPage}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
