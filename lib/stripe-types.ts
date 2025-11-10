// lib/stripe-types.ts
/**
 * Type-safe utilities for working with Stripe objects
 * Stripe returns Unix timestamps (numbers) that need to be converted to Date objects
 */

import Stripe from 'stripe';

/**
 * Safely convert Unix timestamp to Date
 * @param timestamp - Unix timestamp (seconds since epoch)
 * @returns Date object or null
 */
export function unixToDate(timestamp: number | null | undefined): Date | null {
  // 0 is a valid unix timestamp; only treat null/undefined as no-value.
  if (timestamp === null || timestamp === undefined) {
    return null;
  }
  if (typeof timestamp !== 'number') {
    return null;
  }
  return new Date(timestamp * 1000);
}

/**
 * Safely convert Date to Unix timestamp
 * @param date - Date object
 * @returns Unix timestamp (seconds since epoch)
 */
export function dateToUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Type-safe Stripe Subscription extractor
 */
export interface SafeStripeSubscription {
  id: string;
  status: string;
  customerId: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  trialStart: Date | null;
  cancelAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export function extractSubscriptionData(
  subscription: Stripe.Subscription
): SafeStripeSubscription {
  return {
    id: subscription.id,
    status: subscription.status,
    customerId: typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer?.id ?? '') as string,
    // subscription has top-level current_period_start/current_period_end
    currentPeriodStart: unixToDate(subscription.current_period_start as number | null | undefined),
    currentPeriodEnd: unixToDate(subscription.current_period_end as number | null | undefined),
    trialEnd: unixToDate(subscription.trial_end as number | null | undefined),
    trialStart: unixToDate(subscription.trial_start as number | null | undefined),
    cancelAt: unixToDate(subscription.cancel_at as number | null | undefined),
    canceledAt: unixToDate(subscription.canceled_at as number | null | undefined),
    createdAt: unixToDate(subscription.created as number) || new Date(),
    metadata: subscription.metadata as Record<string, string> | undefined,
  };
}

/**
 * Type-safe Stripe Invoice extractor
 */
export interface SafeStripeInvoice {
  id: string;
  number: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  amount: number;
  amountDue: number;
  amountPaid: number;
  subtotal: number;
  tax: number | null;
  total: number;
  currency: string;
  status: string;
  paid: boolean;
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  description: string | null;
}

export function extractInvoiceData(invoice: Stripe.Invoice): SafeStripeInvoice {
  // Try to get a sensible "amount" (prefer invoice.amount if present; fall back to total)
  const rawAmount = (invoice as any).amount ?? invoice.total ?? 0;
  const amount = typeof rawAmount === 'number' ? rawAmount / 100 : 0;

  const amountDue = typeof invoice.amount_due === 'number' ? invoice.amount_due / 100 : 0;
  const amountPaid = typeof invoice.amount_paid === 'number' ? invoice.amount_paid / 100 : 0;
  const subtotal = typeof invoice.subtotal === 'number' ? invoice.subtotal / 100 : 0;
  const total = typeof invoice.total === 'number' ? invoice.total / 100 : 0;

  // attempt to pull period from invoice.lines first item (safe guard)
  const periodStartRaw =
    (invoice.lines && Array.isArray((invoice.lines as any).data) && (invoice.lines as any).data[0]?.period?.start) ??
    (invoice.period_start as number | null | undefined);
  const periodEndRaw =
    (invoice.lines && Array.isArray((invoice.lines as any).data) && (invoice.lines as any).data[0]?.period?.end) ??
    (invoice.period_end as number | null | undefined);

  const currency = (invoice.currency ?? 'USD').toString().toUpperCase();

  // paidAt may be in status_transitions or a top-level field depending on SDK version
  const paidAtRaw =
    (invoice.status_transitions as any)?.paid_at ?? (invoice as any).paid_at ?? null;

  return {
    id: invoice.id,
    number: invoice.number ?? null,
    customerId: typeof invoice.customer === 'string' ? (invoice.customer as string) : (invoice.customer?.id ?? null),
    subscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription ?? null) as string | null,
    amount,
    amountDue,
    amountPaid,
    subtotal,
    tax: null, // Stripe provides automatic_tax object; adapt here if you want a specific tax amount
    total,
    currency,
    status: invoice.status ?? 'unknown',
    paid: Boolean(invoice.paid),
    periodStart: unixToDate(periodStartRaw),
    periodEnd: unixToDate(periodEndRaw),
    createdAt: unixToDate(invoice.created as number) || new Date(),
    dueDate: unixToDate(invoice.due_date as number | null | undefined),
    paidAt: unixToDate(paidAtRaw as number | null | undefined),
    description: invoice.description ?? null,
  };
}

/**
 * Type-safe Stripe Charge extractor
 */
