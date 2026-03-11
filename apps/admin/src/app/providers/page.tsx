'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { providersApi } from '../../lib/api';
import { DataTable, Column, Pagination } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function ProvidersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [actionProviderId, setActionProviderId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { data: pending, isLoading } = useQuery({
    queryKey: ['admin', 'providers', 'pending'],
    queryFn: providersApi.pending,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => providersApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      toast.success('Profissional aprovado!');
    },
    onError: () => toast.error('Erro ao aprovar'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      providersApi.reject(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      setActionProviderId(null);
      setRejectNotes('');
      toast.success('Profissional rejeitado');
    },
    onError: () => toast.error('Erro ao rejeitar'),
  });

  const providers = pending ?? [];

  const columns: Column<any>[] = [
    {
      key: 'user',
      header: 'Nome',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.user?.avatarUrl ? (
            <img src={row.user.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
              {row.user?.fullName?.charAt(0) ?? '?'}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{row.user?.fullName}</p>
            <p className="text-xs text-gray-400">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'documents',
      header: 'Documentos',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.documents?.length ?? 0} enviado(s)
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Cadastro',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.user?.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); approveMutation.mutate(row.id); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Aprovar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActionProviderId(row.id); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejeitar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie cadastros e aprovações de profissionais
          </p>
        </div>
        {providers.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-xl">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm font-semibold">{providers.length} aguardando revisão</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={providers}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum profissional aguardando revisão"
      />

      {/* Reject modal */}
      {actionProviderId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Rejeitar profissional</h3>
            <p className="text-sm text-gray-600">Informe o motivo da rejeição. O profissional será notificado.</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              rows={4}
              placeholder="Ex: Documentos ilegíveis. Por favor reenvie com melhor qualidade..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionProviderId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: actionProviderId, notes: rejectNotes })}
                disabled={!rejectNotes.trim() || rejectMutation.isPending}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40"
              >
                {rejectMutation.isPending ? 'Rejeitando...' : 'Confirmar rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
