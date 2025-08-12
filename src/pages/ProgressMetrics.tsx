import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface Metric {
  client_id: string
  metric_date: string
  metric_type: string
  value: number
}

export default function ProgressMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [clientFilter, setClientFilter] = useState('')
  const [metricFilter, setMetricFilter] = useState('')

  useEffect(() => {
    fetch('/api/progress-metrics')
      .then(res => res.json())
      .then(setMetrics)
      .catch(err => console.error('Failed to load metrics', err))
  }, [])

  const clients = useMemo(() => Array.from(new Set(metrics.map(m => m.client_id))), [metrics])
  const metricTypes = useMemo(() => Array.from(new Set(metrics.map(m => m.metric_type))), [metrics])

  const filtered = metrics.filter(m =>
    (clientFilter ? m.client_id === clientFilter : true) &&
    (metricFilter ? m.metric_type === metricFilter : true)
  )

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>Progress Metrics</h1>
      <div className='flex gap-4 mb-4'>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
          <option value=''>All Clients</option>
          {clients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={metricFilter} onChange={e => setMetricFilter(e.target.value)}>
          <option value=''>All Metrics</option>
          {metricTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width='100%' height={300}>
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='metric_date' />
          <YAxis />
          <Tooltip />
          <Line type='monotone' dataKey='value' stroke='#8884d8' />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
