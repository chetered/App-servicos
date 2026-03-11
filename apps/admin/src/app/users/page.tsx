'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '../../lib/api';
import { DataTable, Column, Pagination } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [banModal, setBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch, page],
    queryFn: () => usersApi.list({ search: debouncedSearch || undefined, page }),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.ban(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBanModal(null);
      setBanReason('');
      toast.success('Usuário banido');
    },
    onError: () => toast.error('Erro ao banir usuário'),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => usersApi.unban(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Usuário desbanido');
    },
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const users = data?.items ?? [];

  const columns: Column<any>[] = [
    {
      key: 'fullName',
      header: 'Usuário',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
            {row.fullName?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.fullName ?? 'Sem nome'}</p>
            <p className="text-xs text-gray-400">{row.email ?? row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Papel',
      render: (row) => (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {row.roles?.join(', ')}
        </span>
      ),
    },
    {
      key: 'provider',
      header: 'Profissional?',
      render: (row) => row.provider ? (
        <StatusBadge status={row.provider.status} />
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
    },
    {
      key: 'isBanned',
      header: 'Situação',
      render: (row) => (
        <span className={`text-xs font-medium ${row.isBanned ? 'text-red-600' : 'text-green-600'}`}>
          {row.isBanned ? '🚫 Banido' : '✓ Normal'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Cadastro',
      render: (row) => (
        <span className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString('pt-BR')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        row.isBanned ? (
          <button
            onClick={(e) => { e.stopPropagation(); unbanMutation.mutate(row.id); }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
          >
            <ShieldCheck className="w-3 h-3" /> Desbanir
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setBanModal(row.id); }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
          >
            <Ban className="w-3 h-3" /> Banir
          </button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.total?.toLocaleString() ?? '—'} usuários cadastrados
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum usuário encontrado"
      />
      {data && <Pagination page={page} total={data.total} limit={50} onChange={setPage} />}

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Banir usuário</h3>
            <p className="text-sm text-gray-600">Informe o motivo do banimento.</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Motivo do banimento..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setBanModal(null); setBanReason(''); }} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
              <button
                onClick={() => banMutation.mutate({ id: banModal, reason: banReason })}
                disabled={!banReason.trim() || banMutation.isPending}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40"
              >
                {banMutation.isPending ? 'Banindo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
