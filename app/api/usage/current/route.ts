import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const usageRecords = await prisma.usageRecord.groupBy({
    by: ['metric'],
    where: {
      userId,
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    _sum: { value: true },
  });

  return NextResponse.json(usageRecords);
}