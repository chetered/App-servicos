# SERVIX — Requisitos Funcionais e Não-Funcionais Completos
## v1.0

---

## REQUISITOS FUNCIONAIS

### RF001 — Cadastro e Autenticação
- RF001.1 Cadastro por e-mail com verificação de token
- RF001.2 Cadastro por número de telefone com OTP via SMS
- RF001.3 Login social via Google OAuth2
- RF001.4 Login social via Apple Sign In
- RF001.5 Autenticação por OTP de 6 dígitos com expiração de 10 minutos
- RF001.6 Recuperação de senha por e-mail com link temporário
- RF001.7 Sessão gerenciada por JWT Access Token (15min) + Refresh Token (30d)
- RF001.8 Rotação automática de Refresh Token a cada uso
- RF001.9 Logout com invalidação de tokens (blacklist no Redis)
- RF001.10 Suporte futuro a MFA por TOTP (estrutura preparada)
- RF001.11 Detecção de dispositivo novo com notificação de segurança
- RF001.12 Rate limiting por IP e por usuário em endpoints de auth

### RF002 — Perfis e Permissões
- RF002.1 Papel CLIENT: acesso a busca, contratação, histórico, favoritos
- RF002.2 Papel PROVIDER: acesso a agenda, ganhos, pedidos recebidos
- RF002.3 Papel ADMIN: acesso total ao painel administrativo
- RF002.4 Papel SUPPORT: acesso a tickets, disputas, pedidos
- RF002.5 Um usuário pode ter múltiplos papéis (ex: cliente e prestador)
- RF002.6 Permissões baseadas em RBAC com roles e permissions
- RF002.7 Perfil público do prestador visível sem autenticação
- RF002.8 Dados sensíveis mascarados por papel (telefone, documentos)

### RF003 — Onboarding do Prestador
- RF003.1 Fluxo guiado em etapas com progresso visual
- RF003.2 Upload de foto do rosto (selfie para verificação futura)
- RF003.3 Upload de documento de identidade (frente e verso)
- RF003.4 Upload de comprovante de endereço
- RF003.5 Seleção de categorias de serviço com subcategorias
- RF003.6 Campo de experiência e descrição profissional (max 500 chars)
- RF003.7 Configuração de raio de atendimento (km)
- RF003.8 Seleção de zonas/bairros/cidades de cobertura
- RF003.9 Definição de preço base por categoria e tipo de serviço
- RF003.10 Configuração de regra de deslocamento (sem/fixo/faixa/zona)
- RF003.11 Configuração de disponibilidade semanal por horário
- RF003.12 Cadastro de dados bancários para recebimento (PIX, conta)
- RF003.13 Status de verificação: pendente / em análise / aprovado / recusado
- RF003.14 Notificação de status de verificação por push e e-mail
- RF003.15 Possibilidade de reenvio de documentos em caso de recusa

### RF004 — Motor de Categorias Configuráveis
- RF004.1 Categorias e subcategorias gerenciadas pelo admin
- RF004.2 Campos customizáveis por categoria (ex: m² para faxina, idade do idoso para cuidadores)
- RF004.3 Requisitos específicos por serviço (certificados, equipamentos)
- RF004.4 Ativação/desativação de categorias por país via feature flag
- RF004.5 Ícone, cor e descrição por categoria
- RF004.6 Categorias podem ter múltiplos modelos de precificação
- RF004.7 Novas categorias adicionadas sem refatoração profunda

### RF005 — Busca e Descoberta
- RF005.1 Busca por categoria (lista e ícones na home)
- RF005.2 Busca textual por nome do profissional ou serviço
- RF005.3 Filtro por avaliação mínima (1-5 estrelas)
- RF005.4 Filtro por preço máximo
- RF005.5 Filtro por disponibilidade (agora / data específica)
- RF005.6 Filtro por distância máxima (km)
- RF005.7 Filtro por serviço urgente (disponível em < 2h)
- RF005.8 Filtro por aceita recorrência
- RF005.9 Ordenação por relevância, preço, avaliação, distância
- RF005.10 Resultados paginados com cursor-based pagination
- RF005.11 Busca geolocalizada com índice espacial

