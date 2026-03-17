import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Limpeza',          slug: 'limpeza',      commissionRate: 0.22, sortOrder: 1 },
    { name: 'Reformas',         slug: 'reformas',     commissionRate: 0.18, sortOrder: 2 },
    { name: 'Elétrica',         slug: 'eletrica',     commissionRate: 0.20, sortOrder: 3 },
    { name: 'Encanamento',      slug: 'encanamento',  commissionRate: 0.20, sortOrder: 4 },
    { name: 'Jardinagem',       slug: 'jardinagem',   commissionRate: 0.21, sortOrder: 5 },
    { name: 'Beleza',           slug: 'beleza',       commissionRate: 0.25, sortOrder: 6 },
    { name: 'Animais',          slug: 'animais',      commissionRate: 0.22, sortOrder: 7 },
    { name: 'Saúde & Bem-estar',slug: 'saude',        commissionRate: 0.23, sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // ─── System Configs ──────────────────────────────────────────────────────────
  const configs = [
    { key: 'matching.default_radius_km',    value: '10',    description: 'Raio padrão de busca (km)' },
    { key: 'matching.max_results',          value: '20',    description: 'Máximo de prestadores retornados' },
    { key: 'matching.weight.distance',      value: '0.20',  description: 'Peso da distância no score' },
    { key: 'matching.weight.rating',        value: '0.25',  description: 'Peso do rating no score' },
    { key: 'matching.weight.completion',    value: '0.20',  description: 'Peso da completion rate' },
    { key: 'matching.weight.acceptance',    value: '0.10',  description: 'Peso da acceptance rate' },
    { key: 'matching.weight.availability',  value: '0.10',  description: 'Peso da disponibilidade' },
    { key: 'matching.weight.trust',         value: '0.10',  description: 'Peso do trust score' },
    { key: 'matching.weight.recurrence',    value: '0.03',  description: 'Bonus de recorrência' },
    { key: 'matching.weight.price',         value: '0.02',  description: 'Peso da competitividade de preço' },
    { key: 'payment.service_fee_pct',       value: '0.08',  description: 'Taxa de serviço (8%)' },
    { key: 'payment.urgency_multiplier',    value: '1.20',  description: 'Multiplicador urgência' },
    { key: 'payout.minimum_cents',          value: '5000',  description: 'Mínimo para saque (R$50)' },
    { key: 'trust.min_score_active',        value: '35',    description: 'Score mínimo para operar' },
    { key: 'review.window_hours',           value: '72',    description: 'Horas para deixar avaliação' },
    { key: 'booking.cancel_deadline_hours', value: '24',    description: 'Horas antes para cancelar sem multa' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log(`✅ ${configs.length} system configs seeded`);

  // ─── Feature Flags ───────────────────────────────────────────────────────────
  const flags = [
    { key: 'matching.ml_model',        isEnabled: false, rolloutPct: 0,   description: 'Usar modelo ML no matching' },
    { key: 'matching.shadow_mode',     isEnabled: false, rolloutPct: 10,  description: 'Shadow mode ML' },
    { key: 'booking.recurrence',       isEnabled: true,  rolloutPct: 100, description: 'Recorrência de bookings' },
    { key: 'payment.urgency_pricing',  isEnabled: false, rolloutPct: 0,   description: 'Preço de urgência' },
    { key: 'provider.sponsored',       isEnabled: false, rolloutPct: 0,   description: 'Listings patrocinados' },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
  console.log(`✅ ${flags.length} feature flags seeded`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
