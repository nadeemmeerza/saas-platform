// import { getUserId, getUserRole } from '@/lib/rbac';
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserManagementTable from "@/components/admin/UserManagementTable";
import SubscriptionStats from "@/components/admin/SubscriptionStats";
import RefundRequestsTable from "@/components/admin/RefundRequestsTable";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyToken } from "@/lib/auth";

export default async function AdminPage() {
  
  const token = await getAuthToken();
  const user = verifyToken(token as string);

  if (!user) {
    redirect("/login");
  }

  const userId = user.userId;
  const role = user.role;

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    pendingRefunds,
    refundRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.refundRequest.count({ where: { status: "PENDING" } }),
    prisma.refundRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeSubscriptions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${(totalRevenue._sum.total || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRefunds}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Stats */}
      <SubscriptionStats />

      {/* Pending Refund Requests */}
      <RefundRequestsTable requests={refundRequests} />

      {/* User Management */}
      <UserManagementTable />
    </div>
  );
}
