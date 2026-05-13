import type { NextApiRequest, NextApiResponse } from 'next'
import { exchangeCode, saveTokens } from '@/lib/google'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string | undefined
  if (!code) {
    return res.status(400).send('Missing code')
  }

  try {
    const tokens = await exchangeCode(code)
    await saveTokens(tokens)
    res.redirect('/projects?google_connected=1')
  } catch (err: any) {
    res.status(500).send(`Google auth failed: ${err.message}`)
  }
}
