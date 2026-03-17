import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-primary-500 p-4">
          <span className="text-4xl">🔧</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">App Serviços</h1>
        <p className="mb-8 text-xl text-gray-600">
          Marketplace inteligente de serviços domésticos e profissionais
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="rounded-xl bg-primary-600 px-6 py-4 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Dashboard Admin
          </Link>
          <Link
            href="/api/docs"
            className="rounded-xl border-2 border-primary-600 px-6 py-4 text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
          >
            API Docs (Swagger)
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Categorias', value: '8+', icon: '📂' },
            { label: 'Score IA', value: '8 fatores', icon: '🤖' },
            { label: 'Uptime SLA', value: '99.9%', icon: '⚡' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
