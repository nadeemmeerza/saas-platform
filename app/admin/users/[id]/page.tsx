// app/admin/users/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Shield,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      subscription: {
        include: {
          tier: true,
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      paymentMethods: true,
      _count: {
        select: {
          invoices: true,
          usageRecords: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const totalSpent = user.invoices
    .filter((inv:any) => inv.status === 'PAID')
    .reduce((sum:number, inv:any) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-gray-600">Manage user account and view activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {user.name || 'No Name'}
                  </div>
                  <div className="text-gray-500">{user.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Role</div>
                  <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Joined</div>
                  <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Total Invoices</div>
                  <div>{user._count.invoices}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Total Spent</div>
                  <div>${totalSpent.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {user.subscription ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Plan</span>
                    <Badge variant="secondary">{user.subscription.tier.name}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status</span>
                    <Badge variant="default">{user.subscription.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Renewal Date</span>
                    <span>{new Date(user.subscription.renewalDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No active subscription
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                {user.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Invoices</span>
                <span>{user._count.invoices}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage Records</span>
                <span>{user._count.usageRecords}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Methods</span>
                <span>{user.paymentMethods.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}