// Returns the WS URL and character for the client to connect directly.
// In a production setup, this would mint a short-lived token.
// For MVP, the client connects directly with the API key injected server-side.
export function createNavtalkSessionConfig(): {
  wsUrl: string
  character: string
} {
  const apiKey = process.env.NAVTALK_API_KEY
  const character = process.env.NAVTALK_CHARACTER ?? 'navtalk.Lauren'
  if (!apiKey) throw new Error('NAVTALK_API_KEY not set')
  // NavTalk auth via query params — server injects key, client never sees it raw
  const wsUrl = `wss://transfer.navtalk.ai/wss/v2/realtime-chat?license=${apiKey}&character=${character}`
  return { wsUrl, character }
}
