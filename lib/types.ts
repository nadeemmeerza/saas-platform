export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  subscriptionStatus?: string;
}

export interface SubscriptionWithTier {
  id: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  renewalDate: Date;
  stripeSubscriptionId?: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  features: string[];
  limits: {
    maxUsers?: number;
    maxProjects?: number;
    maxApiCalls?: number;
    maxStorageGB: number;
  };
}

export interface BillingData {
  invoices: Invoice[];
  totalSpent: number;
  nextBillingDate: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: 'PENDING' | 'SENT' | 'PAID' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  paidAt?: Date;
  tax:number | null
}

// Add the SubscriptionStatus enum from your Prisma schema
export type SubscriptionStatus = 
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED';