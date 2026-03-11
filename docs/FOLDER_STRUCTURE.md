# SERVIX — Estrutura Completa de Pastas
## Mapa definitivo de todos os arquivos do projeto

---

```
servix/
│
├── README.md                          # Guia de início rápido
├── package.json                       # Workspace root (npm workspaces)
├── docker-compose.yml                 # Infra local: PG + Redis + MinIO + MailHog
├── .gitignore
│
├── docs/                              # Documentação estratégica e técnica
│   ├── ARCHITECTURE.md               # Arquitetura completa + diagramas
│   ├── FOLDER_STRUCTURE.md           # Este arquivo
│   ├── DATABASE_MODELING.md          # ER, relacionamentos, índices
│   ├── PRODUCT_VISION.md             # Visão, nomes, personas, valuation
│   ├── REQUIREMENTS.md               # RF001-RF033 + RNF001-RNF025
│   └── ROADMAP.md                    # 5 fases com impacto por feature
│
├── infra/
│   ├── postgres/
│   │   └── init.sql                  # Extensions + roles iniciais
│   ├── redis/
│   │   └── redis.conf                # Config de produção (maxmemory, etc.)
│   └── nginx/
│       └── nginx.conf                # Reverse proxy (produção)
│
├── packages/
│   └── shared/                       # Tipos e DTOs compartilhados
│       ├── package.json
│       ├── src/
│       │   ├── types/
│       │   │   ├── booking.types.ts
│       │   │   ├── payment.types.ts
│       │   │   └── user.types.ts
│       │   └── index.ts
│       └── tsconfig.json
│
├── apps/
│   │
│   ├── backend/                      # NestJS API
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── nest-cli.json
│   │   ├── .env.example
│   │   ├── .eslintrc.js
│   │   ├── .prettierrc
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Schema completo (40+ entidades)
│   │   │   ├── seed.ts               # Dados iniciais (países, categorias, admin)
│   │   │   └── migrations/           # Auto-gerado pelo prisma migrate
│   │   │
│   │   └── src/
│   │       ├── main.ts               # Bootstrap, Swagger, globals
│   │       ├── app.module.ts         # Root module, imports todos os domínios
│   │       │
│   │       ├── common/               # Infraestrutura compartilhada
│   │       │   ├── prisma/
│   │       │   │   ├── prisma.module.ts
│   │       │   │   └── prisma.service.ts
│   │       │   ├── config/
│   │       │   │   ├── app.config.ts
│   │       │   │   ├── auth.config.ts
│   │       │   │   ├── database.config.ts
│   │       │   │   ├── payments.config.ts
│   │       │   │   └── notifications.config.ts
│   │       │   ├── decorators/
│   │       │   │   ├── current-user.decorator.ts
│   │       │   │   ├── roles.decorator.ts
│   │       │   │   └── public.decorator.ts
│   │       │   ├── dto/
│   │       │   │   └── pagination.dto.ts
│   │       │   ├── filters/
│   │       │   │   └── http-exception.filter.ts
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts
│   │       │   │   └── roles.guard.ts
│   │       │   ├── interceptors/
│   │       │   │   ├── transform.interceptor.ts
│   │       │   │   └── logging.interceptor.ts
│   │       │   ├── pipes/
│   │       │   │   └── parse-uuid.pipe.ts
│   │       │   └── utils/
│   │       │       ├── crypto.util.ts
│   │       │       ├── date.util.ts
│   │       │       └── money.util.ts
│   │       │
│   │       ├── auth/                 # Autenticação e sessão
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.service.spec.ts
│   │       │   ├── otp.service.ts
│   │       │   ├── token.service.ts
│   │       │   ├── dto/
│   │       │   │   └── auth.dto.ts
│   │       │   └── strategies/
│   │       │       ├── jwt.strategy.ts
│   │       │       ├── local.strategy.ts
│   │       │       ├── google.strategy.ts
│   │       │       └── apple.strategy.ts
│   │       │
│   │       ├── users/                # Perfis e endereços
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   ├── users.service.spec.ts
│   │       │   └── dto/
│   │       │       └── update-user.dto.ts
│   │       │
│   │       ├── providers/            # Prestadores de serviço
│   │       │   ├── providers.module.ts
│   │       │   ├── providers.controller.ts
│   │       │   ├── providers.service.ts
│   │       │   ├── providers.service.spec.ts
│   │       │   ├── onboarding.service.ts
│   │       │   ├── availability.service.ts
│   │       │   ├── ranking.service.ts
│   │       │   └── dto/
│   │       │       ├── create-provider.dto.ts
│   │       │       ├── update-provider.dto.ts
│   │       │       └── update-availability.dto.ts
│   │       │
│   │       ├── categories/           # Categorias e serviços
│   │       │   ├── categories.module.ts
│   │       │   ├── categories.controller.ts
│   │       │   ├── categories.service.ts
│   │       │   └── dto/
│   │       │       ├── create-category.dto.ts
│   │       │       └── create-service.dto.ts
│   │       │
│   │       ├── search/               # Busca geolocalizada
│   │       │   ├── search.module.ts
│   │       │   ├── search.controller.ts
│   │       │   ├── search.service.ts
│   │       │   └── search.service.spec.ts
│   │       │
│   │       ├── marketplace/          # Regras cross-domain
│   │       │   ├── marketplace.module.ts
│   │       │   ├── matching.service.ts
│   │       │   └── ranking.service.ts
│   │       │
│   │       ├── bookings/             # Pedidos e contratações
│   │       │   ├── bookings.module.ts
│   │       │   ├── bookings.controller.ts
│   │       │   ├── bookings.service.ts
│   │       │   ├── bookings.service.spec.ts
│   │       │   ├── pricing.service.ts
│   │       │   ├── pricing.service.spec.ts
│   │       │   ├── displacement.service.ts
│   │       │   ├── displacement.service.spec.ts
│   │       │   ├── booking-status.service.ts
│   │       │   ├── bookings.processor.ts  (BullMQ)
│   │       │   └── dto/
│   │       │       ├── create-booking.dto.ts
│   │       │       ├── update-booking.dto.ts
│   │       │       └── estimate-price.dto.ts
│   │       │
│   │       ├── recurrence/           # Planos recorrentes
│   │       │   ├── recurrence.module.ts
│   │       │   ├── recurrence.controller.ts
│   │       │   ├── recurrence.service.ts
│   │       │   ├── recurrence.scheduler.ts  (cron)
│   │       │   └── dto/
│   │       │       └── create-plan.dto.ts
│   │       │
│   │       ├── payments/             # Motor de pagamentos
│   │       │   ├── payments.module.ts
│   │       │   ├── payments.controller.ts
│   │       │   ├── payments.service.ts
│   │       │   ├── payments.service.spec.ts
│   │       │   ├── webhook.processor.ts
│   │       │   └── gateways/
│   │       │       ├── payment-gateway.interface.ts
│   │       │       ├── gateway.factory.ts
│   │       │       ├── mercadopago.gateway.ts
│   │       │       ├── stripe.gateway.ts
│   │       │       └── pagseguro.gateway.ts  (futuro)
│   │       │
│   │       ├── commissions/          # Split e comissões
│   │       │   ├── commissions.module.ts
│   │       │   └── commissions.service.ts
│   │       │
│   │       ├── payouts/              # Repasses aos prestadores
│   │       │   ├── payouts.module.ts
│   │       │   ├── payouts.controller.ts
│   │       │   ├── payouts.service.ts
│   │       │   └── payouts.scheduler.ts  (cron D+1)
│   │       │
│   │       ├── trust/                # Verificação e confiança
│   │       │   ├── trust.module.ts
│   │       │   ├── trust.controller.ts
│   │       │   ├── trust.service.ts
│   │       │   ├── verification.service.ts
│   │       │   └── trust-score.service.ts
│   │       │
│   │       ├── reviews/              # Avaliações e reputação
│   │       │   ├── reviews.module.ts
│   │       │   ├── reviews.controller.ts
│   │       │   ├── reviews.service.ts
│   │       │   └── dto/
│   │       │       └── create-review.dto.ts
│   │       │
│   │       ├── support/              # Tickets e disputas
│   │       │   ├── support.module.ts
│   │       │   ├── support.controller.ts
│   │       │   ├── support.service.ts
│   │       │   ├── disputes.service.ts
│   │       │   └── dto/
│   │       │       └── create-ticket.dto.ts
│   │       │
│   │       ├── notifications/        # Push, email, SMS
│   │       │   ├── notifications.module.ts
│   │       │   ├── notifications.service.ts
│   │       │   ├── push.service.ts
│   │       │   ├── email.service.ts
│   │       │   └── sms.service.ts
│   │       │
│   │       ├── analytics/            # Eventos e métricas
│   │       │   ├── analytics.module.ts
│   │       │   └── analytics.service.ts
│   │       │
│   │       ├── localization/         # Multi-país e moeda
│   │       │   ├── localization.module.ts
│   │       │   ├── localization.controller.ts
│   │       │   └── localization.service.ts
│   │       │
│   │       ├── admin/                # APIs do painel admin
│   │       │   ├── admin.module.ts
│   │       │   ├── admin-users.controller.ts
│   │       │   ├── admin-providers.controller.ts
│   │       │   ├── admin-bookings.controller.ts
│   │       │   ├── admin-payments.controller.ts
│   │       │   ├── admin-settings.controller.ts
│   │       │   └── admin-analytics.controller.ts
│   │       │
│   │       └── feature-flags/        # Flags por país
│   │           ├── feature-flags.module.ts
│   │           └── feature-flags.service.ts
│   │
│   ├── mobile/                       # React Native + Expo
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── babel.config.js
│   │   ├── .env.example
│   │   │
│   │   └── src/
│   │       ├── app/                  # Expo Router (file-based routing)
│   │       │   ├── _layout.tsx       # Root layout (QueryClient, i18n)
│   │       │   ├── index.tsx         # Splash / redirect
│   │       │   ├── (auth)/           # Rotas sem autenticação
│   │       │   │   ├── _layout.tsx
│   │       │   │   ├── login.tsx
│   │       │   │   ├── register.tsx
│   │       │   │   ├── register-provider.tsx
│   │       │   │   ├── otp.tsx
│   │       │   │   └── forgot-password.tsx
│   │       │   ├── (tabs)/           # Bottom tab navigator
│   │       │   │   ├── _layout.tsx   # Tab bar config
│   │       │   │   ├── home.tsx      # Feed + categorias + prestadores
│   │       │   │   ├── search.tsx    # Busca avançada com filtros
│   │       │   │   ├── bookings.tsx  # Meus pedidos
│   │       │   │   ├── favorites.tsx # Favoritos
│   │       │   │   └── profile.tsx   # Perfil do usuário
│   │       │   ├── provider/
│   │       │   │   └── [id].tsx      # Perfil público do prestador
│   │       │   ├── booking/
│   │       │   │   ├── new.tsx       # Fluxo de contratação (wizard)
│   │       │   │   ├── checkout.tsx  # Checkout + breakdown de preço
│   │       │   │   └── [id].tsx      # Detalhe do pedido + status
│   │       │   ├── chat/
│   │       │   │   └── [bookingId].tsx
│   │       │   ├── review/
│   │       │   │   └── [bookingId].tsx
│   │       │   ├── support/
│   │       │   │   ├── index.tsx
│   │       │   │   └── [ticketId].tsx
│   │       │   └── (provider-tabs)/  # Tabs exclusivos de prestadores
│   │       │       ├── _layout.tsx
│   │       │       ├── dashboard.tsx # Ganhos + pedidos recebidos
│   │       │       ├── orders.tsx    # Pedidos recebidos
│   │       │       ├── agenda.tsx    # Calendário de disponibilidade
│   │       │       └── wallet.tsx    # Carteira + saques
│   │       │
│   │       ├── components/
│   │       │   ├── common/
│   │       │   │   ├── Button.tsx
│   │       │   │   ├── Input.tsx
│   │       │   │   ├── ProviderCard.tsx
│   │       │   │   ├── CategoryCard.tsx
│   │       │   │   ├── BookingCard.tsx
│   │       │   │   ├── ReviewCard.tsx
│   │       │   │   ├── PriceBreakdown.tsx
│   │       │   │   ├── StatusBadge.tsx
│   │       │   │   ├── TrustBadge.tsx
│   │       │   │   ├── StarRating.tsx
│   │       │   │   ├── Avatar.tsx
│   │       │   │   ├── Skeleton.tsx
│   │       │   │   ├── EmptyState.tsx
│   │       │   │   ├── ErrorState.tsx
│   │       │   │   └── LoadingOverlay.tsx
│   │       │   ├── booking/
│   │       │   │   ├── BookingWizard.tsx
│   │       │   │   ├── DateTimePicker.tsx
│   │       │   │   ├── AddressSelector.tsx
│   │       │   │   ├── RecurrenceSelector.tsx
│   │       │   │   └── PaymentMethodSelector.tsx
│   │       │   ├── provider/
│   │       │   │   ├── ProviderProfile.tsx
│   │       │   │   ├── ServiceList.tsx
│   │       │   │   └── AvailabilityCalendar.tsx
│   │       │   └── home/
│   │       │       ├── CategoryGrid.tsx
│   │       │       ├── PromoBanner.tsx
│   │       │       └── ProviderList.tsx
│   │       │
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── useLocation.ts
│   │       │   ├── useBooking.ts
│   │       │   ├── useNotifications.ts
│   │       │   └── useDebounce.ts
│   │       │
│   │       ├── services/
│   │       │   ├── api.ts            # Axios client com interceptors
│   │       │   ├── socket.ts         # Socket.io para chat em tempo real
│   │       │   └── storage.ts        # SecureStore helpers
│   │       │
│   │       ├── store/
│   │       │   ├── auth.store.ts     # Zustand: user, tokens, login/logout
│   │       │   ├── booking.store.ts  # Zustand: wizard state
│   │       │   └── location.store.ts # Zustand: coordenadas atuais
│   │       │
│   │       ├── i18n/
│   │       │   ├── index.ts          # i18next setup
│   │       │   └── locales/
│   │       │       ├── pt-BR.json
│   │       │       ├── en-US.json
│   │       │       └── es-MX.json
│   │       │
│   │       └── theme/
│   │           └── index.ts          # Colors, Typography, Spacing, Shadows
│   │
│   └── admin/                        # Next.js 14 Admin Panel
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── .env.example
│       │
│       └── src/
│           ├── app/
│           │   ├── layout.tsx        # Root: Sidebar + QueryClient
│           │   ├── globals.css
│           │   ├── page.tsx          # → redirect /dashboard
│           │   ├── dashboard/
│           │   │   └── page.tsx      # KPIs + recent orders + pending approvals
│           │   ├── analytics/
│           │   │   └── page.tsx      # Funis, coortes, GMV, take rate
│           │   ├── providers/
│           │   │   ├── page.tsx      # Lista com filtros e status
│           │   │   └── [id]/
│           │   │       └── page.tsx  # Detalhe + aprovar/reprovar docs
│           │   ├── bookings/
│           │   │   ├── page.tsx
│           │   │   └── [id]/
│           │   │       └── page.tsx
│           │   ├── users/
│           │   │   └── page.tsx
│           │   ├── payments/
│           │   │   ├── page.tsx      # Transações
│           │   │   └── payouts/
│           │   │       └── page.tsx  # Repasses pendentes
│           │   ├── categories/
│           │   │   └── page.tsx
│           │   ├── coupons/
│           │   │   ├── page.tsx
│           │   │   └── new/
│           │   │       └── page.tsx
│           │   ├── support/
│           │   │   ├── page.tsx
│           │   │   └── [ticketId]/
│           │   │       └── page.tsx
│           │   └── settings/
│           │       ├── countries/
│           │       │   └── page.tsx
│           │       ├── gateways/
│           │       │   └── page.tsx
│           │       ├── flags/
│           │       │   └── page.tsx
│           │       └── page.tsx
│           │
│           ├── components/
│           │   ├── ui/
│           │   │   ├── Sidebar.tsx
│           │   │   ├── DataTable.tsx
│           │   │   ├── StatusBadge.tsx
│           │   │   ├── MetricCard.tsx
│           │   │   ├── Modal.tsx
│           │   │   └── ConfirmDialog.tsx
│           │   ├── charts/
│           │   │   ├── GmvChart.tsx
│           │   │   ├── OrdersChart.tsx
│           │   │   └── RetentionChart.tsx
│           │   └── forms/
│           │       ├── CouponForm.tsx
│           │       └── CountryForm.tsx
│           │
│           ├── hooks/
│           │   ├── useAdminQuery.ts
│           │   └── useTable.ts
│           │
│           └── services/
│               └── admin-api.ts
```

