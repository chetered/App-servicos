'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BookingDto, ProviderDto, CategoryDto } from '@servicos/types';

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  );
}

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
  CANCELLED_CLIENT: 'Canc. Cliente',
  CANCELLED_PROVIDER: 'Canc. Prestador',
  CANCELLED_SYSTEM: 'Canc. Sistema',
  DISPUTED: 'Em Disputa',
  REFUNDED: 'Reembolsado',
};

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const { data: bookingsRes, isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/v1/bookings?perPage=8').then((r) => r.data),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/v1/categories').then((r) => r.data),
  });

  const { data: providersRes } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get('/v1/providers?perPage=5').then((r) => r.data),
  });

  const bookings: BookingDto[] = bookingsRes?.data ?? [];
  const categories: CategoryDto[] = categoriesRes?.data ?? [];
  const providers: ProviderDto[] = providersRes?.data ?? [];

  const totalBookings = bookingsRes?.meta?.total ?? bookings.length;
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
  const totalGMV = bookings.reduce((sum, b) => sum + (b.totalCents ?? 0), 0);
  const activeProviders = providers.filter((p) => p.isAvailable).length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Operacional</h1>
        <p className="text-gray-500 mb-8">Visão geral da plataforma</p>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="GMV (últimos agend.)" value={formatBRL(totalGMV)} sub="Volume transacionado" icon="💰" />
          <StatCard title="Total Agendamentos" value={String(totalBookings)} sub={`${completedBookings} concluídos`} icon="📅" />
          <StatCard title="Prestadores Carregados" value={String(providers.length)} sub={`${activeProviders} disponíveis`} icon="👷" />
          <StatCard title="Categorias" value={String(categories.length)} sub="Tipos de serviço" icon="📂" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent bookings */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos Recentes</h2>
            {loadingBookings ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum agendamento encontrado</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 6).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                        #{b.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(b.scheduledAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">{formatBRL(b.totalCents)}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[b.status] ?? b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Providers */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prestadores</h2>
            {providers.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum prestador carregado</p>
            ) : (
              <div className="space-y-3">
                {providers.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700">
                        {(p as unknown as { profile?: { firstName?: string } }).profile?.firstName?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(p as unknown as { profile?: { firstName?: string; lastName?: string } }).profile?.firstName ?? 'Prestador'}{' '}
                          {(p as unknown as { profile?: { lastName?: string } }).profile?.lastName ?? ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          ⭐ {p.overallRating?.toFixed(1) ?? 'N/A'} · {p.totalReviews ?? 0} avaliações
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isAvailable ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorias de Serviços</h2>
            {categories.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma categoria cadastrada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium">
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/bookings', label: 'Ver Agendamentos', icon: '📅' },
                { href: '/providers', label: 'Ver Prestadores', icon: '👷' },
                { href: '/categories', label: 'Ver Categorias', icon: '📂' },
                { href: '/search', label: 'Buscar Serviços', icon: '🔍' },
                { href: '/users', label: 'Ver Usuários', icon: '👥' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span>{item.icon}</span> {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