### RF006 — Geolocalização e Cobertura
- RF006.1 Múltiplos endereços salvos por cliente
- RF006.2 Endereço padrão definido pelo cliente
- RF006.3 Geolocalização do prestador em tempo real (opt-in)
- RF006.4 Raio de atendimento configurável por prestador
- RF006.5 Zonas de atendimento por polígono (cidade, bairro, CEP)
- RF006.6 Cálculo de distância entre endereço do cliente e prestador
- RF006.7 Validação de cobertura antes de exibir prestador
- RF006.8 Mapa de calor de demanda para admin
- RF006.9 Abstração de provedor de mapas (Google Maps / Mapbox / OpenStreetMap)

### RF007 — Precificação
- RF007.1 Preço base configurado pelo prestador por serviço
- RF007.2 Taxa de plataforma calculada automaticamente (configurável por país/categoria)
- RF007.3 Taxa de deslocamento calculada conforme regra do prestador
- RF007.4 Taxa de urgência aplicada para serviços com < 2h de antecedência
- RF007.5 Desconto por cupom válido aplicado no checkout
- RF007.6 Promoções automáticas por campanha ativa
- RF007.7 Breakdown detalhado no checkout: serviço + deslocamento + taxa + desconto + total
- RF007.8 Preço exibido na moeda local do país
- RF007.9 Histórico de preços por pedido para auditoria
- RF007.10 Sugestão de preço por região/categoria (preparado para ML futuro)

### RF008 — Motor de Deslocamento
- RF008.1 Sem cobrança de deslocamento
- RF008.2 Valor fixo de deslocamento (ex: R$10 sempre)
- RF008.3 Por faixa de distância (0-5km: R$5 / 5-10km: R$10 / etc)
- RF008.4 Por zona/bairro com tabela de preços configurável
- RF008.5 Embutido no total (aparece no breakdown mas some no total)
- RF008.6 Separado e destacado no checkout
- RF008.7 Regras diferentes por país e por categoria
- RF008.8 Cálculo auditável e registrado em `order_price_snapshot`

### RF009 — Contratação Imediata
- RF009.1 Fluxo de 3 passos: serviço → endereço → pagamento
- RF009.2 Seleção do profissional da lista ou aceite de qualquer disponível
- RF009.3 Definição ou confirmação do endereço de atendimento
- RF009.4 Definição de horário (imediato ou em até 4h)
- RF009.5 Resumo do pedido com breakdown de preço
- RF009.6 Seleção do método de pagamento salvo ou novo
- RF009.7 Confirmação e pagamento em um clique
- RF009.8 Status do pedido em tempo real após confirmação
- RF009.9 Notificação ao profissional com alerta sonoro
- RF009.10 Timeout: profissional tem 5min para aceitar, senão realocar

### RF010 — Agendamento Futuro
- RF010.1 Seleção de data futura no calendário do profissional
- RF010.2 Horários disponíveis baseados na agenda configurada
- RF010.3 Bloqueio automático do horário após confirmação
- RF010.4 Prevenção de conflito de agenda (double-booking)
- RF010.5 Lembretes automáticos: 24h e 1h antes para cliente e prestador
- RF010.6 Período de agendamento: até 60 dias à frente (configurável)
- RF010.7 Cancelamento com regras de antecedência configuráveis

### RF011 — Contratação Recorrente
- RF011.1 Opção de recorrência no checkout: semanal/quinzenal/mensal
- RF011.2 Seleção de profissional preferencial para recorrência
- RF011.3 Definição do dia e horário padrão para recorrência
- RF011.4 Plano recorrente criado com `RecurringServicePlan`
- RF011.5 Geração automática de `RecurringServiceExecution` por ciclo
- RF011.6 Cobrança automática preparada via `PaymentSchedule`
- RF011.7 Pausa temporária da recorrência pelo cliente
- RF011.8 Cancelamento de recorrência com política configurável
- RF011.9 Histórico completo de execuções da recorrência
- RF011.10 Substituição automática de profissional se indisponível

