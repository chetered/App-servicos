import { registerAs } from '@nestjs/config';

export default registerAs('payments', () => ({
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  defaultGateway: process.env.DEFAULT_PAYMENT_GATEWAY || 'MERCADOPAGO',
}));
