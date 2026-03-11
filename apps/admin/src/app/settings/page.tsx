'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { featureFlagsApi } from '../../lib/api';

const STATUS_CYCLE: Record<string, string> = {
  ENABLED: 'DISABLED',
  DISABLED: 'ENABLED',
  ROLLOUT: 'ENABLED',
};

const FLAG_LABELS: Record<string, { label: string; desc: string }> = {
  pix_enabled: { label: 'Pagamento via PIX', desc: 'Habilita método de pagamento PIX' },
  chat_enabled: { label: 'Chat em tempo real', desc: 'Habilita chat entre cliente e profissional' },
  insurance_enabled: { label: 'Seguro do serviço', desc: 'Opção de seguro na hora do pedido' },
  recurring_enabled: { label: 'Serviços recorrentes', desc: 'Planos de assinatura semanal/mensal' },
  sponsored_enabled: { label: 'Slots patrocinados', desc: 'Destaque pago para profissionais' },
  corporate_enabled: { label: 'Planos corporativos', desc: 'Contas empresariais com fatura' },
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const [country, setCountry] = useState('');

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin', 'flags', country],
    queryFn: () => featureFlagsApi.list(country || undefined),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, countryId, status }: { key: string; countryId: string | null; status: string }) =>
      featureFlagsApi.toggle(key, countryId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'flags'] });
      toast.success('Feature flag atualizada');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const flagList: any[] = flags ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">Feature flags e configurações globais da plataforma</p>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-600" />
            <h2 className="font-semibold text-gray-900">Feature Flags</h2>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Global</option>
              <option value="BR">Brasil</option>
              <option value="US">EUA</option>
              <option value="AR">Argentina</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : flagList.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhuma feature flag encontrada</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {flagList.map((flag) => {
              const meta = FLAG_LABELS[flag.key] ?? { label: flag.key, desc: flag.description ?? '' };
              const isEnabled = flag.status === 'ENABLED';

              return (
                <div key={flag.id} className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium text-gray-900">{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                    <span className={`inline-flex items-center mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      isEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {flag.status}
                      {flag.rolloutPercentage && ` (${flag.rolloutPercentage}%)`}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({
                      key: flag.key,
                      countryId: flag.countryId,
                      status: STATUS_CYCLE[flag.status] ?? 'ENABLED',
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isEnabled ? 'bg-violet-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