### RF012 — Pagamento no Momento da Contratação
- RF012.1 Abstração de gateway: interface única, múltiplos provedores
- RF012.2 Suporte a cartão de crédito/débito
- RF012.3 Suporte a carteira digital (Mercado Pago, PicPay, etc)
- RF012.4 Suporte a PIX (Brasil) e equivalentes por país
- RF012.5 Suporte a Apple Pay / Google Pay onde disponível
- RF012.6 Métodos locais configuráveis por país (OXXO, Efecty, etc)
- RF012.7 Idempotência garantida por `idempotency_key` único por pedido
- RF012.8 Pré-autorização com captura posterior ou captura imediata (configurável)
- RF012.9 Tokenização de cartão para pagamentos futuros
- RF012.10 Webhooks de gateway processados de forma idempotente
- RF012.11 Reprocessamento automático de webhooks com retry e DLQ

### RF013 — Split de Pagamento
- RF013.1 Split automático: plataforma retém comissão, resto vai ao prestador
- RF013.2 Cálculo do valor líquido do prestador registrado em `PaymentSplit`
- RF013.3 Comissão configurável por país, categoria e campanha
- RF013.4 Taxa adicional por tipo de monetização (urgência, destaque, etc)
- RF013.5 Log financeiro imutável de cada transação
- RF013.6 Reconciliação automática com dados do gateway

### RF014 — Comissão e Monetização
- RF014.1 Comissão percentual por serviço (configurável)
- RF014.2 Taxa fixa por transação (configurável)
- RF014.3 Taxa de conveniência por método de pagamento
- RF014.4 Taxa de urgência (% adicional para serviços imediatos)
- RF014.5 Destaque patrocinado: prestador paga por visibilidade extra
- RF014.6 Assinatura Premium do prestador (mensal/anual)
- RF014.7 Plano corporativo futuro (B2B)
- RF014.8 Proteção/seguro do serviço (futuro, estrutura preparada)
- RF014.9 Todas as fontes de receita rastreadas em `MonetizationLedger`

### RF015 — Gestão de Pedidos
- RF015.1 PENDING_PAYMENT: aguardando confirmação do pagamento
- RF015.2 PAID: pagamento confirmado, aguardando aceite
- RF015.3 ACCEPTED: profissional aceitou
- RF015.4 SCHEDULED: agendado para data futura
- RF015.5 IN_TRANSIT: profissional a caminho
- RF015.6 IN_PROGRESS: serviço em execução
- RF015.7 COMPLETED: serviço concluído e confirmado
- RF015.8 CANCELLED_BY_CLIENT: cancelado pelo cliente
- RF015.9 CANCELLED_BY_PROVIDER: cancelado pelo prestador
- RF015.10 IN_DISPUTE: em processo de disputa
- RF015.11 REFUNDED: reembolso processado
- RF015.12 Histórico de status com timestamp e ator em `OrderStatusHistory`

### RF016 — Chat e Comunicação
- RF016.1 Chat in-app entre cliente e prestador por pedido
- RF016.2 Mensagens automáticas de sistema (confirmação, chegada, etc)
- RF016.3 Notificações push via FCM para Android e iOS
- RF016.4 E-mail transacional para eventos críticos
- RF016.5 SMS futuro preparado (abstração de provider)
- RF016.6 Alertas operacionais para admin (disputas, fraudes)
- RF016.7 Histórico de mensagens vinculado ao pedido

