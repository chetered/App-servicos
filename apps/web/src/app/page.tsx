import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <span className="font-bold text-gray-900 text-lg">App Serviços</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-block bg-green-50 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-green-100">
          Marketplace de serviços #1 do Brasil
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Conecte-se com os melhores
          <br />
          <span className="text-green-600">prestadores de serviços</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Encontre profissionais verificados para serviços domésticos e profissionais.
          Motor de matching inteligente com IA para a melhor combinação.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-lg shadow-sm"
          >
            Acessar Dashboard →
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors text-lg"
          >
            Criar conta grátis
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 border-y border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '8+', label: 'Categorias de serviço' },
            { value: '8', label: 'Fatores de score IA' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: 'JWT', label: 'Autenticação segura' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-green-600 mb-1">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Tudo que você precisa em um só lugar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🤖',
              title: 'Matching com IA',
              desc: 'Motor de busca inteligente que avalia 8 fatores para recomendar o prestador ideal para cada serviço.',
            },
            {
              icon: '✅',
              title: 'Prestadores Verificados',
              desc: 'Todos os prestadores passam por verificação de documentos, antecedentes e avaliação de qualidade.',
            },
            {
              icon: '💳',
              title: 'Pagamentos Seguros',
              desc: 'Integração com Asaas e PagSeguro. Carteira digital para prestadores com repasse automático.',
            },
            {
              icon: '📅',
              title: 'Agendamento Fácil',
              desc: 'Agende serviços recorrentes ou pontuais. Acompanhe status em tempo real com notificações.',
            },
            {
              icon: '⭐',
              title: 'Sistema de Avaliações',
              desc: 'Avalie prestadores após cada serviço. Score bayesiano garante imparcialidade nas notas.',
            },
            {
              icon: '📊',
              title: 'Dashboard Completo',
              desc: 'Painel administrativo com métricas de GMV, NPS, agendamentos e desempenho de prestadores.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <span className="text-4xl block mb-4">{f.icon}</span>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h2>
          <p className="text-green-100 text-lg mb-8">
            Acesse o dashboard ou explore a documentação da API.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors"
            >
              Dashboard Admin
            </Link>
            <Link
              href="/api/docs"
              className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              API Docs (Swagger)
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>App Serviços — Marketplace de serviços domésticos e profissionais</p>
      </footer>
    </main>
  );
}
