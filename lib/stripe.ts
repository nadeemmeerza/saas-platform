// lib/stripe.ts
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import {
  extractSubscriptionData,
  extractInvoiceData,
  extractChargeData,
  mapStripeSubscriptionStatus,
  mapStripeInvoiceStatus,
  unixToDate,
} from '@/lib/stripe-types';
import { BillingCycle } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string,{
    apiVersion:'2025-10-29.clover'
});

// ============ CUSTOMER MANAGEMENT ============

/**
 * Create a Stripe customer and link to user
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name?: string,
  billingAddress?: any,
  shippingAddress?: any
) {
  try {
    console.log('🔄 Creating Stripe customer for:', email);

    const customer = await stripe.customers.create({
      email,
      name: name || 'Customer',
       // ✅ REQUIRED: Billing Address for export compliance
      address: {
        line1: billingAddress.line1,
        line2: billingAddress.line2 || undefined,
        city: billingAddress.city,
        state: billingAddress.state || undefined,
        postal_code: billingAddress.postalCode,
        country: billingAddress.country, // Must be 2-letter ISO code
      },
      metadata: {
        userId,
        createdAt: new Date().toISOString(),
      },
    });

    console.log('✅ Stripe customer created:', customer.id);

    // Link to user in database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  } catch (error) {
    console.error('❌ Failed to create Stripe customer:', error);
    throw new Error(`Failed to create Stripe customer: ${error}`);
  }
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await createStripeCustomer(userId, email, name);
  return customer.id;
}

/**
 * Update Stripe customer
 */
export async function updateStripeCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
) {
  try {
    console.log('🔄 Updating Stripe customer:', customerId);

    const customer = await stripe.customers.update(customerId, params);

    console.log('✅ Stripe customer updated');
    return customer;
  } catch (error) {
    console.error('❌ Failed to update Stripe customer:', error);
    throw error;
  }
}

// ============ SUBSCRIPTION MANAGEMENT ============

/**
 * Create a Stripe subscription
 */
export async function createSubscription(
  userId: string,
  customerId: string,
  tierId: string,
  priceId: string,
  billingCycle: 'MONTHLY' | 'YEARLY',
  description: string
) {
  try {
    console.log('🔄 Creating Stripe subscription:', {
      customerId,
      priceId,
      billingCycle,
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      metadata: {
        userId,
        tierId,
        billingCycle,
      },
      description: description,
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('✅ Stripe subscription created:', subscription.id);
    return subscription;
  } catch (error) {
    console.error('❌ Failed to create subscription:', error);
    throw new Error(`Failed to create subscription: ${error}`);
  }
}

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  try {
    console.log('🔄 Updating subscription:', subscriptionId);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.items.data[0]) {
      throw new Error('No subscription items found');
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    console.log('✅ Subscription updated');
    return updated;
  } catch (error) {
    console.error('❌ Failed to update subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
// export async function cancelSubscription(subscriptionId: string) {
//   try {
//     console.log('🔄 Cancelling subscription:', subscriptionId);

//     const subscription = await stripe.subscriptions.del(subscriptionId);

//     console.log('✅ Subscription cancelled');
//     return subscription;
//   } catch (error) {
//     console.error('❌ Failed to cancel subscription:', error);
//     throw error;
//   }
// }

/**
 * Pause subscription
 */
export async function pauseSubscription(subscriptionId: string) {
  try {
    console.log('🔄 Pausing subscription:', subscriptionId);

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'mark_uncollectible',
      },
    });

    console.log('✅ Subscription paused');
    return subscription;
  } catch (error) {
    console.error('❌ Failed to pause subscription:', error);
    throw error;
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  try {
    console.log('🔄 Resuming subscription:', subscriptionId);

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: undefined,
    });

    console.log('✅ Subscription resumed');
    return subscription;
  } catch (error) {
    console.error('❌ Failed to resume subscription:', error);
    throw error;
  }
}

// ============ PAYMENT & INVOICE MANAGEMENT ============

/**
 * Create payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: metadata || {},
    });

    return paymentIntent;
  } catch (error) {
    console.error('❌ Failed to create payment intent:', error);
    throw error;
  }
}

/**
 * Process refund
 */
