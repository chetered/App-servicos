'use client';

import { clsx } from 'clsx';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Orders
  PENDING_PAYMENT: { label: 'Aguardando pagamento', className: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Pago', className: 'bg-blue-100 text-blue-800' },
  ACCEPTED: { label: 'Aceito', className: 'bg-blue-100 text-blue-800' },
  SCHEDULED: { label: 'Agendado', className: 'bg-purple-100 text-purple-800' },
  IN_TRANSIT: { label: 'A caminho', className: 'bg-indigo-100 text-indigo-800' },
  IN_PROGRESS: { label: 'Em andamento', className: 'bg-cyan-100 text-cyan-800' },
  COMPLETED: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  CANCELLED_BY_CLIENT: { label: 'Cancelado (cliente)', className: 'bg-gray-100 text-gray-600' },
  CANCELLED_BY_PROVIDER: { label: 'Cancelado (prof.)', className: 'bg-red-100 text-red-700' },
  IN_DISPUTE: { label: 'Em disputa', className: 'bg-orange-100 text-orange-800' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-600' },

  // Providers
  PENDING_REVIEW: { label: 'Aguardando revisão', className: 'bg-yellow-100 text-yellow-800' },
  UNDER_REVIEW: { label: 'Em revisão', className: 'bg-blue-100 text-blue-800' },
  ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-red-100 text-red-700' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },

  // Payments
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  SUCCEEDED: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Falhou', className: 'bg-red-100 text-red-800' },

  // Payouts
  PROCESSING: { label: 'Processando', className: 'bg-blue-100 text-blue-800' },

  // Support
  OPEN: { label: 'Aberto', className: 'bg-yellow-100 text-yellow-800' },
  RESOLVED: { label: 'Resolvido', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Fechado', className: 'bg-gray-100 text-gray-600' },
  AWAITING_CLIENT: { label: 'Ag. cliente', className: 'bg-orange-100 text-orange-800' },
  AWAITING_PROVIDER: { label: 'Ag. profissional', className: 'bg-orange-100 text-orange-800' },

  // Users
  true: { label: 'Banido', className: 'bg-red-100 text-red-800' },
  false: { label: 'Normal', className: 'bg-green-100 text-green-800' },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
