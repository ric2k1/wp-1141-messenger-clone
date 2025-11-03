import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { alias } = await request.json()

    if (!alias || typeof alias !== 'string') {
      return NextResponse.json(
        { error: 'Alias is required' },
        { status: 400 }
      )
    }

    // Look up user by alias
    const user = await prisma.user.findUnique({
      where: {
        alias: alias.trim(),
      },
      select: {
        alias: true,
        provider: true,
        isAuthorized: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isAuthorized) {
      return NextResponse.json(
        { error: 'User has not completed OAuth authorization. Please complete setup first.' },
        { status: 400 }
      )
    }

    // Start OAuth flow
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/auth/callback/${user.provider}`
    
    // Return redirect URL for client-side navigation
    return NextResponse.json({
      redirectUrl: `/auth/start?provider=${user.provider}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    })
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

