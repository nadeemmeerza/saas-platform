import { NextRequest, NextResponse } from 'next/server';
import { trackUsage } from '@/lib/usage';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  const userData = verifyToken(token as string)
  const userId = userData.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { metric, value } = await request.json();

  try {
    await trackUsage(userId, metric, value);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 400 }
    );
  }
}