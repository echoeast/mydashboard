import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  const admin = getSupabaseAdmin()

  // Fetch report metadata
  const { data: report, error } = await admin
    .from('reports')
    .select('id, title, client_name, period, published, brand_color, password')
    .eq('id', id)
    .single()

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found' })
  }

  if (!report.published) {
    return res.status(403).json({ error: 'Report is not published' })
  }

  // If POST with password, verify and return full content
  if (req.method === 'POST') {
    const submittedPassword = req.body?.password || ''

    if (report.password && report.password !== submittedPassword) {
      return res.status(401).json({ error: 'Incorrect password' })
    }

    const [sectionsRes, brandRes] = await Promise.all([
      admin.from('report_sections').select('*').eq('report_id', id).order('order_index'),
      admin.from('business_settings').select('*').limit(1).maybeSingle(),
    ])

    return res.status(200).json({
      report: {
        id: report.id,
        title: report.title,
        client_name: report.client_name,
        period: report.period,
        brand_color: report.brand_color,
      },
      sections: sectionsRes.data || [],
      brand: brandRes.data || null,
    })
  }

  // GET returns only metadata (does this report exist and need a password)
  return res.status(200).json({
    id: report.id,
    title: report.title,
    has_password: !!report.password,
    brand_color: report.brand_color,
  })
}