### RF017 — Avaliações e Reputação
- RF017.1 Cliente avalia prestador após conclusão (1-5 estrelas + comentário)
- RF017.2 Prestador avalia cliente após conclusão (futuro, estrutura preparada)
- RF017.3 Nota média calculada e visível no perfil
- RF017.4 Avaliações com fotos (opcional)
- RF017.5 Moderação automática por palavras proibidas
- RF017.6 Moderação manual pelo suporte se necessário
- RF017.7 Flag de avaliação abusiva/falsa
- RF017.8 Resposta do prestador à avaliação
- RF017.9 Avaliação publicada apenas após período de disputa (24h)

### RF018 — Garantia e Confiança
- RF018.1 Perfil verificado com selo visual
- RF018.2 Badges: Verificado, Top Profissional, Recorrente, Confiável
- RF018.3 Indicadores de conclusão de serviço no perfil
- RF018.4 Histórico de serviços concluídos (quantidade)
- RF018.5 Suporte acessível pelo app em até 1 clique
- RF018.6 Abertura de disputa com evidências (fotos, mensagens)
- RF018.7 Garantia da plataforma: política clara de reembolso
- RF018.8 Proteção/seguro futuro vinculável ao pedido
- RF018.9 Logs de auditoria para todas as decisões críticas

### RF019 — Agenda do Profissional
- RF019.1 Disponibilidade configurada por dia da semana e horário
- RF019.2 Bloqueios manuais de datas específicas
- RF019.3 Horários de trabalho com início e fim
- RF019.4 Buffer entre serviços configurável (ex: 30min)
- RF019.5 Pausas configuráveis (almoço, intervalo)
- RF019.6 Agenda recorrente com padrão semanal
- RF019.7 Visualização da agenda em calendário no app
- RF019.8 Sync futuro com Google Calendar (estrutura preparada)

### RF020 — Carteira do Profissional
- RF020.1 Saldo disponível para saque
- RF020.2 Saldo em retenção (aguardando conclusão confirmada)
- RF020.3 Histórico de repasses por pedido
- RF020.4 Comissão descontada visível por pedido
- RF020.5 Extrato detalhado com filtro por período
- RF020.6 Comprovante de repasse disponível para download
- RF020.7 Solicitação de saque (D+1 ou D+2, configurável por país)
- RF020.8 Histórico de saques com status

### RF021 — Favoritos, Repetição e Fidelização
- RF021.1 Salvar prestador como favorito
- RF021.2 Lista de favoritos na home do cliente
- RF021.3 Recontratar de forma rápida a partir do histórico
- RF021.4 Repetir serviço com mesmo prestador e mesmas configurações
- RF021.5 Histórico de preferências por categoria
- RF021.6 Sugestões de recorrência baseadas no histórico

### RF022 — Cupons e Promoções
- RF022.1 Cupons por código com desconto % ou valor fixo
- RF022.2 Cupons por país, categoria, cliente específico ou campanha
- RF022.3 Cupons por região geográfica
- RF022.4 Data de validade por cupom
- RF022.5 Limite de uso total e por usuário
- RF022.6 Aplicação automática de promoção ativa no checkout
- RF022.7 Rastreamento de conversão por cupom/campanha

### RF023 — Cancelamento e Reembolso
- RF023.1 Política de cancelamento por antecedência (configurável por país)
- RF023.2 Cancelamento com > 24h: reembolso integral
- RF023.3 Cancelamento entre 24h e 2h: reembolso parcial (configurável)
- RF023.4 Cancelamento com < 2h: taxa de cancelamento
- RF023.5 Cancelamento pelo prestador: reembolso integral + penalidade
- RF023.6 Reembolso processado no mesmo gateway do pagamento
- RF023.7 Log imutável de decisão de cancelamento e reembolso

### RF024 — Suporte e Disputa
- RF024.1 Abertura de ticket a partir do pedido ou do menu
- RF024.2 Categorias de ticket: cancelamento, qualidade, pagamento, outro
- RF024.3 Upload de fotos/evidências no ticket
- RF024.4 Histórico e timeline do ticket
- RF024.5 Status do ticket: aberto / em análise / aguardando cliente / resolvido
- RF024.6 Decisão operacional registrada com ator e justificativa
- RF024.7 Escalonamento automático se não resolvido em SLA
- RF024.8 Auditoria completa de todas as decisões de suporte

