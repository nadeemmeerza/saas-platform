'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SubscriptionCard({ subscription }: any) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">No active subscription</p>
          <Link href="/plans">
            <Button>Choose a Plan</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{subscription.tier.name}</h3>
          <p className="text-sm text-gray-600">${subscription.tier.priceMonthly}/month</p>
        </div>
        
        <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'destructive'}>
          {subscription.status}
        </Badge>

        <p className="text-sm text-gray-600">
          Renews in {daysUntilRenewal} days
        </p>

        <div className="flex gap-2 pt-2">
          <Link href="/plans">
            <Button variant="outline">Upgrade/Downgrade</Button>
          </Link>
          <Button variant="ghost">Manage</Button>
        </div>
      </CardContent>
    </Card>
  );
}