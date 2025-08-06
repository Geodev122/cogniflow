import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ProgressData {
  date: string
  value: number
  metric_type: string
}

interface ProgressChartProps {
  data: ProgressData[]
  title: string
  metricType: string
  color?: string
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  title, 
  metricType, 
  color = 'blue' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No data available yet</p>
          <p className="text-sm">Complete assessments to see your progress</p>
        </div>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const maxValue = Math.max(...sortedData.map(d => d.value))
  const minValue = Math.min(...sortedData.map(d => d.value))
  const range = maxValue - minValue || 1

  const getTrend = () => {
    if (sortedData.length < 2) return 'stable'
    const recent = sortedData.slice(-3)
    const older = sortedData.slice(-6, -3)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length
    const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length
    
    const change = recentAvg - olderAvg
    if (Math.abs(change) < 1) return 'stable'
    
    // For depression/anxiety, lower is better
    if (metricType.includes('depression') || metricType.includes('anxiety')) {
      return change < 0 ? 'improving' : 'worsening'
    }
    // For mood/wellbeing, higher is better
    return change > 0 ? 'improving' : 'worsening'
  }

  const trend = getTrend()
  const latestValue = sortedData[sortedData.length - 1]?.value || 0

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'worsening': return <TrendingDown className="w-5 h-5 text-red-600" />
      default: return <Minus className="w-5 h-5 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100'
      case 'worsening': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1 capitalize">{trend}</span>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900">{latestValue}</div>
        <div className="text-sm text-gray-500">Current Score</div>
      </div>

      {/* Chart */}
      <div className="relative h-32 mb-4">
        <svg className="w-full h-full" viewBox="0 0 400 120">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={120 - y * 1.2}
              x2="400"
              y2={120 - y * 1.2}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}

          {/* Data line */}
          {sortedData.length > 1 && (
            <polyline
              fill="none"
              stroke={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sortedData.map((point, index) => {
                const x = (index / (sortedData.length - 1)) * 380 + 10
                const y = 110 - ((point.value - minValue) / range) * 100
                return `${x},${y}`
              }).join(' ')}
            />
          )}

          {/* Data points */}
          {sortedData.map((point, index) => {
            const x = (index / Math.max(sortedData.length - 1, 1)) * 380 + 10
            const y = 110 - ((point.value - minValue) / range) * 100
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'}
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{`${new Date(point.date).toLocaleDateString()}: ${point.value}`}</title>
              </circle>
            )
          })}
        </svg>
      </div>

      {/* Date range */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{new Date(sortedData[0].date).toLocaleDateString()}</span>
        <span>{new Date(sortedData[sortedData.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  )
}