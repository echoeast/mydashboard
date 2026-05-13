import { google } from 'googleapis'
import { getSupabaseAdmin } from './supabaseAdmin'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth env vars')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getAuthUrl(): string {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function exchangeCode(code: string) {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

export async function saveTokens(tokens: any) {
  const admin = getSupabaseAdmin()
  await admin
    .from('integrations')
    .upsert(
      {
        service: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'service' }
    )
}

export async function getStoredTokens() {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('integrations').select('*').eq('service', 'google').single()
  return data
}

export async function getAuthenticatedClient() {
  const tokens = await getStoredTokens()
  if (!tokens || !tokens.refresh_token) {
    throw new Error('not_connected')
  }

  const client = getOAuthClient()
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expires_at ? new Date(tokens.expires_at).getTime() : undefined,
  })

  // Refresh if expired
  if (!tokens.expires_at || new Date(tokens.expires_at) < new Date()) {
    const { credentials } = await client.refreshAccessToken()
    client.setCredentials(credentials)
    await saveTokens({ ...tokens, ...credentials })
  }

  return client
}