### RF025 — Painel Administrativo
- RF025.1 Dashboard com métricas em tempo real
- RF025.2 Gestão de usuários (clientes e prestadores)
- RF025.3 Aprovação/reprovação de prestadores com comentário
- RF025.4 Gestão de categorias e subcategorias
- RF025.5 Gestão de países, moedas, idiomas
- RF025.6 Configuração de gateways de pagamento por país
- RF025.7 Configuração de taxas e comissões por país/categoria
- RF025.8 Gestão de repasses pendentes e processados
- RF025.9 Gestão de cupons e campanhas promocionais
- RF025.10 Configuração de destaque patrocinado
- RF025.11 Gestão de assinaturas premium de prestadores
- RF025.12 Analytics: GMV, take rate, pedidos, usuários, retentão
- RF025.13 Fila de disputas e decisão inline
- RF025.14 Log de auditoria pesquisável
- RF025.15 Feature flags por país/funcionalidade

### RF026 — Motor Multi-País
- RF026.1 Cada país tem suas próprias configurações em `Country`
- RF026.2 Idioma padrão por país
- RF026.3 Moeda e símbolo por país
- RF026.4 Timezone por país/cidade
- RF026.5 Gateway de pagamento padrão por país
- RF026.6 Regras de comissão por país
- RF026.7 Regras fiscais configuráveis por país
- RF026.8 Feature flags ativados/desativados por país
- RF026.9 Conteúdo legal (termos, privacidade) por país
- RF026.10 Categorias disponíveis por país
- RF026.11 Ativação/desativação de mercado pelo admin

### RF027 — Analytics e Inteligência
- RF027.1 Funil de cadastro: instalação → cadastro → onboarding → primeiro pedido
- RF027.2 Funil de contratação: busca → perfil → checkout → pagamento
- RF027.3 Conversão por categoria e por região
- RF027.4 Mapa de calor de demanda por zona geográfica
- RF027.5 Retenção por coorte: D7, D14, D30, D60, D90
- RF027.6 Taxa de recorrência por cliente e por profissional
- RF027.7 Ticket médio por categoria, região, período
- RF027.8 Take rate efetivo por campanha e por período
- RF027.9 GMV diário, semanal, mensal
- RF027.10 Taxa de cancelamento por motivo e por categoria
- RF027.11 Taxa de conclusão por prestador
- RF027.12 Tempo médio de aceite de pedido

### RF028 — Mecanismo de Ranking
- RF028.1 Avaliação média (peso alto)
- RF028.2 Taxa de aceite de pedidos (peso alto)
- RF028.3 Taxa de conclusão sem cancelamento (peso alto)
- RF028.4 Tempo médio de resposta (peso médio)
- RF028.5 Taxa de recorrência com clientes (peso médio)
- RF028.6 Confiabilidade (documentação completa e verificada)
- RF028.7 Distância do endereço do cliente (peso dinâmico)
- RF028.8 Aderência ao perfil do cliente (histórico compartilhado)
- RF028.9 Boost de destaque patrocinado (peso adicional, auditável)
- RF028.10 Score calculado e armazenado em `provider_ranking_scores`

### RF029 — Destaque Patrocinado
- RF029.1 Prestador contrata visibilidade adicional por período
- RF029.2 Priorização controlada no ranking de busca
- RF029.3 Badge "Destaque" visível na lista
- RF029.4 Regras de fair play: não esconder avaliação ruim
- RF029.5 Métricas de performance do destaque (impressões, cliques, conversões)
- RF029.6 Relatório de ROI disponível para o prestador

