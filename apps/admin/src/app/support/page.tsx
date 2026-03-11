'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supportApi } from '../../lib/api';
import { DataTable, Column, Pagination } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-gray-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600',
};

export default function SupportPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tickets', status, page],
    queryFn: () => supportApi.list({ status: status || undefined, page }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => supportApi.resolve(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      setSelectedTicket(null);
      toast.success('Ticket resolvido!');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, msg }: { id: string; msg: string }) => supportApi.message(id, msg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      setMessage('');
      toast.success('Mensagem enviada');
    },
  });

  const tickets = data?.items ?? [];

  const columns: Column<any>[] = [
    {
      key: 'subject',
      header: 'Assunto',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 line-clamp-1">{row.subject}</p>
          <p className="text-xs text-gray-400">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Usuário',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-700">{row.reporter?.fullName}</p>
          <p className="text-xs text-gray-400">{row.reporter?.email}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridade',
      render: (row) => (
        <span className={`text-sm font-semibold ${PRIORITY_COLOR[row.priority] ?? ''}`}>
          {row.priority}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt',
      header: 'Aberto em',
      render: (row) => (
        <span className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString('pt-BR')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTicket(row); }}
          className="px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100"
        >
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
        <p className="text-sm text-gray-500 mt-1">Tickets e disputas</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'OPEN', label: 'Abertos' },
          { key: 'IN_PROGRESS', label: 'Em andamento' },
          { key: 'AWAITING_CLIENT', label: 'Ag. cliente' },
          { key: 'RESOLVED', label: 'Resolvidos' },
          { key: '', label: 'Todos' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              status === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum ticket encontrado"
        onRowClick={setSelectedTicket}
      />
      {data && <Pagination page={page} total={data.total} limit={50} onChange={setPage} />}

      {/* Ticket detail drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-400">{selectedTicket.category} · <StatusBadge status={selectedTicket.status} /></p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Descrição</p>
                <p className="text-sm text-gray-700">{selectedTicket.description}</p>
              </div>
              {selectedTicket.messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-3 ${msg.authorType === 'SUPPORT' ? 'bg-violet-50 ml-8' : 'bg-gray-50 mr-8'}`}
                >
                  <p className="text-xs font-semibold text-gray-500 mb-1">{msg.authorType}</p>
                  <p className="text-sm text-gray-700">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply + resolve */}
            <div className="p-4 border-t space-y-3">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={2}
                  placeholder="Responder cliente..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  onClick={() => replyMutation.mutate({ id: selectedTicket.id, msg: message })}
                  disabled={!message.trim() || replyMutation.isPending}
                  className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                <button
                  onClick={() => resolveMutation.mutate({ id: selectedTicket.id, note: 'Resolvido pelo suporte' })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marcar como resolvido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
