import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PaymentMethodManager from '@/components/ui/billing/PaymentMethodManager';
import RefundRequestForm from '@/components/ui/billing/RefundRequestForm';
// import PaymentMethodManager from '@/components/billing/PaymentMethodManager';
// import RefundRequestForm from '@/components/billing/RefundRequestForm';

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  isDefault: boolean;
}

interface User {
  id: string;
  paymentMethods: PaymentMethod[];
}

export default async function BillingPage() {
  const token = await getAuthToken();
  
  if (!token) {
    redirect("/login");
  }

  const userData = verifyToken(token);
  
  if (!userData) {
    redirect("/login");
  }

  const userId = userData.userId;

  let user: User | null = null;
  let invoices: Invoice[] = [];
  let totalSpent = 0;

  try {
    [user, invoices] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { paymentMethods: true },
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!user) {
      redirect('/login');
    }

    // Calculate total spent
    totalSpent = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0);

  } catch (error) {
    console.error('Error fetching billing data:', error);
    // In development, you might want to use mock data here
    // For now, we'll let the error propagate or show empty state
  }

  const paidInvoicesCount = invoices.filter(inv => inv.status === 'PAID').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Invoices</h1>
        <p className="text-gray-600 mt-2">Manage your payment methods and view invoice history</p>
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{invoices.length}</p>
            <p className="text-sm text-gray-500 mt-1">{paidInvoicesCount} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.paymentMethods?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {user?.paymentMethods?.filter(pm => pm.isDefault).length || 0} default
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <PaymentMethodManager paymentMethods={user?.paymentMethods || []} />

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No invoices found</div>
              <p className="text-sm text-gray-500">Your invoices will appear here once you have active subscriptions.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : invoice.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(invoice.periodStart).toLocaleDateString()} - {' '}
                      {new Date(invoice.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Refund Requests */}
      <RefundRequestForm invoices={invoices} />
    </div>
  );
}