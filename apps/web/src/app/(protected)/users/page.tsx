'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UserDto } from '@servicos/types';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
  BANNED: 'bg-red-200 text-red-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
  BANNED: 'Banido',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => api.get(`/v1/users?page=${page}&perPage=15`).then((r) => r.data),
  });

  const users: UserDto[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">
            {meta ? `${meta.total} usuários cadastrados` : 'Carregando...'}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-lg font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Contato</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                            {u.profile?.firstName?.[0] ?? u.email?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'Sem perfil'}
                            </p>
                            <p className="text-xs font-mono text-gray-400">#{u.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {u.email && <p className="text-sm text-gray-700">{u.email}</p>}
                        {u.phone && <p className="text-sm text-gray-500">{u.phone}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[u.status] ?? u.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPrevPage}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Página {meta.page} de {meta.totalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasNextPage}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
