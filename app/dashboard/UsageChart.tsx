'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UsageChart({ usage }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          Usage charts will be displayed here
        </div>
      </CardContent>
    </Card>
  )
}