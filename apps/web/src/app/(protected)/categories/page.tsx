'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CategoryDto } from '@servicos/types';

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/v1/categories').then((r) => r.data),
  });

  const categories: CategoryDto[] = data?.data ?? [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categorias de Serviços</h1>
          <p className="text-gray-500 mt-1">
            {isLoading ? 'Carregando...' : `${categories.length} categorias cadastradas`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📂</p>
            <p className="text-lg font-medium">Nenhuma categoria cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    {cat.iconUrl ? (
                      <img src={cat.iconUrl} alt={cat.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-2xl">📂</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                    {(cat.commissionRate * 100).toFixed(0)}% comissão
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-400 mb-1 font-mono">/{cat.slug}</p>
                {cat.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
                )}

                {/* Sub-categories */}
                {cat.children && cat.children.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-400 mb-2">Subcategorias</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.children.map((child) => (
                        <span key={child.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">
                          {child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