### RF030 — Premium para Prestadores
- RF030.1 Assinatura mensal ou anual
- RF030.2 Benefícios: mais visibilidade, relatórios avançados, badge premium
- RF030.3 Desconto na comissão da plataforma (ex: 20% → 15%)
- RF030.4 Acesso prioritário a novos pedidos
- RF030.5 Suporte prioritário
- RF030.6 Relatórios de performance detalhados
- RF030.7 Feature flags controlam benefícios por plano

### RF031 — Planos Corporativos (Futuro)
- RF031.1 Conta empresarial com CNPJ
- RF031.2 Múltiplos usuários por empresa
- RF031.3 Centros de custo para faturamento
- RF031.4 Relatórios consolidados da empresa
- RF031.5 Contratação recorrente para sedes/escritórios
- RF031.6 Fatura mensal consolidada
- RF031.7 Aprovação interna de pedidos (workflow)

### RF032 — Proteção/Seguro do Serviço
- RF032.1 Estrutura de `InsuranceProduct` preparada na modelagem
- RF032.2 Vinculação opcional ao pedido no checkout
- RF032.3 Valor adicional calculado sobre o total do serviço
- RF032.4 Regras por país e por categoria
- RF032.5 Parceria futura com seguradora (estrutura de webhook preparada)

### RF033 — Logs e Auditoria
- RF033.1 Log de todas as alterações críticas em `AuditLog`
- RF033.2 Rastreabilidade de regras financeiras (comissão, repasse, reembolso)
- RF033.3 Decisões administrativas com ator identificado
- RF033.4 Histórico completo de status de cada pedido
- RF033.5 Log de acesso a dados sensíveis
- RF033.6 Retenção de logs por 5 anos (configurável por país/LGPD)

---

## REQUISITOS NÃO FUNCIONAIS

### RNF001 — Performance Alta
- P95 de latência < 300ms para APIs de busca
- P95 de latência < 500ms para APIs de checkout
- P99 de latência < 1s para todas as APIs
- Cache de busca com TTL de 60s (Redis)
- CDN para assets estáticos

### RNF002 — Escalabilidade Horizontal
- Backend stateless (sem sessão em memória)
- Containerizado com Docker
- Preparado para Kubernetes em produção
- Banco com connection pooling (PgBouncer)
- Filas distribuídas com BullMQ + Redis

### RNF003 — Alta Disponibilidade
- SLA de 99.9% (< 8.7h downtime/ano)
- Health checks em todos os serviços
- Graceful shutdown implementado
- Banco com réplica de leitura
- Multi-AZ na nuvem

### RNF004 — Segurança e Criptografia
- TLS 1.3 em todas as conexões
- Dados sensíveis criptografados em repouso (AES-256)
- Tokens de pagamento nunca armazenados raw
- Secrets via variáveis de ambiente ou Vault
- Headers de segurança (HSTS, CSP, X-Frame-Options)

### RNF005 — Compliance LGPD/GDPR
- Consentimento explícito para dados opcionais
- Direito de exclusão de conta e dados
- Portabilidade de dados (export em JSON)
- Mascaramento de dados em logs
- DPO identificado na política de privacidade
- Retenção de dados configurável por tipo e país

### RNF006 — Multi-idioma
- i18n com chaves de tradução em todos os textos
- Suporte inicial: pt-BR, en-US, es-MX
- Fallback para idioma padrão
- Traduções gerenciadas via CMS ou arquivo externo

### RNF007 — Multi-moeda
- Moeda por país configurada em `Country`
- Formatação localizada (R$, $, €, etc)
- Taxa de câmbio futura via API externa
- Sem conversão automática no MVP

### RNF008 — Multi-timezone
- Todos os timestamps armazenados em UTC
- Conversão para timezone local na exibição
- Timezone por usuário ou por país
- Agendamentos validados no timezone local

### RNF009 — Arquitetura Modular e Evolutiva
- Modular monolith no MVP
- Domínios isolados com interfaces bem definidas
- Separação de concerns por camada (controller → service → repository)
- Preparado para extração de microsserviços por domínio

