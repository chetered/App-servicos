'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, payoutsApi } from '../../lib/api';
import { MetricCard } from '../../components/ui/MetricCard';
import { DataTable, Column, Pagination } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const SOURCE_LABELS: Record<string, string> = {
  COMMISSION: 'Comissão',
  URGENCY_FEE: 'Taxa urgência',
  DISPLACEMENT_FEE: 'Deslocamento',
  INSURANCE_FEE: 'Seguro',
  SPONSORED_SLOT: 'Patrocínio',
  PREMIUM_SUBSCRIPTION: 'Premium',
  CONVENIENCE_FEE: 'Conveniência',
};

const COLORS = ['#6C47FF', '#FF6B47', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function FinancePage() {
  const qc = useQueryClient();
  const [days, setDays] = useState(30);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutStatus, setPayoutStatus] = useState('PENDING');

  const { data: revenue } = useQuery({
    queryKey: ['admin', 'revenue', days],
    queryFn: () => adminApi.revenueBySource(days),
  });

  const { data: series } = useQuery({
    queryKey: ['admin', 'series', days],
    queryFn: () => adminApi.ordersSeries(days),
  });

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin', 'payouts', payoutStatus, payoutPage],
    queryFn: () => payoutsApi.list({ status: payoutStatus, page: payoutPage }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payoutsApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'payouts'] }); toast.success('Repasse aprovado!'); },
    onError: () => toast.error('Erro ao aprovar repasse'),
  });

  const failMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => payoutsApi.fail(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'payouts'] }); toast.success('Repasse marcado como falhou'); },
  });

  const totalRevenue = revenue?.reduce((sum: number, r: any) => sum + r.amount, 0) ?? 0;
  const totalGmv = series?.reduce((sum: number, d: any) => sum + d.gmv, 0) ?? 0;

  const pieData = revenue?.map((r: any, i: number) => ({
    name: SOURCE_LABELS[r.source] ?? r.source,
    value: r.amount,
    fill: COLORS[i % COLORS.length],
  })) ?? [];

  const payoutColumns: Column<any>[] = [
    {
      key: 'provider',
      header: 'Profissional',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.provider?.user?.fullName}</p>
          <p className="text-xs text-gray-400">{row.provider?.user?.email}</p>
        </div>
      ),
    },
    { key: 'amount', header: 'Valor', render: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span> },
    { key: 'method', header: 'Método', render: (row) => <span className="text-sm">{row.method}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt',
      header: 'Solicitado',
      render: (row) => <span className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString('pt-BR')}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => row.status === 'PENDING' ? (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); approveMutation.mutate(row.id); }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-3 h-3" /> Aprovar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); failMutation.mutate({ id: row.id, reason: 'Manual fail' }); }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg"
          >
            <XCircle className="w-3 h-3" /> Falha
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Receitas, repasses e análise financeira</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Receita total"
          value={formatCurrency(totalRevenue)}
          subtitle={`Últimos ${days} dias`}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="GMV"
          value={formatCurrency(totalGmv)}
          subtitle="Volume bruto processado"
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Take rate"
          value={totalGmv > 0 ? `${((totalRevenue / totalGmv) * 100).toFixed(1)}%` : '—'}
          subtitle="Receita / GMV"
          icon={<DollarSign className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GMV time series */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">GMV diário</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={series ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="gmv" fill="#6C47FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by source */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Receita por fonte</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Payouts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Repasses</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
              <button
                key={s}
                onClick={() => setPayoutStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  payoutStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 'PENDING' ? 'Pendentes' : s === 'PROCESSING' ? 'Processando' : s === 'COMPLETED' ? 'Concluídos' : 'Falhou'}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={payoutColumns}
          data={payoutsData?.items ?? []}
          isLoading={payoutsLoading}
          keyExtractor={(r) => r.id}
          emptyMessage="Nenhum repasse"
        />
        {payoutsData && (
          <Pagination page={payoutPage} total={payoutsData.total} limit={50} onChange={setPayoutPage} />
        )}
      </div>
    </div>
  );
}
