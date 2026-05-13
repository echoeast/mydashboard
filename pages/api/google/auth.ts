import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthUrl } from '@/lib/google'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = getAuthUrl()
    res.redirect(url)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
