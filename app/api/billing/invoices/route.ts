import { NextRequest, NextResponse } from 'next/server' ;
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';


export async function GET(request: NextRequest) {
  const token = await getAuthToken()
  if(!token)
    redirect("/")

  const userData = verifyToken(token)
  const userId = userData.userId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invoices);
}