### RNF010 — Pronto para Multi-País
- Tudo configurável por `country_id`
- Nenhum hardcode de país, moeda ou idioma
- Feature flags por mercado
- Regras fiscais e de comissão por país

### RNF011 — Observabilidade
- Logs estruturados em JSON (Winston)
- Request ID em todos os logs
- Tracing distribuído preparado (OpenTelemetry)
- Métricas de negócio expostas
- Alertas configuráveis por threshold

### RNF012 — Testabilidade
- Cobertura de testes unitários > 80% nos serviços core
- Testes de integração para fluxos críticos (checkout, split, webhook)
- Testes e2e preparados
- Seed de dados de teste determinístico
- Mocks para gateways externos

### RNF013 — Resiliência
- Retry com exponential backoff para chamadas externas
- Circuit breaker para gateways de pagamento
- Dead Letter Queue para eventos não processados
- Timeout configurável por endpoint externo

### RNF014 — Idempotência em Pagamentos
- `idempotency_key` único por tentativa de pagamento
- Reprocessamento de webhook sem efeito duplo
- Transações verificadas antes de processar
- Estado de pagamento imutável após confirmação

### RNF015 — Configurabilidade por Feature Flags
- Feature flags gerenciados pelo admin por país
- Flags para funcionalidades: recorrência, destaque, premium, seguro
- Sem deploy para ativar/desativar features
- Flags com rollout gradual preparado

### RNF016 — Portabilidade Mobile + Web
- Mobile: React Native com Expo (iOS + Android)
- Web admin: Next.js (SSR + SSG)
- APIs REST consumidas por todos os clientes
- PWA considerado para versão web futura do cliente

### RNF017 — Acessibilidade
- WCAG 2.1 AA no painel admin web
- Tamanho mínimo de toque 44x44px no mobile
- Contraste de cores conforme padrão
- Labels acessíveis em todos os inputs

### RNF018 — Manutenibilidade
- Código documentado com JSDoc nos módulos core
- Padrões de código enforçados por ESLint + Prettier
- Conventional Commits para rastreabilidade
- Changelog automático
- Estrutura de pastas previsível e consistente

### RNF019 — Governança de Dados
- Dados de usuário centralizados em `users` e `user_profiles`
- PII separada de dados operacionais
- Retenção por política em `data_retention_policies`
- Auditoria de acesso a dados sensíveis

### RNF020 — Pronto para Analytics e IA Futura
- Eventos estruturados em `analytics_events`
- Schema padronizado: type, actor, entity, properties, timestamp
- Eventos enviáveis para data warehouse externo (Segment, BigQuery)
- Feature store preparada para modelo de ML futuro

### RNF021 — Pronto para Monetização Extensível
- Todas as fontes de receita rastreadas em `MonetizationLedger`
- Regras de comissão versionadas
- Novos modelos de monetização sem refatoração do core
- Engine de promoção extensível

### RNF022 — Pronto para Alta Volumetria
- Connection pool configurado
- Query otimizadas com índices adequados
- Paginação cursor-based em todas as listagens
- Processamento assíncrono em filas para operações pesadas

### RNF023 — Segurança Antifraude
- Velocity check: limite de pedidos por usuário/hora
- Detecção de múltiplos cartões por usuário
- Blacklist de dispositivos suspeitos
- Score de risco por transação (preparado para ML)
- Notificação de comportamento suspeito ao admin

### RNF024 — Baixo Atrito de Onboarding
- Cadastro do cliente em < 60 segundos
- Onboarding do prestador guiado e salvável por etapa
- Formulários com validação em tempo real
- Erro claro e acionável em cada campo

### RNF025 — Qualidade Enterprise no Código
- TypeScript strict em todo o projeto
- Sem `any` implícito
- DTOs com validação via class-validator
- Sem segredos hardcoded
- Sem logs de dados sensíveis
- Revisão de código obrigatória (PR)

---
*Documento vivo — atualizar a cada sprint com novos requisitos identificados*
