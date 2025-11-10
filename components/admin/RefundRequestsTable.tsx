'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RefundRequestsTable({ requests }: any) {
  const [loading, setLoading] = useState(false);

  const handleApproveRefund = async (refundId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/refund/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/refund/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Refund Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request: any) => (
              <TableRow key={request.id}>
                <TableCell>{request.user.email}</TableCell>
                <TableCell>${request.amount.toFixed(2)}</TableCell>
                <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                <TableCell>
                  <Badge>{request.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveRefund(request.id)}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectRefund(request.id)}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}