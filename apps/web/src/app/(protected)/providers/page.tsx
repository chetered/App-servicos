'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProviderDto } from '@servicos/types';

const verificationColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-600',
};

const verificationLabels: Record<string, string> = {
  PENDING: 'Pendente',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  EXPIRED: 'Expirado',
};

const planColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  BASIC: 'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-purple-100 text-purple-700',
  PREMIUM: 'bg-amber-100 text-amber-700',
};

export default function ProvidersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['providers', page],
    queryFn: () => api.get(`/v1/providers?page=${page}&perPage=12`).then((r) => r.data),
  });

  const providers: ProviderDto[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prestadores</h1>
            <p className="text-gray-500 mt-1">
              {meta ? `${meta.total} prestadores cadastrados` : 'Carregando...'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prestador..."
            className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">👷</p>
            <p className="text-lg font-medium">Nenhum prestador encontrado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers
                .filter((p) => {
                  if (!search) return true;
                  const profile = (p as unknown as { profile?: { firstName?: string; lastName?: string } }).profile;
                  const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.toLowerCase();
                  return name.includes(search.toLowerCase());
                })
                .map((p) => {
                  const profile = (p as unknown as { profile?: { firstName?: string; lastName?: string; avatarUrl?: string } }).profile;
                  return (
                    <div key={p.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
                          {profile?.firstName?.[0] ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {profile?.firstName ?? 'N/A'} {profile?.lastName ?? ''}
                          </p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-lg font-medium ${planColors[p.subscriptionPlan] ?? 'bg-gray-100 text-gray-600'}`}>
                            {p.subscriptionPlan}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-xl text-xs font-medium ${verificationColors[p.verificationStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                          {verificationLabels[p.verificationStatus] ?? p.verificationStatus}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="bg-gray-50 rounded-xl p-2">
                          <p className="text-lg font-bold text-gray-900">⭐ {p.overallRating?.toFixed(1) ?? '-'}</p>
                          <p className="text-xs text-gray-400">{p.totalReviews ?? 0} avaliações</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2">
                          <p className="text-lg font-bold text-gray-900">{p.completionRate ? `${Math.round(p.completionRate * 100)}%` : '-'}</p>
                          <p className="text-xs text-gray-400">Conclusão</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2">
                          <p className="text-lg font-bold text-gray-900">{p.totalCompletions ?? 0}</p>
                          <p className="text-xs text-gray-400">Serviços</p>
                        </div>
                      </div>

                      {/* Categories */}
                      {p.categories && p.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {p.categories.slice(0, 3).map((c) => (
                            <span key={c.id} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-lg">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Available / Radius */}
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${p.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                          {p.isAvailable ? '🟢 Disponível' : '⚫ Indisponível'}
                        </span>
                        <span className="text-gray-400">📍 {p.serviceRadiusKm ?? 0} km</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPrevPage}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {meta.page} de {meta.totalPages}
                </span>
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