export interface SafeStripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  refunded: boolean;
  refundedAmount: number;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export function extractChargeData(charge: Stripe.Charge): SafeStripeCharge {
  return {
    id: charge.id,
    amount: typeof charge.amount === 'number' ? charge.amount / 100 : 0,
    currency: (charge.currency ?? 'USD').toString().toUpperCase(),
    status: charge.status ?? 'unknown',
    paid: Boolean(charge.paid),
    refunded: Boolean(charge.refunded),
    refundedAmount: typeof charge.amount_refunded === 'number' ? charge.amount_refunded / 100 : 0,
    createdAt: unixToDate(charge.created as number) || new Date(),
    metadata: charge.metadata as Record<string, string> | undefined,
  };
}

/**
 * Type-safe Stripe Customer extractor
 */
export interface SafeStripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  createdAt: Date;
  defaultSourceId: string | null;
  metadata?: Record<string, string>;
}

export function extractCustomerData(
  customer: Stripe.Customer
): SafeStripeCustomer {
  return {
    id: customer.id,
    email: customer.email ?? null,
    name: customer.name ?? null,
    phone: customer.phone ?? null,
    createdAt: unixToDate(customer.created as number) || new Date(),
    defaultSourceId: typeof customer.default_source === 'string' ? customer.default_source : (customer.default_source?.id ?? null) as string | null,
    metadata: customer.metadata as Record<string, string> | undefined,
  };
}

/**
 * Type-safe Stripe Refund extractor
 */
export interface SafeStripeRefund {
  id: string;
  chargeId: string | null;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export function extractRefundData(refund: Stripe.Refund): SafeStripeRefund {
  return {
    id: refund.id,
    chargeId: typeof refund.charge === 'string' ? refund.charge : (refund.charge?.id ?? null) as string | null,
    amount: typeof refund.amount === 'number' ? refund.amount / 100 : 0,
    currency: (refund.currency ?? 'USD').toString().toUpperCase(),
    status: refund.status ?? 'unknown',
    reason: refund.reason ?? null,
    createdAt: unixToDate(refund.created as number) || new Date(),
    metadata: refund.metadata as Record<string, string> | undefined,
  };
}

/**
 * Stripe status mapping constants
 */
export const STRIPE_SUBSCRIPTION_STATUS = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
} as const;

export const STRIPE_INVOICE_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  PAID: 'paid',
  UNCOLLECTIBLE: 'uncollectible',
  VOID: 'void',
} as const;

export const STRIPE_CHARGE_STATUS = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PENDING: 'pending',
  EXPIRED: 'expired',
} as const;

/**
 * Map Stripe subscription status to app status
 */
export function mapStripeSubscriptionStatus(
  status: string
): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELLED' {
  switch (status) {
    case 'trialing':
      return 'TRIAL';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'paused':
      return 'PAUSED';
    case 'canceled':
      return 'CANCELLED';
    default:
      return 'ACTIVE';
  }
}

/**
 * Map Stripe invoice status to app status
 */
export function mapStripeInvoiceStatus(
  status: string
): 'PENDING' | 'SENT' | 'PAID' | 'FAILED' | 'CANCELLED' {
  switch (status) {
    case 'draft':
    case 'open':
      return 'PENDING';
    case 'paid':
      return 'PAID';
    case 'uncollectible':
      return 'FAILED';
    case 'void':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

/**
 * Calculate trial days remaining
 */
export function getTrialDaysRemaining(trialEnd: Date | null): number {
  if (!trialEnd) return 0;
  const now = new Date();
  const daysRemaining = Math.ceil(
    (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(daysRemaining, 0);
}

/**
 * Calculate renewal days remaining
 */
export function getRenewalDaysRemaining(renewalDate: Date | null): number {
  if (!renewalDate) return 0;
  const now = new Date();
  const daysRemaining = Math.ceil(
    (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(daysRemaining, 0);
}

/**
 * Format amount in cents to currency string
 */
export function formatCurrency(
  amountInCents: number,
  currency: string = 'USD'
): string {
  const amountInDollars = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInDollars);
}

/**
 * Validate Stripe webhook signature
 *
 * IMPORTANT: you must pass an initialized Stripe SDK instance (with your secret key)
 * so that constructEvent can verify the signature correctly.
 *
 * @param body - raw request body (Buffer or string) exactly as received
 * @param signature - value of the 'stripe-signature' header
 * @param webhookSecret - the webhook signing secret from Stripe
 * @param stripeSdk - initialized Stripe instance (new Stripe(process.env.STRIPE_SECRET, {...}))
 */
export function isValidStripeEvent(
  body: Buffer | string,
  signature: string,
  webhookSecret: string,
  stripeSdk: Stripe
): boolean {
  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhookSecret for Stripe event verification');
    return false;
  }

  try {
    // will throw if invalid
    stripeSdk.webhooks.constructEvent(body, signature, webhookSecret);
    return true;
  } catch (error) {
    console.error('Invalid webhook signature:', error);
    return false;
  }
}
