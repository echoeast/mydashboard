import type { NextApiRequest, NextApiResponse } from 'next'

interface RedditPost {
  id: string
  title: string
  selftext: string
  author: string
  score: number
  num_comments: number
  created_utc: number
  permalink: string
  url: string
}

const USER_AGENT = 'web:dashboard-research-tool:v1.0 (by /u/dashboard_user)'
const MAX_PAGES = 10 // Cap at ~1000 posts per subreddit
const PAGE_LIMIT = 100

function extractSubName(input: string): string {
  const trimmed = input.trim().replace(/\/$/, '')
  // Match patterns: r/foo, /r/foo, reddit.com/r/foo, https://www.reddit.com/r/foo
  const match = trimmed.match(/(?:^|\/)r\/([a-zA-Z0-9_]+)/i)
  if (match) return match[1]
  // If no r/ prefix, assume the input is the subreddit name itself
  return trimmed.replace(/^\/+|\/+$/g, '').replace(/^r\//, '')
}

async function fetchSubreddit(name: string, sinceTs: number): Promise<RedditPost[]> {
  const posts: RedditPost[] = []
  let after: string | null = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`https://www.reddit.com/r/${name}/new.json`)
    url.searchParams.set('limit', String(PAGE_LIMIT))
    if (after) url.searchParams.set('after', after)

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!res.ok) {
      throw new Error(`Reddit returned ${res.status} for r/${name}`)
    }

    const json = await res.json()
    const children = json?.data?.children || []
    if (children.length === 0) break

    let hitCutoff = false
    for (const c of children) {
      const d = c.data
      if (d.created_utc < sinceTs) {
        hitCutoff = true
        break
      }
      posts.push({
        id: d.id,
        title: d.title || '',
        selftext: d.selftext || '',
        author: d.author || 'unknown',
        score: d.score || 0,
        num_comments: d.num_comments || 0,
        created_utc: d.created_utc,
        permalink: `https://reddit.com${d.permalink}`,
        url: d.url || '',
      })
    }

    if (hitCutoff) break
    after = json?.data?.after
    if (!after) break

    // Throttle to be respectful (1 req/sec target)
    await new Promise((r) => setTimeout(r, 1000))
  }

  return posts
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { subreddits, months } = req.body as { subreddits: string[]; months?: number }

  if (!Array.isArray(subreddits) || subreddits.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty subreddits array' })
  }

  const monthsBack = months && months > 0 ? months : 3
  const sinceTs = Math.floor(Date.now() / 1000) - monthsBack * 30 * 24 * 60 * 60

  const results: Record<string, { posts: RedditPost[]; error?: string }> = {}

  for (const sub of subreddits) {
    const name = extractSubName(sub)
    if (!name) continue
    try {
      const posts = await fetchSubreddit(name, sinceTs)
      results[name] = { posts }
    } catch (err: any) {
      results[name] = { posts: [], error: err.message || 'Unknown error' }
    }
  }

  res.status(200).json({ results, monthsBack })
}
