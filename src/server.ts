import express from 'express'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const app = express()

app.get('/api/progress-metrics', async (req: express.Request, res: express.Response) => {
  const { clientId, metricType, startDate, endDate } = req.query

  let query = supabase
    .from('progress_metrics')
    .select('*')
    .order('metric_date')

  if (clientId) query = query.eq('client_id', clientId as string)
  if (metricType) query = query.eq('metric_type', metricType as string)
  if (startDate) query = query.gte('metric_date', startDate as string)
  if (endDate) query = query.lte('metric_date', endDate as string)

  const { data, error } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})