---

## Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Módulos NestJS | `kebab-case.module.ts` | `bookings.module.ts` |
| Controllers | `kebab-case.controller.ts` | `bookings.controller.ts` |
| Services | `kebab-case.service.ts` | `pricing.service.ts` |
| DTOs | `kebab-case.dto.ts` | `create-booking.dto.ts` |
| Testes | `*.spec.ts` | `auth.service.spec.ts` |
| Rotas mobile | `kebab-case.tsx` | `create-booking.tsx` |
| Componentes | `PascalCase.tsx` | `ProviderCard.tsx` |
| Stores | `kebab-case.store.ts` | `auth.store.ts` |
| Hooks | `use + PascalCase.ts` | `useBooking.ts` |
| Entities/Models | `PascalCase` em Prisma | `ServiceOrder`, `PaymentSplit` |
| Tabelas DB | `snake_case` | `service_orders`, `payment_splits` |
| Campos DB | `snake_case` | `created_at`, `provider_id` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |

---

## Regras de Organização por Módulo

Cada módulo de domínio segue a mesma estrutura interna:

```
{domain}/
├── {domain}.module.ts        # Imports, controllers, providers, exports
├── {domain}.controller.ts    # Endpoints HTTP, validação de entrada
├── {domain}.service.ts       # Regras de negócio, orquestração
├── {domain}.service.spec.ts  # Testes unitários do service
├── {domain}.processor.ts     # Worker BullMQ (quando necessário)
├── {domain}.scheduler.ts     # Cron jobs (quando necessário)
└── dto/
    ├── create-{entity}.dto.ts
    └── update-{entity}.dto.ts
```
