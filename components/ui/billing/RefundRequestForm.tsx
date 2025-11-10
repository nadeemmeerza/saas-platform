'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RefundRequestForm({ invoices }: any) {
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/refund/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice,
          reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Refund request submitted successfully');
        setSelectedInvoice('');
        setReason('');
      } else {
        setMessage(data.error || 'Failed to submit refund request');
      }
    } catch (error) {
      setMessage('Error submitting refund request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a Refund</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Invoice</Label>
            <select
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
              className="w-full border rounded-md p-2"
              required
            >
              <option value="">Select an invoice</option>
              {invoices.map((inv: any) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - ${inv.total.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Reason</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you requesting a refund?"
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Refund Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}