export async function processRefund(
  chargeId: string,
  amount?: number,
  reason?: string
) {
  try {
    console.log('🔄 Processing refund:', chargeId);

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
      metadata: {
        reason: reason || 'customer_request',
        processedAt: new Date().toISOString(),
      },
    });

    console.log('✅ Refund processed:', refund.id);
    return refund;
  } catch (error) {
    console.error('❌ Failed to process refund:', error);
    throw error;
  }
}

/**
 * Retrieve invoice from Stripe
 */
export async function retrieveInvoice(invoiceId: string) {
  try {
    return await stripe.invoices.retrieve(invoiceId);
  } catch (error) {
    console.error('❌ Failed to retrieve invoice:', error);
    throw error;
  }
}

// ============ WEBHOOK HANDLERS ============

/**
 * Handle all Stripe webhooks
 */
export async function handleWebhook(event: Stripe.Event) {
  try {
    console.log('🔔 Processing webhook:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log('⚠️ Unhandled webhook event:', event.type);
    }

    console.log('✅ Webhook processed');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    throw error;
  }
}

// ============ WEBHOOK EVENT HANDLERS ============

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('📝 Subscription created in Stripe:', subscription.id);
  // Additional logic can be added here
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const safeData = extractSubscriptionData(subscription);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.warn('⚠️ Subscription not found in database');
    return;
  }

  const status = mapStripeSubscriptionStatus(safeData.status);

  // Update in database
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: status as any,
      renewalDate: safeData.currentPeriodEnd || new Date(),
    },
  });

  console.log('✅ Subscription updated in database');
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('❌ Subscription cancelled:', subscription.id);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELLED' },
  });

  console.log('✅ Subscription marked as cancelled');
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log('📋 Invoice created in Stripe:', invoice.id);

  const customer = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!customer) {
    console.warn('⚠️ Customer not found');
    return;
  }

  // Type-safe property access for Unix timestamps
  const periodStart = typeof invoice.period_start === 'number'
    ? new Date(invoice.period_start * 1000)
    : new Date();

  const periodEnd = typeof invoice.period_end === 'number'
    ? new Date(invoice.period_end * 1000)
    : new Date();

  const dueDate = typeof invoice.due_date === 'number'
    ? new Date(invoice.due_date * 1000)
    : undefined;

  // Create invoice in database
  await prisma.invoice.create({
    data: {
      invoiceNumber: invoice.number || `INV-${Date.now()}`,
      userId: customer.id,
      stripeInvoiceId: invoice.id,
      subtotal: invoice.subtotal ? invoice.subtotal / 100 : 0,
    //   tax: invoice.tax ? invoice.tax / 100 : 0,
      total: invoice.total ? invoice.total / 100 : 0,
      status: 'PENDING',
      description: invoice.description || 'Subscription Invoice',
      periodStart,
      periodEnd,
      dueDate,
    },
  });

  console.log('✅ Invoice created in database');
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('✅ Payment succeeded:', invoice.id);

  await prisma.invoice.updateMany({
    where: { stripeInvoiceId: invoice.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  // Get user to send confirmation email
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (user) {
    try {
      await sendEmail(
        user.email,
        'Payment Received',
        `Your payment of $${(invoice.total / 100).toFixed(2)} has been received.`
      );
    } catch (error) {
      console.error('⚠️ Failed to send payment confirmation email:', error);
    }
  }

  console.log('✅ Invoice marked as paid');
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Payment failed:', invoice.id);

  await prisma.invoice.updateMany({
    where: { stripeInvoiceId: invoice.id },
    data: {
      status: 'FAILED',
    },
  });

  // Get user to send failure notification
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (user) {
    try {
      await sendEmail(
        user.email,
        'Payment Failed',
        `Your payment of $${(invoice.total / 100).toFixed(2)} failed. Please update your payment method.`
      );
    } catch (error) {
      console.error('⚠️ Failed to send payment failure email:', error);
    }
  }

  console.log('✅ Invoice marked as failed');
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('💳 Charge refunded:', charge.id);

  // Find and update refund request
  const refundRequest = await prisma.refundRequest.findFirst({
    where: {
      amount: charge.amount / 100,
      status: 'APPROVED',
    },
  });

  if (refundRequest) {
    await prisma.refundRequest.update({
      where: { id: refundRequest.id },
      data: {
        status: 'REFUNDED',
        stripeRefundId: charge.refunded ? charge.id : undefined,
      },
    });

    console.log('✅ Refund request marked as refunded');
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Export Stripe instance for direct access if needed
export { stripe };