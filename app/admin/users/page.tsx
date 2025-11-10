// app/admin/users/page.tsx
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  User, 
  Shield, 
  Mail, 
  Eye,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';

interface UserWithDetails {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  subscription: {
    tier: {
      name: string;
    };
  } | null;
  _count: {
    invoices: number;
  };
}

export default async function AdminUsersPage() {
  await requireAdmin();

  let users: UserWithDetails[] = [];
  let totalUsers = 0;
  let activeSubscriptions = 0;

  try {
    [users, totalUsers, activeSubscriptions] = await Promise.all([
      // Get users with their details
      prisma.user.findMany({
        include: {
          subscription: {
            include: {
              tier: true,
            },
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit for pagination
      }),
      // Total user count
      prisma.user.count(),
      // Active subscriptions count
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      }),
    ]);
  } catch (error) {
    console.error('Error fetching users:', error);
    // In production, you might want to handle this differently
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive">Admin</Badge>;
      case 'USER':
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getPlanBadge = (subscription: any) => {
    if (!subscription) {
      return <Badge variant="outline">No Plan</Badge>;
    }
    
    switch (subscription.tier.name.toLowerCase()) {
      case 'enterprise':
        return <Badge variant="default">Enterprise</Badge>;
      case 'pro':
        return <Badge variant="secondary">Pro</Badge>;
      case 'premium':
        return <Badge variant="outline">Premium</Badge>;
      default:
        return <Badge variant="outline">{subscription.tier.name}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all users and their subscriptions
          </p>
        </div>
        <Link href="/admin/users/invite">
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-gray-500">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Shield className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-gray-500">
              Currently active plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === 'ADMIN').length}
            </div>
            <p className="text-xs text-gray-500">
              Users with admin access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by email or name..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select className="border rounded-md px-3 py-2 text-sm">
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <select className="border rounded-md px-3 py-2 text-sm">
                <option value="all">All Plans</option>
                <option value="enterprise">Enterprise</option>
                <option value="pro">Pro</option>
                <option value="free">Free</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getPlanBadge(user.subscription)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user._count.invoices}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role === 'USER' ? (
                              <DropdownMenuItem className="text-blue-600">
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-orange-600">
                                <User className="mr-2 h-4 w-4" />
                                Make User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {users.length} of {totalUsers} users
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>New user registrations (last 7 days)</span>
                <Badge variant="outline">+12</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Subscription upgrades</span>
                <Badge variant="outline">+5</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Support tickets</span>
                <Badge variant="outline">3 open</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/users/invite">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite New User
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Send Bulk Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Export User Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}