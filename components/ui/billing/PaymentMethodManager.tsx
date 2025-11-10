'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PaymentMethodManager({ paymentMethods }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">No payment methods added</p>
            <Button>Add Payment Method</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((method: any) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">
                    {method.cardBrand} •••• {method.cardLast4}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires {method.cardExpMonth}/{method.cardExpYear}
                  </p>
                </div>
                {method.isDefault && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}