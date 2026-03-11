'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    section: 'Visão Geral',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '📊' },
      { label: 'Analytics', href: '/analytics', icon: '📈' },
    ],
  },
  {
    section: 'Operações',
    items: [
      { label: 'Pedidos', href: '/bookings', icon: '📋' },
      { label: 'Prestadores', href: '/providers', icon: '👷' },
      { label: 'Clientes', href: '/users', icon: '👥' },
      { label: 'Suporte', href: '/support', icon: '🎧' },
      { label: 'Disputas', href: '/disputes', icon: '⚖️' },
    ],
  },
  {
    section: 'Financeiro',
    items: [
      { label: 'Pagamentos', href: '/payments', icon: '💳' },
      { label: 'Repasses', href: '/payouts', icon: '💸' },
      { label: 'Comissões', href: '/commissions', icon: '📊' },
      { label: 'Receita', href: '/revenue', icon: '💰' },
    ],
  },
  {
    section: 'Catálogo',
    items: [
      { label: 'Categorias', href: '/categories', icon: '🗂️' },
      { label: 'Serviços', href: '/services', icon: '⚙️' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Cupons', href: '/coupons', icon: '🎫' },
      { label: 'Campanhas', href: '/campaigns', icon: '📣' },
      { label: 'Destaques', href: '/sponsored', icon: '⭐' },
    ],
  },
  {
    section: 'Configurações',
    items: [
      { label: 'Países', href: '/settings/countries', icon: '🌍' },
      { label: 'Gateways', href: '/settings/gateways', icon: '🔌' },
      { label: 'Feature Flags', href: '/settings/flags', icon: '🚩' },
      { label: 'Configurações', href: '/settings', icon: '⚙️' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">SERVIX</span>
              <span className="text-xs text-gray-500 block">Admin</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((section) => (
          <div key={section.section} className="mb-4">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@servix.app</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
