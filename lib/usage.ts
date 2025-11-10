import { prisma } from '@/lib/prisma';

export async function trackUsage(
  userId: string,
  metric: string,
  value: number
) {
  // Record usage
  await prisma.usageRecord.create({
    data: {
      userId,
      metric,
      value,
    },
  });

  // Check limits
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { tier: true },
  });

  if (!subscription) return;

  // Aggregate usage
  const usage = await prisma.usageRecord.aggregate({
    where: {
      userId,
      metric,
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    _sum: { value: true },
  });

  const totalUsage = usage._sum.value || 0;

  // Check if exceeded
  if (metric === 'STORAGE_GB' && totalUsage > subscription.tier.maxStorageGB) {
    // Handle overage
    console.warn(`User ${userId} exceeded storage limit`);
  }
}

export async function getUserUsage(userId: string, metric: string) {
  const usage = await prisma.usageRecord.aggregate({
    where: {
      userId,
      metric,
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    _sum: { value: true },
  });

  return usage._sum.value || 0;
}