# SERVIX — Marketplace de Serviços Sob Demanda

> Conecte clientes a profissionais verificados de forma rápida, segura e confiável.

---

## Visão Geral

**SERVIX** é um marketplace de serviços sob demanda e agendados — como Uber para contratar diaristas, eletricistas, babás e dezenas de outros profissionais. Construído com arquitetura escalável, pronto para multi-país, recorrência nativa e monetização diversificada.

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS + TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Cache/Filas | Redis + BullMQ |
| Mobile | React Native + Expo |
| Admin Web | Next.js 14 |
| Auth | JWT + Refresh Token + OTP |
| Pagamentos | MercadoPago (BR) + Stripe (intl) |
| Storage | MinIO / S3 |
| Notificações | Firebase FCM |
| Infra local | Docker Compose |

---

## Início Rápido

### Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- npm / yarn / pnpm

### 1. Clonar e instalar

```bash
git clone <repo>
cd servix
```

### 2. Subir infraestrutura local

```bash
npm run db:up
# Sobe: PostgreSQL, Redis, MinIO, MailHog
```

### 3. Configurar variáveis de ambiente

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
# Edite cada .env com seus valores
```

### 4. Instalar dependências e rodar migrations

```bash
cd apps/backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
```

### 5. Iniciar o backend

```bash
npm run start:dev
# API disponível em: http://localhost:3000/api/v1
# Swagger docs: http://localhost:3000/api/docs
```

### 6. Iniciar o painel admin

```bash
cd apps/admin
npm install
npm run dev
# Admin disponível em: http://localhost:3001
```

### 7. Iniciar o app mobile

```bash
cd apps/mobile
npm install
npm run start
# Scan QR code com Expo Go ou use emulador
```

---

## Estrutura do Projeto

```
servix/
├── apps/
│   ├── backend/           # NestJS API
│   │   ├── src/
│   │   │   ├── auth/          # Autenticação JWT/OTP
│   │   │   ├── users/         # Gestão de usuários
│   │   │   ├── providers/     # Prestadores de serviço
│   │   │   ├── categories/    # Categorias e serviços
│   │   │   ├── search/        # Busca geolocalizada
│   │   │   ├── bookings/      # Pedidos e contratações
│   │   │   ├── recurrence/    # Serviços recorrentes
│   │   │   ├── payments/      # Motor de pagamentos
│   │   │   │   └── gateways/  # MercadoPago, Stripe...
│   │   │   ├── commissions/   # Split e comissões
│   │   │   ├── payouts/       # Repasses a prestadores
│   │   │   ├── trust/         # Verificação e confiança
│   │   │   ├── reviews/       # Avaliações e reputação
│   │   │   ├── support/       # Tickets e disputas
│   │   │   ├── notifications/ # FCM + e-mail + SMS
│   │   │   ├── analytics/     # Eventos e métricas
│   │   │   ├── localization/  # Multi-país / moeda
│   │   │   ├── admin/         # Painel admin APIs
│   │   │   ├── feature-flags/ # Flags por país
│   │   │   └── common/        # Guards, filtros, DTOs
│   │   └── prisma/
│   │       ├── schema.prisma  # Modelagem completa
│   │       └── seed.ts        # Dados iniciais
│   │
│   ├── mobile/            # React Native + Expo
│   │   └── src/
│   │       ├── app/           # Expo Router (file-based)
│   │       │   ├── (auth)/    # Login, cadastro, OTP
│   │       │   └── (tabs)/    # Home, busca, perfil
│   │       ├── components/    # UI components
│   │       ├── services/      # API client (Axios)
│   │       ├── store/         # Zustand state
│   │       └── theme/         # Design system tokens
│   │
│   └── admin/             # Next.js Admin Panel
│       └── src/
│           ├── app/           # Dashboard, providers...
│           └── components/    # UI components (Tailwind)
│
├── packages/
│   └── shared/            # DTOs e tipos compartilhados
│
├── infra/
│   └── postgres/          # Scripts de inicialização
│
├── docs/                  # Documentação estratégica
│   ├── PRODUCT_VISION.md
│   ├── REQUIREMENTS.md
│   └── ROADMAP.md
│
└── docker-compose.yml     # Infra local
```

---

## Domínios e Responsabilidades

| Módulo | Responsabilidade |
|--------|-----------------|
| `auth` | JWT, OTP, Google/Apple OAuth, refresh tokens |
| `users` | Perfis, endereços, favoritos, configurações |
| `providers` | Onboarding, documentos, agenda, zonas, preços |
| `categories` | Categorias configuráveis sem refatoração |
| `search` | Busca geolocalizada com ranking e filtros |
| `bookings` | Fluxo de contratação imediata/agendada |
| `recurrence` | Planos recorrentes e execuções automáticas |
| `payments` | Abstração de gateways + idempotência |
| `commissions` | Split automático + ledger de monetização |
| `payouts` | Repasses aos prestadores |
| `trust` | Score de confiança, verificação, selos |
| `reviews` | Avaliações, moderação, reputação |
| `support` | Tickets, disputas, histórico |
| `notifications` | Push, e-mail, SMS por canal |
| `analytics` | Eventos estruturados para BI/ML futuro |
| `localization` | Países, moedas, idiomas, timezones |
| `admin` | APIs do painel administrativo |
| `feature-flags` | Flags por país e % de rollout |

---

## APIs Principais

### Autenticação
```
POST /api/v1/auth/register        # Cadastro por e-mail
POST /api/v1/auth/login           # Login por e-mail
POST /api/v1/auth/google          # Login Google
POST /api/v1/auth/otp/request     # Solicitar OTP
POST /api/v1/auth/otp/verify      # Verificar OTP
POST /api/v1/auth/refresh         # Renovar tokens
POST /api/v1/auth/logout          # Logout
```

### Busca
```
GET  /api/v1/search/providers     # Buscar prestadores
GET  /api/v1/search/categories    # Listar categorias
```

### Pedidos
```
POST /api/v1/bookings/estimate    # Estimar preço
POST /api/v1/bookings             # Criar pedido
GET  /api/v1/bookings/my          # Meus pedidos
GET  /api/v1/bookings/:id         # Detalhe do pedido
PATCH /api/v1/bookings/:id/accept # Aceitar (prestador)
PATCH /api/v1/bookings/:id/complete # Concluir (prestador)
```

### Pagamentos
```
POST /api/v1/payments/methods     # Salvar método
POST /api/v1/payments/webhook/:gateway # Webhook
```

---

## Modelos de Monetização

| Fonte | Tipo | % Estimado da Receita |
|-------|------|-----------------------|
| Comissão por serviço | 20% do valor | ~70% |
| Taxa de urgência | 10% adicional | ~10% |
| Destaque patrocinado | Fixo/mês | ~8% |
| Assinatura premium | Mensal/anual | ~7% |
| Taxa de conveniência | Por pagamento | ~3% |
| Proteção/seguro | 2% do serviço | ~2% |

### Métricas-Chave (para investidores)

- **GMV**: Volume total transacionado
- **Take Rate**: Receita / GMV (meta: ~22%)
- **LTV/CAC**: > 3x para ser saudável
- **Recurrence Rate**: % pedidos recorrentes
- **Completion Rate**: % pedidos concluídos
- **NPS**: Satisfação geral

---

## Roadmap

### MVP Essencial (0-3 meses)
- [x] Cadastro/login (e-mail + OTP)
- [x] Onboarding de prestadores
- [x] Categorias configuráveis
- [x] Busca geolocalizada
- [x] Fluxo de contratação imediata
- [x] Checkout com preço transparente
- [x] MercadoPago (PIX + cartão)
- [x] Split automático de pagamento
- [x] Avaliações simples
- [x] Notificações push
- [x] Painel admin básico

### MVP Turbinado (3-6 meses)
- [ ] Agendamento futuro
- [ ] Recorrência semanal/quinzenal/mensal
- [ ] Chat in-app
- [ ] Verificação de documentos (manual/IA)
- [ ] Selos de confiança
- [ ] Disputas e suporte
- [ ] Cupons e promoções
- [ ] Dashboard de métricas completo

### V1 Crescimento (6-12 meses)
- [ ] Destaque patrocinado
- [ ] Assinatura premium para prestadores
- [ ] Analytics avançado (funis, coortes)
- [ ] Ranking inteligente (ML)
- [ ] Pricing dinâmico por região/hora
- [ ] Expansão de categorias

### V2 Monetização Avançada (12-18 meses)
- [ ] Planos corporativos (B2B)
- [ ] Proteção/seguro do serviço
- [ ] Apple Pay / Google Pay
- [ ] NPS e loyalty program
- [ ] API para integrações

### V3 Expansão Internacional (18-36 meses)
- [ ] Argentina (ARS + gateway local)
- [ ] México (MXN + OXXO)
- [ ] Colombia + Chile
- [ ] Europa (PT/ES)
- [ ] IA: matching + pricing + prevenção de fraude

---

## Variáveis Críticas para Produção

```bash
# Obrigatórias para produção
JWT_SECRET=<64+ chars aleatórios>
DATABASE_URL=<PostgreSQL produção>
MERCADOPAGO_ACCESS_TOKEN=<token real>
FIREBASE_PROJECT_ID=<projeto FCM>
SMTP_HOST=<servidor e-mail real>
```

---

## Contas de Teste (Seed)

| Tipo | E-mail | Senha |
|------|--------|-------|
| Admin | admin@servix.app | Admin@123456 |

**Cupom de teste:** `BEMVINDO10` (10% off)

---

## Contribuição

1. Branch: `feature/<nome-da-feature>`
2. Commits: Conventional Commits (`feat:`, `fix:`, `chore:`)
3. PR com descrição do que foi feito e por quê
4. Cobertura de testes > 80% nos módulos core

---

*SERVIX v1.0 — Construído para crescer, projetado para durar.*
