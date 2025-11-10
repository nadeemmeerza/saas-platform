// app/plans/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionButton from '@/components/SubscriptionButton';
import { prisma } from '@/lib/prisma';
import { Check, Crown, Zap, Star } from 'lucide-react';
// import SubscriptionForm from '@/components/SubscriptionForm';


// Mock data for development fallback (only if absolutely needed - prefer DB data)
const mockTiers = [
  {
    id: '1',
    name: 'Starter',
    description: 'Perfect for individuals and small projects',
    priceMonthly: 0,
    priceYearly: 0,
    maxStorageGB: 5,
    maxApiCalls: 1000,
    maxProjects: 3,
    maxUsers: 1,
    features: [
      { name: 'Basic Analytics' },
      { name: 'Email Support' },
      { name: '1GB Storage' }
    ],
    isActive: true,
    displayOrder: 1
  },
  {
    id: '2',
    name: 'Pro',
    description: 'For growing teams and businesses',
    priceMonthly: 29,
    priceYearly: 290,
    maxStorageGB: 100,
    maxApiCalls: 10000,
    maxProjects: 10,
    maxUsers: 5,
    features: [
      { name: 'Advanced Analytics' },
      { name: 'Priority Support' },
      { name: '100GB Storage' },
      { name: 'API Access' }
    ],
    isActive: true,
    displayOrder: 2
  },
  {
    id: '3',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    priceMonthly: 99,
    priceYearly: 990,
    maxStorageGB: 1000,
    maxApiCalls: 100000,
    maxProjects: 100,
    maxUsers: 50,
    features: [
      { name: 'Custom Analytics' },
      { name: '24/7 Support' },
      { name: '1TB Storage' },
      { name: 'Advanced API' },
      { name: 'Custom Domain' }
    ],
    isActive: true,
    displayOrder: 3
  }
];

export default async function PlansPage() {
  let tiers: any[] = [];
  let usingMockData = false;

  try {
    // Fetch real data from database with proper nested includes for features
    tiers = await prisma.subscriptionTier.findMany({
      where: { isActive: true },
      include: { 
        features: { 
          include: { 
            feature: true // Nested include to get actual Feature details
          } 
        } 
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Transform features to match expected shape (flat array of feature names/objects)
    tiers = tiers.map((tier) => ({
      ...tier,
      features: tier.features.map((junction: any) => ({
        id: junction.featureId,
        name: junction.feature.name,
        description: junction.feature.description
      }))
    }));

    console.log(tiers);
    
    // If no tiers found, use mock data (but log and show notice)
    if (tiers.length === 0) {
      console.log('No subscription tiers found in database, using mock data');
      tiers = mockTiers;
      usingMockData = true;
    }
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    // Fallback to mock data in case of error
    tiers = mockTiers;
    usingMockData = true;
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'enterprise':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'pro':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'starter':
      case 'basic':
        return <Star className="w-5 h-5 text-green-500" />;
      default:
        return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'enterprise':
        return 'border-purple-300 shadow-lg scale-105';
      case 'pro':
        return 'border-blue-300 shadow-lg scale-105';
      case 'starter':
      case 'basic':
        return 'border-green-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Development Notice */}
        {usingMockData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 text-sm text-center">
              🔧 Development Mode: Using mock subscription data. Set up your database for real pricing plans.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All plans include our core features with no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative transition-all duration-300 hover:shadow-xl ${getTierColor(tier.name)}`}
            >
              {/* Popular Badge for Pro tier */}
              {tier.name.toLowerCase() === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Free Badge for Starter tier */}
              {tier.priceMonthly === 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1 text-sm font-semibold">
                    Free Forever
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTierIcon(tier.name)}
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                </div>
                <p className="text-gray-600 text-sm">{tier.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      ${tier.priceMonthly}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  {tier.priceYearly && tier.priceYearly > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      ${tier.priceYearly}/year (Save {Math.round((1 - tier.priceYearly / (tier.priceMonthly * 12)) * 100)}%)
                    </p>
                  )}
                  {tier.priceMonthly === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No credit card required</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {tier.features.map((feature: any) => (
                    <div key={feature.id || feature.name} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature.name}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-semibold text-gray-900">What's included:</p>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li className="flex justify-between">
                      <span>Storage:</span>
                      <span className="font-medium">{tier.maxStorageGB}GB</span>
                    </li>
                    {tier.maxApiCalls !== undefined && tier.maxApiCalls !== null && (
                      <li className="flex justify-between">
                        <span>API Calls:</span>
                        <span className="font-medium">{tier.maxApiCalls < 0 ? 'Unlimited' : tier.maxApiCalls.toLocaleString()}/month</span>
                      </li>
                    )}
                    {tier.maxProjects !== undefined && tier.maxProjects !== null && (
                      <li className="flex justify-between">
                        <span>Projects:</span>
                        <span className="font-medium">{tier.maxProjects < 0 ? 'Unlimited' : tier.maxProjects}</span>
                      </li>
                    )}
                    {tier.maxUsers !== undefined && tier.maxUsers !== null && (
                      <li className="flex justify-between">
                        <span>Team Members:</span>
                        <span className="font-medium">{tier.maxUsers < 0 ? 'Unlimited' : tier.maxUsers}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Subscription Button */}
                <div className="pt-2">
                  <SubscriptionButton 
                    tierId={tier.id} 
                    tierName={tier.name}
                    price={tier.priceMonthly}
                  />
                  {/* <SubscriptionForm  tierId={tier.id} 
                    tierName={tier.name}
                    price={tier.priceMonthly}/>  */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-6">All plans include</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Secure Data Encryption</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>24/7 Customer Support</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Regular Backups</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>SSO Integration</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>API Access</span>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <div className="grid gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2">Can I change plans later?</h4>
                <p className="text-gray-600 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is there a free trial?</h4>
                <p className="text-gray-600 text-sm">
                  All paid plans come with a 14-day free trial. No credit card required to start.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600 text-sm">
                  We accept all major credit cards, PayPal, and bank transfers for annual plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}