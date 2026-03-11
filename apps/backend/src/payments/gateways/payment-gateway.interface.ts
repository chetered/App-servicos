/**
 * Interface de abstração de gateway de pagamento.
 * Cada país pode ter um gateway diferente, sem acoplar ao core.
 */
export interface ChargeParams {
  amount: number; // Em centavos
  currency: string;
  customerId: string;
  paymentMethodId?: string;
  paymentToken?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  description?: string;
}

export interface ChargeResult {
  gatewayTransactionId: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  gateway: string;
  rawResponse?: any;
}

export interface RefundParams {
  gatewayTransactionId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
  idempotencyKey: string;
}

export interface RefundResult {
  gatewayRefundId: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  amount: number;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface CreateCustomerResult {
  gatewayCustomerId: string;
}

export interface SavePaymentMethodParams {
  customerId: string;
  token: string; // Payment method token from frontend SDK
}

export interface SavePaymentMethodResult {
  gatewayPaymentMethodId: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  type: 'CARD' | 'PIX' | 'WALLET' | 'OTHER';
}

export interface IPaymentGateway {
  readonly name: string;
  readonly supportedCountries: string[];

  charge(params: ChargeParams): Promise<ChargeResult>;
  refund(params: RefundParams): Promise<RefundResult>;
  createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult>;
  savePaymentMethod(params: SavePaymentMethodParams): Promise<SavePaymentMethodResult>;
  processWebhook(payload: string, signature: string): Promise<WebhookEvent>;
}

export interface WebhookEvent {
  type: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'REFUND_SUCCEEDED' | 'DISPUTE_CREATED';
  transactionId: string;
  status: string;
  metadata?: Record<string, any>;
}
