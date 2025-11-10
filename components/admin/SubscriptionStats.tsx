'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SubscriptionStats {
  tierDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  growthMetrics: {
    newSubscriptions: number;
    churnRate: number;
    mrr: number;
    arr: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SubscriptionStats() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Mock data - replace with actual API call
      const mockStats: SubscriptionStats = {
        tierDistribution: [
          { name: 'Free', value: 45 },
          { name: 'Pro', value: 30 },
          { name: 'Enterprise', value: 15 },
          { name: 'Custom', value: 10 },
        ],
        statusDistribution: [
          { name: 'Active', value: 75 },
          { name: 'Trial', value: 15 },
          { name: 'Cancelled', value: 8 },
          { name: 'Past Due', value: 2 },
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 4000 },
          { month: 'Feb', revenue: 5200 },
          { month: 'Mar', revenue: 6100 },
          { month: 'Apr', revenue: 7800 },
          { month: 'May', revenue: 8900 },
          { month: 'Jun', revenue: 9500 },
        ],
        growthMetrics: {
          newSubscriptions: 42,
          churnRate: 2.3,
          mrr: 12500,
          arr: 150000,
        },
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch subscription stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Failed to load subscription statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Growth Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-500">New Subs</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{stats.growthMetrics.newSubscriptions}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.growthMetrics.churnRate}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-500">MRR</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${stats.growthMetrics.mrr.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-500">ARR</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${stats.growthMetrics.arr.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tier Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.tierDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.tierDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.statusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tier Distribution Detailed */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.tierDistribution.map((tier, index) => (
                      <div key={tier.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{tier.name}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {tier.value}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution Detailed */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.statusDistribution.map((status, index) => (
                      <div key={status.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{status.name}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {status.value}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}