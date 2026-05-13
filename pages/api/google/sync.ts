import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { getAuthenticatedClient } from '@/lib/google'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { project_id } = req.body
  if (!project_id) return res.status(400).json({ error: 'Missing project_id' })

  try {
    const auth = await getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const admin = getSupabaseAdmin()
    const { data: project } = await admin.from('projects').select('name').eq('id', project_id).single()
    const { data: tasks } = await admin
      .from('tasks')
      .select('*')
      .eq('project_id', project_id)
      .not('start_at', 'is', null)

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({ synced: 0 })
    }

    let synced = 0
    for (const task of tasks) {
      const start = new Date(task.start_at)
      const end = task.end_at
        ? new Date(task.end_at)
        : task.duration_minutes
        ? new Date(start.getTime() + task.duration_minutes * 60000)
        : new Date(start.getTime() + 30 * 60000)

      const event = {
        summary: `[${project?.name || 'Project'}] ${task.title}`,
        description: task.description || '',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }

      if (task.google_event_id) {
        try {
          await calendar.events.update({
            calendarId: 'primary',
            eventId: task.google_event_id,
            requestBody: event,
          })
        } catch (err) {
          // Event may have been deleted in Google - create new one
          const created = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
          })
          await admin.from('tasks').update({ google_event_id: created.data.id }).eq('id', task.id)
        }
      } else {
        const created = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        })
        await admin.from('tasks').update({ google_event_id: created.data.id }).eq('id', task.id)
      }
      synced++
    }

    res.status(200).json({ synced })
  } catch (err: any) {
    if (err.message === 'not_connected') {
      return res.status(401).json({ error: 'not_connected' })
    }
    console.error('Google sync error:', err)
    res.status(500).json({ error: err.message })
  }
}
