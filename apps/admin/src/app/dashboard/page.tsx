/**
 * SERVIX Admin — Dashboard Principal
 * Métricas em tempo real: GMV, pedidos, prestadores, receita
 */
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Simplified UI components (in production: use shadcn/ui)
const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const MetricCard = ({
  title,
  value,
  change,
  icon,
  color = 'purple',
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
  color?: string;
}) => {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
            {change} vs ontem
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; class: string }> = {
    COMPLETED: { label: 'Concluído', class: 'bg-green-100 text-green-700' },
    IN_PROGRESS: { label: 'Em andamento', class: 'bg-blue-100 text-blue-700' },
    PENDING_PAYMENT: { label: 'Aguardando pagamento', class: 'bg-yellow-100 text-yellow-700' },
    CANCELLED_BY_CLIENT: { label: 'Cancelado', class: 'bg-red-100 text-red-700' },
    PAID: { label: 'Pago', class: 'bg-purple-100 text-purple-700' },
    IN_DISPUTE: { label: 'Em disputa', class: 'bg-red-100 text-red-700' },
  };

  const { label, class: cls } = config[status] || { label: status, class: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

// Mock data for development
const mockMetrics = {
  gmv: { value: 'R$ 1.284.500', change: '+12.4%' },
  orders: { value: '3.847', change: '+8.2%' },
  activeProviders: { value: '842', change: '+15.7%' },
  takeRate: { value: 'R$ 256.900', change: '+11.1%' },
  avgTicket: { value: 'R$ 334', change: '+3.8%' },
  completionRate: { value: '92.4%', change: '+1.2%' },
  cancellationRate: { value: '5.1%', change: '-0.8%' },
  newUsers: { value: '1.243', change: '+22.3%' },
};

const mockRecentOrders = [
  { id: 'ORD-001', client: 'Ana Costa', provider: 'Maria Silva', service: 'Faxina Completa', amount: 'R$ 240', status: 'COMPLETED' },
  { id: 'ORD-002', client: 'Pedro Santos', provider: 'João Elétrica', service: 'Instalação Tomada', amount: 'R$ 180', status: 'IN_PROGRESS' },
  { id: 'ORD-003', client: 'Sofia Lima', provider: 'Carlos Reparo', service: 'Pequenos Reparos', amount: 'R$ 150', status: 'PENDING_PAYMENT' },
  { id: 'ORD-004', client: 'Roberto Alves', provider: 'Ana Jardins', service: 'Corte de Grama', amount: 'R$ 120', status: 'PAID' },
  { id: 'ORD-005', client: 'Carla Souza', provider: '-', service: 'Diarista', amount: 'R$ 200', status: 'IN_DISPUTE' },
];

const mockPendingProviders = [
  { id: '1', name: 'Fernanda Rodrigues', category: 'Babá', submittedAt: 'há 2h', documents: 3 },
  { id: '2', name: 'Marcos Pereira', category: 'Eletricista', submittedAt: 'há 5h', documents: 4 },
  { id: '3', name: 'Luciana Santos', category: 'Cuidadora', submittedAt: 'há 8h', documents: 3 },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('today');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Métricas em tempo real — Brasil · {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range === 'today' ? 'Hoje' : range === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="GMV Total"
          value={mockMetrics.gmv.value}
          change={mockMetrics.gmv.change}
          icon="💰"
          color="purple"
        />
        <MetricCard
          title="Pedidos"
          value={mockMetrics.orders.value}
          change={mockMetrics.orders.change}
          icon="📋"
          color="blue"
        />
        <MetricCard
          title="Receita da Plataforma"
          value={mockMetrics.takeRate.value}
          change={mockMetrics.takeRate.change}
          icon="📈"
          color="green"
        />
        <MetricCard
          title="Novos Usuários"
          value={mockMetrics.newUsers.value}
          change={mockMetrics.newUsers.change}
          icon="👥"
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Ticket Médio</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{mockMetrics.avgTicket.value}</p>
          <p className="text-xs text-green-600 font-medium mt-1">{mockMetrics.avgTicket.change}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Taxa de Conclusão</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{mockMetrics.completionRate.value}</p>
          <p className="text-xs text-green-600 font-medium mt-1">{mockMetrics.completionRate.change}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Cancelamentos</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{mockMetrics.cancellationRate.value}</p>
          <p className="text-xs text-green-600 font-medium mt-1">{mockMetrics.cancellationRate.change}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Prestadores Ativos</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{mockMetrics.activeProviders.value}</p>
          <p className="text-xs text-green-600 font-medium mt-1">{mockMetrics.activeProviders.change}</p>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Pedidos Recentes</h2>
              <a href="/bookings" className="text-sm text-purple-600 font-medium hover:underline">
                Ver todos →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">ID</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Cliente</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Serviço</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Valor</th>
                    <th className="text-left py-2 text-gray-500 font-medium pl-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mockRecentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="py-3 font-mono text-xs text-gray-500">{order.id}</td>
                      <td className="py-3 font-medium text-gray-900">{order.client}</td>
                      <td className="py-3 text-gray-600">{order.service}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">{order.amount}</td>
                      <td className="py-3 pl-4">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Pending Providers */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Aguardando Aprovação
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {mockPendingProviders.length}
                </span>
              </h2>
              <a href="/providers?status=PENDING_REVIEW" className="text-sm text-purple-600 font-medium">
                Ver todos
              </a>
            </div>
            <div className="space-y-3">
              {mockPendingProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-purple-50 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{provider.name}</p>
                    <p className="text-xs text-gray-500">{provider.category} · {provider.submittedAt}</p>
                    <p className="text-xs text-gray-400">{provider.documents} documentos</p>
                  </div>
                  <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">
                    Revisar
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Novo Cupom', icon: '🎫', href: '/settings/coupons/new' },
                { label: 'Feature Flag', icon: '🚩', href: '/settings/flags' },
                { label: 'Ver Disputas', icon: '⚖️', href: '/support?type=dispute' },
                { label: 'Repasses', icon: '💸', href: '/payments/payouts' },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
