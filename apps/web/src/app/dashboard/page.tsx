'use client';

interface StatsCard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

const statCards: StatsCard[] = [
  { title: 'GMV Mensal', value: 'R$ 0', change: '+0%', positive: true },
  { title: 'Agendamentos', value: '0', change: '+0%', positive: true },
  { title: 'Prestadores Ativos', value: '0', change: '+0%', positive: true },
  { title: 'NPS', value: '0', change: '+0 pts', positive: true },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Operacional</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((card) => (
            <div key={card.title} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
              <p className={`mt-1 text-sm ${card.positive ? 'text-green-600' : 'text-red-500'}`}>
                {card.change} vs mês anterior
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos Recentes</h2>
            <p className="text-gray-400 text-sm">Conecte à API para visualizar dados reais</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Prestadores (Score IA)</h2>
            <p className="text-gray-400 text-sm">Conecte à API para visualizar dados reais</p>
          </div>
        </div>
      </div>
    </div>
  );
}
