// app/api/billing/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, verifyToken } from "@/lib/auth";
import { createStripeCustomer, createSubscription } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionConfirmationEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { describe } from "node:test";

export async function POST(request: NextRequest) {
  try {
    // ============ 1. AUTHENTICATION ============
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userData = verifyToken(token);
    if (!userData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.log("🔐 User authenticated:", userData.userId);

    // ============ 2. VALIDATE INPUT ============
    const body = await request.json();
    const {
      tierId,
      billingCycle,
      customerName,
      billingAddress,
      shippingAddress,
    } = body;

     console.log("📋 Subscription request: Now validating each...", {
      userId: userData.userId,
      tierId,
      billingCycle,
      customerName, billingAddress, shippingAddress
    });


    // Validate address
    if (!billingAddress || !billingAddress.country) {
      return NextResponse.json(
        {
          error:
            "Billing address with country is required for export transactions",
        },
        { status: 400 }
      );
    }

    // Validate country code is 2-letter ISO
    if (billingAddress.country.length !== 2) {
      return NextResponse.json(
        { error: "Country code must be 2-letter ISO code (e.g., US, GB, IN)" },
        { status: 400 }
      );
    }

    if (!tierId || typeof tierId !== "string" || tierId.length === 0) {
      return NextResponse.json(
        { error: "Tier ID is required" },
        { status: 400 }
      );
    }

    if (
      !billingCycle ||
      (billingCycle !== "MONTHLY" && billingCycle !== "YEARLY")
    ) {
      return NextResponse.json(
        { error: "Billing cycle must be MONTHLY or YEARLY" },
        { status: 400 }
      );
    }

   
    // ============ 3. VERIFY TIER EXISTS ============
    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
      include: { features: true },
    });

    if (!tier) {
      return NextResponse.json(
        { error: "Subscription tier not found" },
        { status: 404 }
      );
    }

    if (!tier.isActive) {
      return NextResponse.json(
        { error: "This tier is no longer available" },
        { status: 400 }
      );
    }

    console.log("✅ Tier verified:", tier.name);

    // ============ 4. CHECK EXISTING SUBSCRIPTION ============
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: userData.userId },
      include: { tier: true },
    });

    if (existingSubscription && existingSubscription.status !== "CANCELLED") {
      console.warn("⚠️ User already has active subscription");
      return NextResponse.json(
        {
          error: "You already have an active subscription",
          currentPlan: existingSubscription.tier.name,
          message: "Please upgrade/downgrade or cancel your current plan first",
        },
        { status: 400 }
      );
    }

    // ============ 5. GET OR CREATE STRIPE CUSTOMER ============
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;
    let description = user.description;

    if (!stripeCustomerId) {
      console.log("👤 Creating Stripe customer...");
      const stripeCustomer = await createStripeCustomer(
        user.id,
        user.email,
        customerName || user.name || undefined,
        billingAddress,
        shippingAddress
      );
      stripeCustomerId = stripeCustomer.id;
      console.log(
        "✅ Stripe customer created: in subscribe/route",
        stripeCustomerId
      );
    } else {
      console.log("✅ Using existing Stripe customer:", stripeCustomerId);
    }

    // ============ 6. GET STRIPE PRICE ID ============
    // Note: Store these in your database or environment variables
    // Format: price_1234567890_monthly and price_1234567890_yearly
    const priceIdMap: Record<string, { monthly: string; yearly: string }> = {
      [tier.id]: {
        monthly:
          process.env[`STRIPE_PRICE_${tier.name.toUpperCase()}_MONTHLY`] || "",
        yearly:
          process.env[`STRIPE_PRICE_${tier.name.toUpperCase()}_YEARLY`] || "",
      },
    };

    const priceId =
      billingCycle === "YEARLY"
        ? priceIdMap[tier.id].yearly
        : priceIdMap[tier.id].monthly;

    if (!priceId) {
      console.error("❌ Price ID not configured for:", tier.name, billingCycle);
      return NextResponse.json(
        { error: "Subscription pricing not configured" },
        { status: 500 }
      );
    }

    console.log("💳 Using Stripe price ID:", priceId);

    // ============ 7. CREATE STRIPE SUBSCRIPTION ============
    console.log("🔄 Creating Stripe subscription...");
    const stripeSubscriptionResponse = await createSubscription(
      user.id,
      stripeCustomerId,
      tierId,
      priceId,
      billingCycle,
      description
    );
    // Get the hosted invoice URL
    const hostedInvoiceUrl =
      typeof stripeSubscriptionResponse.latest_invoice === "object"
        ? stripeSubscriptionResponse.latest_invoice?.hosted_invoice_url
        : undefined;

    if (!hostedInvoiceUrl) {
      console.warn("⚠️ No hosted invoice URL available");
    }

    console.log("💳 Hosted Invoice URL:", hostedInvoiceUrl);

    const invoiceId =
      typeof stripeSubscriptionResponse.latest_invoice === "object"
        ? stripeSubscriptionResponse.latest_invoice?.id
        : undefined;

    console.log("💳  Invoice id:", invoiceId);

    const stripeSubscription = stripeSubscriptionResponse.items.data[0];
    console.log("✅ Stripe subscription created:", stripeSubscription.id);

    const url = stripeSubscriptionResponse.items.url;

    console.log("response of stripSubscription", stripeSubscriptionResponse);

    // ============ 8. RECORD SUBSCRIPTION IN DATABASE ============
    // Type-safe way to access Stripe subscription properties

    const currentPeriodEnd =
      typeof stripeSubscription.current_period_end === "number"
        ? stripeSubscription.current_period_end
        : Math.floor(new Date().getTime() / 1000);

    const trialEnd =
      typeof stripeSubscriptionResponse.trial_end === "number"
        ? stripeSubscriptionResponse.trial_end
        : null;

    const subscriptionData = await prisma.subscription.create({
      data: {
        userId: user.id,
        tierId: tier.id,
        status:
          stripeSubscriptionResponse.status === "active" ? "ACTIVE" : "TRIAL",
        billingCycle,
        stripeSubscriptionId: stripeSubscription.id,
        startDate: new Date(),
        renewalDate: new Date(currentPeriodEnd * 1000),
        trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
      },
      include: {
        tier: true,
      },
    });

    console.log("✅ Subscription recorded in database:", subscriptionData.id);

    // ============ 9. CREATE INITIAL INVOICE ============
    const upcomingInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}-${user.id.slice(0, 8)}`,
        userId: user.id,
        subtotal:
          billingCycle === "YEARLY"
            ? tier.priceYearly || tier.priceMonthly * 12
            : tier.priceMonthly,
        tax: 0, // Add tax calculation logic as needed
        total:
          billingCycle === "YEARLY"
            ? tier.priceYearly || tier.priceMonthly * 12
            : tier.priceMonthly,
        status: "PENDING",
        description: `${tier.name} - ${
          billingCycle === "YEARLY" ? "Annual" : "Monthly"
        } Subscription`,
        periodStart: new Date(),
        periodEnd: subscriptionData.renewalDate,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        stripeInvoiceId: invoiceId,
      },
    });

    console.log("✅ Invoice created:", upcomingInvoice.id);

    // ============ 10. LOG AUDIT TRAIL ============
    await logAudit(
      "SUBSCRIPTION_CREATED",
      "Subscription",
      subscriptionData.id,
      user.id,
      undefined,
      {
        tier: tier.name,
        billingCycle,
        stripeSubscriptionId: stripeSubscription.id,
        amount: upcomingInvoice.total,
      },
      request.headers.get("x-forwarded-for") || "unknown",
      request.headers.get("user-agent") || "unknown"
    );

    // ============ 11. SEND CONFIRMATION EMAIL ============
    try {
      await sendSubscriptionConfirmationEmail(user.email, tier.name);
      console.log("✅ Confirmation email sent");
    } catch (emailError) {
      console.error("⚠️ Email sending failed:", emailError);
      // Don't fail the subscription creation if email fails
    }

    // ============ 12. RETURN SUCCESS RESPONSE ============
    const response = {
      success: true,
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        tier: {
          id: tier.id,
          name: tier.name,
          price:
            billingCycle === "YEARLY"
              ? tier.priceYearly || tier.priceMonthly * 12
              : tier.priceMonthly,
        },
        billingCycle,
        startDate: subscriptionData.startDate,
        renewalDate: subscriptionData.renewalDate,
        features: tier.features.map((f: { name: string }) => f.name),
        limits: {
          maxStorageGB: tier.maxStorageGB,
          maxApiCalls: tier.maxApiCalls,
          maxProjects: tier.maxProjects,
          maxUsers: tier.maxUsers,
        },
      },
      invoice: {
        id: upcomingInvoice.id,
        invoiceNumber: upcomingInvoice.invoiceNumber,
        amount: upcomingInvoice.total,
        dueDate: upcomingInvoice.dueDate,
      },
      message: `Successfully subscribed to ${tier.name} plan!`,
      nextSteps: {
        paymentSetup: "Update your payment method in billing settings",
        features: "Start exploring your new features",
        support: "Contact support if you need help",
      },
      url: hostedInvoiceUrl,
    };

    console.log("✅ Subscription flow completed successfully");
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("❌ Subscription error:", error);

    // ============ ERROR HANDLING ============
    if (error instanceof Error) {
      // Stripe-specific errors
      if (error.message.includes("Stripe")) {
        return NextResponse.json(
          { error: "Payment processing error. Please try again." },
          { status: 400 }
        );
      }

      // Database errors
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Subscription already exists for this user" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create subscription. Please try again later." },
      { status: 500 }
    );
  }
}

// ============ OPTIONS - CORS HANDLING ============
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
