import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { sendRefundApprovedEmail } from '@/lib/email';
import { getUserRole, requirePermission } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  const role = getUserRole();
  
  try {
    requirePermission(role!, 'manage_billing');
  } catch (error) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const { refundId } = await request.json();

  const refundRequest = await prisma.refundRequest.findUnique({
    where: { id: refundId },
    include: { user: true },
  });

  if (!refundRequest) {
    return NextResponse.json(
      { error: 'Refund request not found' },
      { status: 404 }
    );
  }

  try {
    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      amount: Math.round(refundRequest.amount * 100),
      metadata: { refundRequestId: refundId },
    });

    // Update refund request
    await prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: 'REFUNDED',
        stripeRefundId: refund.id,
      },
    });

    // Send email
    await sendRefundApprovedEmail(refundRequest.user.email, refundRequest.amount);

    return NextResponse.json(
      { message: 'Refund processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 400 }
    );
  }
}