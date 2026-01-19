'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  companyId: string
}

export default function RevenueChart({ companyId }: RevenueChartProps) {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Get last 7 days of revenue
      const days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        days.push(date.toISOString().split('T')[0])
      }

      const revenueData = await Promise.all(
        days.map(async (day) => {
          const start = new Date(day)
          start.setHours(0, 0, 0, 0)
          const end = new Date(day)
          end.setHours(23, 59, 59, 999)

          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('company_id', companyId)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .eq('status', 'completed')

          const revenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

          return {
            date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue,
          }
        })
      )

      setData(revenueData)
      setIsLoading(false)
    }

    if (companyId) {
      fetchData()
    }
  }, [companyId])

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

