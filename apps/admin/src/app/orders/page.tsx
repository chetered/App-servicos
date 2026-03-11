'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { DataTable, Column, Pagination } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

const STATUS_TABS = [
  { key: '', label: 'Todos' },
  { key: 'PENDING_PAYMENT', label: 'Aguardando' },
  { key: 'IN_PROGRESS', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'Concluídos' },
  { key: 'IN_DISPUTE', label: 'Disputas' },
  { key: 'CANCELLED_BY_PROVIDER', label: 'Cancelados' },
];

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function OrdersPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', status, page],
    queryFn: () => ordersApi.list({ status: status || undefined, page, limit: 50 }),
  });

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<any>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => (
        <span className="font-mono text-xs text-gray-400">{row.id.slice(0, 8)}…</span>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.client?.fullName}</p>
          <p className="text-xs text-gray-400">{row.client?.email}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Profissional',
      render: (row) => (
        <span className="text-sm text-gray-700">{row.provider?.user?.fullName}</span>
      ),
    },
    {
      key: 'service',
      header: 'Serviço',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {typeof row.service?.name === 'object' ? row.service.name['pt-BR'] : row.service?.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalAmount',
      header: 'Valor',
      render: (row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Data',
      render: (row) => (
        <span className="text-sm text-gray-400">
          {new Date(row.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total.toLocaleString()} pedidos no total
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              status === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum pedido encontrado"
        onRowClick={(row) => router.push(`/orders/${row.id}`)}
      />

      <Pagination page={page} total={total} limit={50} onChange={setPage} />
    </div>
  );
}
