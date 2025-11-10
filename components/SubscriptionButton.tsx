// components/SubscriptionButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Check, Loader2, Crown, Sparkles, Zap, User, ArrowLeft } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

interface SubscriptionButtonProps {
  tierId: string;
  tierName: string;
  price?: number;
  currentPlan?: boolean;
}

export default function SubscriptionButton({ 
  tierId, 
  tierName, 
  price = 0,
  currentPlan = false 
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form steps: 'options' -> 'address' -> 'payment'
  const [formStep, setFormStep] = useState<'options' | 'address' | 'payment'>('options');
  const [formError, setFormError] = useState<string | null>(null);

  // Address form state
  const [formData, setFormData] = useState({
    customerName: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  // Calculate prices based on billing cycle
  const calculatePrice = () => {
    if (billingCycle === 'YEARLY' && price > 0) {
      const yearlyPrice = price * 12 * 0.8;
      return {
        monthly: price,
        yearly: yearlyPrice,
        display: yearlyPrice,
        savings: price * 12 - yearlyPrice
      };
    }
    return {
      monthly: price,
      yearly: price * 12,
      display: price,
      savings: 0
    };
  };

  const prices = calculatePrice();

  // ============ ADDRESS FORM HANDLERS ============
  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      },
    }));
  };

  const validateAddress = () => {
    const { customerName, billingAddress } = formData;

    if (!customerName.trim()) {
      setFormError('Customer name is required');
      return false;
    }

    if (!billingAddress.line1.trim()) {
      setFormError('Street address is required');
      return false;
    }

    if (!billingAddress.city.trim()) {
      setFormError('City is required');
      return false;
    }

    if (!billingAddress.postalCode.trim()) {
      setFormError('Postal code is required');
      return false;
    }

    if (billingAddress.country.length !== 2) {
      setFormError('Country code must be 2-letter ISO code (e.g., US, GB, IN)');
      return false;
    }

    return true;
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateAddress()) {
      return;
    }

    setFormStep('payment');
  };

  // ============ SUBSCRIPTION HANDLERS ============
  const handleSubscribe = async () => {
    setLoading(true);
    setFormError(null);

    try {
      // Call subscription API
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          tierId,
          billingCycle,
          customerName: formData.customerName,
          billingAddress: formData.billingAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      console.log('✅ Subscription created:', data);

      // Redirect to payment gateway
      if (data.url) {
        console.log('🔄 Redirecting to payment gateway...');  
        window.location.href = data.url;
      } else {
        throw new Error('Payment URL not available');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setFormError(message);
      console.error('❌ Error:', err);
      setLoading(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing dialog
      setFormStep('options');
      setFormError(null);
      setLoading(false);
    }
    setIsDialogOpen(open);
  };

  const getButtonVariant = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'enterprise':
        return 'default';
      case 'pro':
        return 'default';
      default:
        return price === 0 ? 'outline' : 'default';
    }
  };

  const getButtonText = (tierName: string, currentPlan: boolean, price: number) => {
    if (currentPlan) return 'Current Plan';
    
    if (price === 0) {
      return 'Get Started Free';
    }
    
    switch (tierName.toLowerCase()) {
      case 'enterprise':
        return 'Contact Sales';
      case 'pro':
        return 'Get Pro';
      case 'starter':
        return 'Get Started';
      default:
        return 'Choose Plan';
    }
  };

  const getButtonIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'enterprise':
        return <Crown className="w-4 h-4 mr-2" />;
      case 'pro':
        return <Zap className="w-4 h-4 mr-2" />;
      case 'starter':
        return <User className="w-4 h-4 mr-2" />;
      default:
        return <Sparkles className="w-4 h-4 mr-2" />;
    }
  };

  const isFreeTier = price === 0;

  const countryCodes = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IN', name: 'India' },
    { code: 'AU', name: 'Australia' },
    { code: 'CA', name: 'Canada' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'SG', name: 'Singapore' },
  ];

  // Handle free tier - no dialog, direct signup
  if (isFreeTier) {
    return (
      <Button 
        variant={getButtonVariant(tierName)} 
        className="w-full"
        onClick={() => {
          window.location.href = '/register';
        }}
        size="lg"
      >
        {getButtonIcon(tierName)}
        {getButtonText(tierName, currentPlan, price)}
      </Button>
    );
  }

  if (currentPlan) {
    return (
      <Button variant="outline" className="w-full" disabled size="lg">
        <Check className="w-4 h-4 mr-2" />
        Current Plan
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button 
          variant={getButtonVariant(tierName)} 
          className="w-full"
          size="lg"
        >
          {getButtonIcon(tierName)}
          {getButtonText(tierName, currentPlan, price)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {tierName}</DialogTitle>
          <DialogDescription>
            {formStep === 'options' && 'Choose your billing cycle and payment method'}
            {formStep === 'address' && 'Enter your billing address for export compliance'}
            {formStep === 'payment' && 'Review and complete your subscription'}
          </DialogDescription>
        </DialogHeader>

        {/* ============ STEP 1: OPTIONS (Billing & Payment Method) ============ */}
        {formStep === 'options' && (
          <div className="space-y-6 py-4">
            {/* Billing Cycle Selection */}
            <div className="space-y-3">
              <Label htmlFor="billing-cycle">Billing Cycle</Label>
              <RadioGroup 
                value={billingCycle} 
                onValueChange={(value: 'MONTHLY' | 'YEARLY') => setBillingCycle(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="MONTHLY" id="monthly" className="peer sr-only" />
                  <Label
                    htmlFor="monthly"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="text-lg font-bold">Monthly</div>
                    <div className="text-sm text-muted-foreground">${prices.monthly}/mo</div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="YEARLY" id="yearly" className="peer sr-only" />
                  <Label
                    htmlFor="yearly"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-1">
                      <div className="text-lg font-bold">Yearly</div>
                      <Badge variant="secondary" className="text-xs">
                        Save 20%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">${(prices.yearly / 12).toFixed(2)}/mo</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label htmlFor="payment-method">Payment Method</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value: 'card' | 'paypal') => setPaymentMethod(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit Card
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
                  <Label
                    htmlFor="paypal"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    PayPal
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Price Summary */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Plan</span>
                <span className="text-sm font-medium">{tierName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Billing</span>
                <span className="text-sm font-medium">
                  {billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total due today</span>
                  <span className="text-lg font-bold">
                    ${billingCycle === 'MONTHLY' ? prices.monthly : prices.yearly}
                  </span>
                </div>
                {billingCycle === 'YEARLY' && prices.savings > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Save ${prices.savings.toFixed(2)} compared to monthly billing
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 2: ADDRESS ============ */}
        {formStep === 'address' && (
          <div className="space-y-4 py-4">
            <form onSubmit={handleSubmitAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.billingAddress.line1}
                  onChange={(e) => handleAddressChange('line1', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Apartment, Suite (Optional)
                </label>
                <input
                  type="text"
                  value={formData.billingAddress.line2}
                  onChange={(e) => handleAddressChange('line2', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.billingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="San Francisco"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={formData.billingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.billingAddress.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="94102"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.billingAddress.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Continue to Payment
              </button>
            </form>
          </div>
        )}

        {/* ============ STEP 3: PAYMENT CONFIRMATION ============ */}
        {formStep === 'payment' && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Subscription:</strong> {tierName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Billing Cycle:</strong>{' '}
                {billingCycle === 'YEARLY' ? 'Annual' : 'Monthly'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Payment Method:</strong>{' '}
                {paymentMethod === 'card' ? 'Credit Card' : 'PayPal'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-4">
                ${billingCycle === 'MONTHLY' ? prices.monthly : prices.yearly}
                <span className="text-lg text-gray-600">
                  /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                </span>
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Customer:</strong> {formData.customerName}
                <br />
                <strong>Address:</strong> {formData.billingAddress.line1}
                {formData.billingAddress.line2 && `, ${formData.billingAddress.line2}`}
                {', '}
                {formData.billingAddress.city}, {formData.billingAddress.country}
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {formError}
              </div>
            )}
          </div>
        )}

        {/* ============ DIALOG FOOTER ============ */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {formStep === 'options' && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setFormStep('address')}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </>
          )}

          {formStep === 'address' && (
            <>
              <Button
                variant="outline"
                onClick={() => setFormStep('options')}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => handleSubmitAddress({ preventDefault: () => {} } as any)}
                className="w-full sm:w-auto"
              >
                Review Payment
              </Button>
            </>
          )}

          {formStep === 'payment' && (
            <>
              <Button
                variant="outline"
                onClick={() => setFormStep('address')}
                className="w-full sm:w-auto"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}