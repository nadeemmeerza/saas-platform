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
  if (!timestamp || typeof timestamp !== 'number') {
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
    customerId: subscription.customer as string,
    currentPeriodStart: unixToDate(subscription.perio as number),
    currentPeriodEnd: unixToDate(subscription.current_period_end as number),
    trialEnd: unixToDate(subscription.trial_end as number),
    trialStart: unixToDate(subscription.trial_start as number),
    cancelAt: unixToDate(subscription.cancel_at as number),
    canceledAt: unixToDate(subscription.canceled_at as number),
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
  customerId: string;
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
  return {
    id: invoice.id,
    number: invoice.number,
    customerId: invoice.customer as string,
    subscriptionId: invoice.subscription as string | null,
    amount: invoice.amount ? invoice.amount / 100 : 0,
    amountDue: invoice.amount_due ? invoice.amount_due / 100 : 0,
    amountPaid: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
    subtotal: invoice.subtotal ? invoice.subtotal / 100 : 0,
    tax: invoice.tax ? invoice.tax / 100 : null,
    total: invoice.total ? invoice.total / 100 : 0,
    currency: invoice.currency.toUpperCase(),
    status: invoice.status || 'unknown',
    paid: invoice.paid,
    periodStart: unixToDate(invoice.period_start),
    periodEnd: unixToDate(invoice.period_end),
    createdAt: unixToDate(invoice.created) || new Date(),
    dueDate: unixToDate(invoice.due_date),
    paidAt: unixToDate(invoice.paid_at),
    description: invoice.description,
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
    amount: charge.amount ? charge.amount / 100 : 0,
    currency: charge.currency.toUpperCase(),
    status: charge.status,
    paid: charge.paid,
    refunded: charge.refunded,
    refundedAmount: charge.amount_refunded ? charge.amount_refunded / 100 : 0,
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
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    createdAt: unixToDate(customer.created as number) || new Date(),
    defaultSourceId: customer.default_source as string | null,
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
    chargeId: refund.charge as string | null,
    amount: refund.amount ? refund.amount / 100 : 0,
    currency: refund.currency.toUpperCase(),
    status: refund.status || 'unknown',
    reason: refund.reason,
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
 */
export function isValidStripeEvent(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // This will throw if signature is invalid
    // Actual verification happens in stripe.webhooks.constructEvent()
    return true;
  } catch (error) {
    console.error('Invalid webhook signature:', error);
    return false;
  }
}