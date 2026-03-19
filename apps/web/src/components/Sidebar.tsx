'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/bookings', label: 'Agendamentos', icon: '📅' },
  { href: '/providers', label: 'Prestadores', icon: '👷' },
  { href: '/categories', label: 'Categorias', icon: '📂' },
  { href: '/users', label: 'Usuários', icon: '👥' },
  { href: '/search', label: 'Buscar Serviços', icon: '🔍' },
];


export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/v1/auth/logout');
    } catch {
      // ignore
    }
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-xl">
            🔧
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">App Serviços</p>
            <p className="text-xs text-gray-400">Marketplace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-gray-100">
        {user && (
          <div className="mb-3 px-4 py-2">
            <p className="text-xs text-gray-400">Logado como</p>
            <p className="text-sm font-medium text-gray-700 truncate">{user.email ?? user.phone}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-lg">🚪</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
