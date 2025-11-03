import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Look up user by alias
    const user = await prisma.user.findUnique({
      where: {
        alias: username.trim(),
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

    return NextResponse.json({
      alias: user.alias,
      provider: user.provider,
    })
  } catch (error) {
    console.error('Error looking up user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

