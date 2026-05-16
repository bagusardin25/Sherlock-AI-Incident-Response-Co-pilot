import { NextRequest, NextResponse } from 'next/server'

function getBackendUrl() {
  const backendUrl =
    process.env.SHERLOCK_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'

  try {
    return new URL(backendUrl)
  } catch {
    throw new Error(`Invalid backend API URL: ${backendUrl}`)
  }
}

/**
 * Catch-all API route proxy.
 * 
 * Next.js rewrites strip the Authorization header for security.
 * This route handler manually forwards ALL headers (including Auth)
 * to the backend API.
 */
async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  let url: URL

  try {
    url = new URL(`/api/${path}`, getBackendUrl())
  } catch (error: any) {
    console.error(`[API Proxy] ${error.message}`)
    return NextResponse.json(
      { detail: error.message },
      { status: 500 }
    )
  }

  // Forward query string
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  // Forward all request headers
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    // Skip host and next-specific headers
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
    }

    // Forward body for non-GET/HEAD methods
    if (!['GET', 'HEAD'].includes(request.method)) {
      fetchOptions.body = await request.text()
    }

    const response = await fetch(url.toString(), fetchOptions)

    // Check if this is an SSE stream
    const contentType = response.headers.get('content-type') || ''

    if (response.status >= 300 && response.status < 400) {
      const redirectHeaders = new Headers()
      response.headers.forEach((value, key) => {
        if (!['connection', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
          redirectHeaders.append(key, value)
        }
      })

      return new NextResponse(null, {
        status: response.status,
        headers: redirectHeaders,
      })
    }
    
    if (contentType.includes('text/event-stream')) {
      // Stream SSE responses
      const streamHeaders = new Headers()
      response.headers.forEach((value, key) => {
        if (!['connection', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
          streamHeaders.append(key, value)
        }
      })

      return new NextResponse(response.body, {
        status: response.status,
        headers: streamHeaders,
      })
    }

    // Forward regular response
    const responseBody = await response.text()
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      if (!['connection', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        responseHeaders.append(key, value)
      }
    })

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error(`[API Proxy] Error forwarding to ${url}:`, error.message)
    return NextResponse.json(
      { detail: `Backend service unavailable at ${url.origin}` },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
