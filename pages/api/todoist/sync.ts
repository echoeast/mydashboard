import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const TODOIST_API = 'https://api.todoist.com/rest/v2'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = process.env.TODOIST_TOKEN
  if (!token) {
    return res.status(401).json({ error: 'TODOIST_TOKEN not set' })
  }

  const { project_id } = req.body
  if (!project_id) return res.status(400).json({ error: 'Missing project_id' })

  try {
    const admin = getSupabaseAdmin()
    const { data: project } = await admin.from('projects').select('name').eq('id', project_id).single()
    const { data: tasks } = await admin.from('tasks').select('*').eq('project_id', project_id)

    if (!tasks || tasks.length === 0) return res.status(200).json({ synced: 0 })

    // Ensure a Todoist project exists for this dashboard project
    let todoistProjectId: string | null = null
    if (project) {
      const projectName = `[Dashboard] ${project.name}`
      const listRes = await fetch(`${TODOIST_API}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const projects = await listRes.json()
      const existing = projects.find((p: any) => p.name === projectName)
      if (existing) {
        todoistProjectId = existing.id
      } else {
        const createRes = await fetch(`${TODOIST_API}/projects`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: projectName }),
        })
        const created = await createRes.json()
        todoistProjectId = created.id
      }
    }

    let synced = 0
    for (const task of tasks) {
      const body: any = {
        content: task.title,
        description: task.description || undefined,
        project_id: todoistProjectId || undefined,
      }
      if (task.start_at) {
        body.due_datetime = new Date(task.start_at).toISOString()
      }
      if (task.duration_minutes) {
        body.duration = task.duration_minutes
        body.duration_unit = 'minute'
      }

      if (task.todoist_id) {
        const updateRes = await fetch(`${TODOIST_API}/tasks/${task.todoist_id}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (!updateRes.ok) {
          // Recreate if missing
          const createRes = await fetch(`${TODOIST_API}/tasks`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })
          const created = await createRes.json()
          await admin.from('tasks').update({ todoist_id: created.id }).eq('id', task.id)
        }
        // Close if done
        if (task.status === 'done') {
          await fetch(`${TODOIST_API}/tasks/${task.todoist_id}/close`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
        }
      } else {
        const createRes = await fetch(`${TODOIST_API}/tasks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (!createRes.ok) {
          const errText = await createRes.text()
          throw new Error(`Todoist create failed: ${errText}`)
        }
        const created = await createRes.json()
        await admin.from('tasks').update({ todoist_id: created.id }).eq('id', task.id)
        if (task.status === 'done') {
          await fetch(`${TODOIST_API}/tasks/${created.id}/close`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
        }
      }
      synced++
    }

    res.status(200).json({ synced })
  } catch (err: any) {
    console.error('Todoist sync error:', err)
    res.status(500).json({ error: err.message })
  }
}
