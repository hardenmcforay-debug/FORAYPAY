'use client'

import { useMemo, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  transactions: Array<{
    amount: number
    created_at: string
  }>
}

export default function RevenueChart({ transactions }: RevenueChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Group transactions by month (last 12 months)
  const chartData = useMemo(() => {
    const months = 12
    const data: { month: string; monthKey: string; revenue: number; year: number }[] = []
    const today = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const monthRevenue = transactions
        .filter(t => {
          const transDate = new Date(t.created_at)
          const transMonthKey = `${transDate.getFullYear()}-${String(transDate.getMonth() + 1).padStart(2, '0')}`
          return transMonthKey === monthKey
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      
      data.push({
        month: monthName,
        monthKey,
        revenue: monthRevenue,
        year: date.getFullYear()
      })
    }
    
    return data
  }, [transactions])

  // Calculate average revenue to determine high/low
  const averageRevenue = useMemo(() => {
    const revenues = chartData.map(d => d.revenue).filter(r => r > 0)
    if (revenues.length === 0) return 0
    return revenues.reduce((sum, r) => sum + r, 0) / revenues.length
  }, [chartData])

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const chartHeight = 250

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <TrendingUp className="w-12 h-12 mb-2 opacity-50 animate-pulse" />
        <p className="text-sm">Loading chart...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {chartData.length > 0 && chartData.some(d => d.revenue > 0) ? (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success-500 rounded"></div>
              <span className="text-gray-600">High Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning-500 rounded"></div>
              <span className="text-gray-600">Average Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-error-500 rounded"></div>
              <span className="text-gray-600">Low Revenue</span>
            </div>
          </div>

          {/* Chart */}
          <div className="relative" style={{ height: `${chartHeight}px` }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>{maxRevenue > 0 ? formatCurrency(Math.ceil(maxRevenue)) : formatCurrency(0)}</span>
              <span>{formatCurrency(0)}</span>
            </div>

            {/* Chart bars */}
            <div className="ml-16 h-full flex items-end gap-1">
              {chartData.map((item, index) => {
                const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * (chartHeight - 60) : 0
                
                // Determine if high, average, or low revenue
                let barColor = 'bg-gray-400'
                let indicator = null
                
                if (item.revenue > 0) {
                  if (item.revenue >= averageRevenue * 1.2) {
                    barColor = 'bg-success-500 hover:bg-success-600'
                    indicator = <TrendingUp className="w-3 h-3 text-success-600" />
                  } else if (item.revenue >= averageRevenue * 0.8) {
                    barColor = 'bg-warning-500 hover:bg-warning-600'
                    indicator = <Minus className="w-3 h-3 text-warning-600" />
                  } else {
                    barColor = 'bg-error-500 hover:bg-error-600'
                    indicator = <TrendingDown className="w-3 h-3 text-error-600" />
                  }
                }
                
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1 group"
                    style={{ maxWidth: `${100 / chartData.length}%` }}
                  >
                    <div className="relative w-full flex flex-col items-center" style={{ height: `${chartHeight - 60}px` }}>
                      {/* Revenue indicator */}
                      {item.revenue > 0 && indicator && (
                        <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {indicator}
                        </div>
                      )}
                      
                      {/* Bar */}
                      <div className="w-full flex items-end justify-center">
                        <div
                          className={`${barColor} rounded-t transition-all relative group/bar`}
                          style={{ 
                            height: `${barHeight}px`, 
                            minHeight: item.revenue > 0 ? '4px' : '0',
                            width: '85%'
                          }}
                        >
                          {item.revenue > 0 && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {formatCurrency(item.revenue)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Month label */}
                    <div className="text-xs text-gray-600 mt-2 text-center font-medium" style={{ fontSize: '10px' }}>
                      {item.month.split(' ')[0]}
                    </div>
                    <div className="text-xs text-gray-500 text-center" style={{ fontSize: '9px' }}>
                      {item.year}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Highest Month</p>
              <p className="text-sm font-semibold text-gray-900">
                {chartData.reduce((max, item) => item.revenue > max.revenue ? item : max, chartData[0]).month.split(' ')[0]}
              </p>
              <p className="text-xs text-success-600 font-medium">
                {formatCurrency(chartData.reduce((max, item) => item.revenue > max.revenue ? item : max, chartData[0]).revenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Average</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(averageRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Lowest Month</p>
              <p className="text-sm font-semibold text-gray-900">
                {chartData.filter(d => d.revenue > 0).length > 0 
                  ? chartData.filter(d => d.revenue > 0).reduce((min, item) => item.revenue < min.revenue ? item : min, chartData.filter(d => d.revenue > 0)[0]).month.split(' ')[0]
                  : 'N/A'}
              </p>
              <p className="text-xs text-error-600 font-medium">
                {chartData.filter(d => d.revenue > 0).length > 0
                  ? formatCurrency(chartData.filter(d => d.revenue > 0).reduce((min, item) => item.revenue < min.revenue ? item : min, chartData.filter(d => d.revenue > 0)[0]).revenue)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm">No revenue data available</p>
          <p className="text-xs text-gray-500 mt-1">Revenue data will appear here once transactions are recorded</p>
        </div>
      )}
    </div>
  )
}

