import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SERVIX database...');

  // ============================================================
  // COUNTRIES
  // ============================================================
  const brazil = await prisma.country.upsert({
    where: { code: 'BR' },
    update: {},
    create: {
      code: 'BR',
      name: 'Brasil',
      currencyCode: 'BRL',
      currencySymbol: 'R$',
      defaultLocale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      phonePrefix: '+55',
      isActive: true,
      launchedAt: new Date(),
      defaultCommissionRate: 20,
      minPayout: 5000, // R$50,00 in cents
      payoutSchedule: 'D+1',
    },
  });

  const argentina = await prisma.country.upsert({
    where: { code: 'AR' },
    update: {},
    create: {
      code: 'AR',
      name: 'Argentina',
      currencyCode: 'ARS',
      currencySymbol: '$',
      defaultLocale: 'es-AR',
      timezone: 'America/Argentina/Buenos_Aires',
      phonePrefix: '+54',
      isActive: false,
      defaultCommissionRate: 18,
      payoutSchedule: 'D+2',
    },
  });

  console.log('✅ Countries created');

  // ============================================================
  // PAYMENT GATEWAYS
  // ============================================================
  await prisma.paymentGatewayConfig.upsert({
    where: { countryCode_gatewayName: { countryCode: 'BR', gatewayName: 'MERCADOPAGO' } },
    update: {},
    create: {
      countryCode: 'BR',
      gatewayName: 'MERCADOPAGO',
      isDefault: true,
      isActive: true,
    },
  });

  await prisma.paymentGatewayConfig.upsert({
    where: { countryCode_gatewayName: { countryCode: 'BR', gatewayName: 'STRIPE' } },
    update: {},
    create: {
      countryCode: 'BR',
      gatewayName: 'STRIPE',
      isDefault: false,
      isActive: false,
    },
  });

  console.log('✅ Payment gateways created');

  // ============================================================
  // COMMISSION RULES
  // ============================================================
  await prisma.commissionRule.upsert({
    where: { id: 'default-commission' },
    update: {},
    create: {
      id: 'default-commission',
      name: 'Comissão padrão Brasil',
      type: 'PERCENTAGE',
      percentage: 20,
      countryId: brazil.id,
      priority: 0,
      isDefault: true,
      isActive: true,
    },
  });

  console.log('✅ Commission rules created');

  // ============================================================
  // SERVICE CATEGORIES
  // ============================================================
  const categories = [
    { slug: 'limpeza', name: { 'pt-BR': 'Limpeza', 'en-US': 'Cleaning' }, icon: '🧹', color: '#4CAF50' },
    { slug: 'babas', name: { 'pt-BR': 'Babás', 'en-US': 'Babysitters' }, icon: '👶', color: '#9C27B0' },
    { slug: 'cuidadores', name: { 'pt-BR': 'Cuidadores', 'en-US': 'Caregivers' }, icon: '❤️', color: '#F44336' },
    { slug: 'passeadores', name: { 'pt-BR': 'Passeadores de Cães', 'en-US': 'Dog Walkers' }, icon: '🐕', color: '#FF9800' },
    { slug: 'eletrica', name: { 'pt-BR': 'Elétrica', 'en-US': 'Electrical' }, icon: '⚡', color: '#FFC107' },
    { slug: 'hidraulica', name: { 'pt-BR': 'Hidráulica', 'en-US': 'Plumbing' }, icon: '🔧', color: '#2196F3' },
    { slug: 'pintura', name: { 'pt-BR': 'Pintura', 'en-US': 'Painting' }, icon: '🎨', color: '#E91E63' },
    { slug: 'montagem', name: { 'pt-BR': 'Montagem de Móveis', 'en-US': 'Furniture Assembly' }, icon: '🪑', color: '#795548' },
    { slug: 'jardinagem', name: { 'pt-BR': 'Jardinagem', 'en-US': 'Gardening' }, icon: '🌱', color: '#8BC34A' },
    { slug: 'organizacao', name: { 'pt-BR': 'Organização', 'en-US': 'Organization' }, icon: '📦', color: '#00BCD4' },
    { slug: 'cozinha', name: { 'pt-BR': 'Cozinha', 'en-US': 'Cooking' }, icon: '🍳', color: '#FF5722' },
    { slug: 'lavanderia', name: { 'pt-BR': 'Lavanderia', 'en-US': 'Laundry' }, icon: '👕', color: '#607D8B' },
    { slug: 'reparos', name: { 'pt-BR': 'Pequenos Reparos', 'en-US': 'Small Repairs' }, icon: '🔨', color: '#9E9E9E' },
    { slug: 'motorista', name: { 'pt-BR': 'Motorista', 'en-US': 'Driver' }, icon: '🚗', color: '#3F51B5' },
    { slug: 'tecnico', name: { 'pt-BR': 'Técnico de Manutenção', 'en-US': 'Maintenance Tech' }, icon: '🔩', color: '#009688' },
  ];

  const createdCategories: Record<string, any> = {};

  for (const cat of categories) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        iconUrl: cat.icon,
        color: cat.color,
        isActive: true,
      },
    });
    createdCategories[cat.slug] = category;

    // Link to Brazil
    await prisma.countryCategory.upsert({
      where: { countryId_categoryId: { countryId: brazil.id, categoryId: category.id } },
      update: {},
      create: {
        countryId: brazil.id,
        categoryId: category.id,
        isActive: true,
      },
    });
  }

  console.log('✅ Categories created');

  // ============================================================
  // SERVICES (per category)
  // ============================================================
  const services = [
    // Limpeza
    { categorySlug: 'limpeza', slug: 'faxina-completa', name: { 'pt-BR': 'Faxina Completa' }, defaultPrice: 20000 },
    { categorySlug: 'limpeza', slug: 'limpeza-vidros', name: { 'pt-BR': 'Limpeza de Vidros' }, defaultPrice: 8000 },
    { categorySlug: 'limpeza', slug: 'diarista', name: { 'pt-BR': 'Diarista' }, defaultPrice: 18000 },
    // Babás
    { categorySlug: 'babas', slug: 'baba-eventual', name: { 'pt-BR': 'Babá Eventual' }, defaultPrice: 5000 },
    { categorySlug: 'babas', slug: 'baba-fixa', name: { 'pt-BR': 'Babá Fixa' }, defaultPrice: 250000 },
    // Elétrica
    { categorySlug: 'eletrica', slug: 'instalacao-tomada', name: { 'pt-BR': 'Instalação de Tomada' }, defaultPrice: 12000 },
    { categorySlug: 'eletrica', slug: 'troca-disjuntor', name: { 'pt-BR': 'Troca de Disjuntor' }, defaultPrice: 8000 },
    // Hidráulica
    { categorySlug: 'hidraulica', slug: 'desentupimento', name: { 'pt-BR': 'Desentupimento' }, defaultPrice: 15000 },
    { categorySlug: 'hidraulica', slug: 'troca-torneira', name: { 'pt-BR': 'Troca de Torneira' }, defaultPrice: 12000 },
    // Jardinagem
    { categorySlug: 'jardinagem', slug: 'corte-gramas', name: { 'pt-BR': 'Corte de Grama' }, defaultPrice: 10000 },
    // Passeadores
    { categorySlug: 'passeadores', slug: 'passeio-30min', name: { 'pt-BR': 'Passeio 30min' }, defaultPrice: 3500 },
    { categorySlug: 'passeadores', slug: 'passeio-1h', name: { 'pt-BR': 'Passeio 1 hora' }, defaultPrice: 6000 },
  ];

  for (const svc of services) {
    const category = createdCategories[svc.categorySlug];
    if (!category) continue;

    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {},
      create: {
        categoryId: category.id,
        slug: svc.slug,
        name: svc.name,
        defaultPrice: svc.defaultPrice,
        isActive: true,
      },
    });
  }

  console.log('✅ Services created');

  // ============================================================
  // FEATURE FLAGS
  // ============================================================
  const flags = [
    { key: 'recurrence', description: 'Contratação recorrente' },
    { key: 'sponsored_slots', description: 'Destaque patrocinado' },
    { key: 'premium_subscription', description: 'Assinatura premium para prestadores' },
    { key: 'insurance', description: 'Proteção/seguro do serviço' },
    { key: 'chat', description: 'Chat in-app' },
    { key: 'provider_reviews_clients', description: 'Prestador avalia clientes' },
    { key: 'google_pay', description: 'Google Pay' },
    { key: 'apple_pay', description: 'Apple Pay' },
    { key: 'pix', description: 'PIX' },
    { key: 'corporate_plans', description: 'Planos corporativos' },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key_countryId: { key: flag.key, countryId: brazil.id } },
      update: {},
      create: {
        key: flag.key,
        status: flag.key === 'pix' || flag.key === 'chat' ? 'ENABLED' : 'DISABLED',
        countryId: brazil.id,
        description: flag.description,
      },
    });
  }

  console.log('✅ Feature flags created');

  // ============================================================
  // SETTINGS
  // ============================================================
  const settings = [
    { key: 'urgency_fee_percentage', value: '10', description: 'Taxa de urgência (%)' },
    { key: 'insurance_fee_percentage', value: '2', description: 'Taxa de seguro (%)' },
    { key: 'booking_acceptance_timeout_minutes', value: '5', description: 'Timeout para aceite (min)' },
    { key: 'min_rating_to_be_featured', value: '4.5', description: 'Nota mínima para destaque' },
    { key: 'max_active_bookings_per_provider', value: '10', description: 'Máx. pedidos ativos por prestador' },
    { key: 'platform_name', value: 'SERVIX', description: 'Nome da plataforma', isPublic: true },
    { key: 'support_email', value: 'suporte@servix.app', description: 'E-mail de suporte', isPublic: true },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isPublic: setting.isPublic || false,
      },
    });
  }

  console.log('✅ Settings created');

  // ============================================================
  // ADMIN USER
  // ============================================================
  const adminPassword = await bcrypt.hash('Admin@123456', 12);

  await prisma.user.upsert({
    where: { email: 'admin@servix.app' },
    update: {},
    create: {
      email: 'admin@servix.app',
      passwordHash: adminPassword,
      fullName: 'Admin SERVIX',
      roles: ['ADMIN'],
      authProvider: 'EMAIL',
      isEmailVerified: true,
      profile: {
        create: {
          displayName: 'Admin SERVIX',
        },
      },
    },
  });

  console.log('✅ Admin user created (admin@servix.app / Admin@123456)');

  // ============================================================
  // SAMPLE COUPON
  // ============================================================
  await prisma.coupon.upsert({
    where: { code: 'BEMVINDO10' },
    update: {},
    create: {
      code: 'BEMVINDO10',
      name: 'Desconto de boas-vindas',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      perUserLimit: 1,
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });

  console.log('✅ Sample coupon created (BEMVINDO10)');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
