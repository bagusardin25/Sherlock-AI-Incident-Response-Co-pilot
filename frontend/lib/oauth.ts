const DEFAULT_BACKEND_URL = 'https://sherlock-ai.up.railway.app'

export function getGoogleLoginUrl() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL
  return new URL('/api/auth/google/login', backendUrl).toString()
}
