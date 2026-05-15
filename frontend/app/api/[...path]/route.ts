import { NextRequest, NextResponse } from 'next/server'

const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  const url = new URL(`/api/${path}`, API_BACKEND)

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
    }

    // Forward body for non-GET/HEAD methods
    if (!['GET', 'HEAD'].includes(request.method)) {
      fetchOptions.body = await request.text()
    }

    const response = await fetch(url.toString(), fetchOptions)

    // Check if this is an SSE stream
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('text/event-stream')) {
      // Stream SSE responses
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Forward regular response
    const responseBody = await response.text()
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/json',
      },
    })
  } catch (error: any) {
    console.error(`[API Proxy] Error forwarding to ${url}:`, error.message)
    return NextResponse.json(
      { detail: 'Backend service unavailable' },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
