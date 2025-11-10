// app/dashboard/page.tsx - No mock data version
import { prisma } from '@/lib/prisma'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubscriptionCard from './SubscriptionCard';
import BillingOverview from './BillingOverview';
import UsageChart from './UsageChart';


export default async function DashboardPage() {
  const token = await getAuthToken();
  
  if (!token) {
    redirect('/login');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect('/login');
  }

  const userId = decoded.userId;

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: { tier: true },
      },
      invoices: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      usageRecords: {
        take: 30,
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  if (!userData) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {userData.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SubscriptionCard subscription={userData.subscription} />
        <BillingOverview invoices={userData.invoices} />
        <UsageChart usage={userData.usageRecords} />
      </div>
    </div>
  )
}