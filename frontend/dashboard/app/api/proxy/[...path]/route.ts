import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_URL || 'http://localhost:5500/api/v1'

// Proxy all API requests through Next.js
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'DELETE')
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  const cookieStore = cookies()
  const accessToken = (await cookieStore).get('pika-access-token')?.value

  // Construct the backend URL
  const path = params.path.join('/')
  const url = new URL(path, API_BASE_URL)

  // Copy query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value)
  })

  // Prepare headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-correlation-id': crypto.randomUUID(),
  })

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
  }

  // Add body for non-GET requests
  if (method !== 'GET' && request.body) {
    options.body = await request.text()
  }

  try {
    const response = await fetch(url.toString(), options)

    // Handle token refresh if needed
    if (response.status === 401) {
      // Implement token refresh logic here
      // For now, just pass through
    }

    // Return the response
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
