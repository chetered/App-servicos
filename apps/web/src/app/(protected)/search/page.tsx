'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProviderSearchResult, CategoryDto } from '@servicos/types';

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-gray-600 font-medium">{pct}%</span>
    </div>
  );
}

export default function SearchPage() {
  const [form, setForm] = useState({
    categoryId: '',
    latitude: '-23.5505',
    longitude: '-46.6333',
    scheduledAt: '',
    radiusKm: '20',
  });
  const [results, setResults] = useState<ProviderSearchResult[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/v1/categories').then((r) => r.data),
  });
  const categories: CategoryDto[] = categoriesData?.data ?? [];

  const search = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/v1/matching/search', {
        categoryId: payload.categoryId,
        latitude: parseFloat(payload.latitude),
        longitude: parseFloat(payload.longitude),
        scheduledAt: payload.scheduledAt || new Date().toISOString(),
        radiusKm: parseInt(payload.radiusKm),
      }).then((r) => r.data),
    onSuccess: (data) => setResults(data.data?.providers ?? data.providers ?? []),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return;
    search.mutate(form);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Buscar Prestadores</h1>
          <p className="text-gray-500 mt-1">Motor de matching com IA — encontre o prestador ideal</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="-23.5505"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="-46.6333"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Desejada</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raio (km)</label>
              <input
                type="number"
                name="radiusKm"
                value={form.radiusKm}
                onChange={handleChange}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={search.isPending || !form.categoryId}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {search.isPending ? '🔍 Buscando...' : '🔍 Buscar Prestadores'}
              </button>
            </div>
          </div>

          {search.isError && (
            <p className="mt-3 text-sm text-red-600">Erro ao buscar. Verifique os dados e tente novamente.</p>
          )}
        </form>

        {/* Results */}
        {results !== null && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {results.length === 0 ? 'Nenhum prestador encontrado' : `${results.length} prestadores encontrados`}
            </p>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-5xl mb-3">🔍</p>
                <p className="font-medium">Nenhum prestador disponível nessa região</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((p, idx) => {
                  const profile = p.profile;
                  const expanded = expandedId === p.id;
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>

                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700 shrink-0">
                            {profile?.firstName?.[0] ?? '?'}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">
                              {profile?.firstName ?? 'Prestador'} {profile?.lastName ?? ''}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                              <span>⭐ {p.overallRating?.toFixed(1) ?? '-'}</span>
                              <span>📍 {p.distanceKm?.toFixed(1)} km</span>
                              {p.estimatedPriceCents && (
                                <span>💰 {formatBRL(p.estimatedPriceCents)}</span>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-primary-600">
                              {Math.round((p.matchScore ?? 0) * 100)}
                            </div>
                            <p className="text-xs text-gray-400">Score IA</p>
                          </div>

                          {/* Expand */}
                          <button
                            onClick={() => setExpandedId(expanded ? null : p.id)}
                            className="text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            {expanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      {expanded && p.matchBreakdown && (
                        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Detalhamento do Score</p>
                          <div className="space-y-2">
                            <ScoreBar label="Distância" value={p.matchBreakdown.distanceScore} />
                            <ScoreBar label="Avaliação" value={p.matchBreakdown.ratingScore} />
                            <ScoreBar label="Conclusão" value={p.matchBreakdown.completionScore} />
                            <ScoreBar label="Aceitação" value={p.matchBreakdown.acceptanceScore} />
                            <ScoreBar label="Disponib." value={p.matchBreakdown.availabilityScore} />
                            <ScoreBar label="Confiança" value={p.matchBreakdown.trustScore} />
                            <ScoreBar label="Recorrência" value={p.matchBreakdown.recurrenceBonus} />
                            <ScoreBar label="Preço" value={p.matchBreakdown.priceCompetitiveness} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
