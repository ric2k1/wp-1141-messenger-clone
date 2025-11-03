import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { alias, provider } = await request.json()

    if (!alias || !provider) {
      return NextResponse.json(
        { error: 'Alias and provider are required' },
        { status: 400 }
      )
    }

    // Validate provider
    if (!['facebook', 'github'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Check if alias already exists
    const existingUser = await prisma.user.findUnique({
      where: { alias }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Alias already exists' },
        { status: 409 }
      )
    }

    // Create pending user record with temporary oauthId
    const tempOAuthId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const user = await prisma.user.create({
      data: {
        alias,
        provider,
        oauthId: tempOAuthId,
        isAuthorized: false
      }
    })

    // Generate OAuth authorization URL using custom auth start page
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/auth/callback-setup?alias=${encodeURIComponent(alias)}`
    const authUrl = `${baseUrl}/auth/start?provider=${provider}&callbackUrl=${encodeURIComponent(callbackUrl)}`

    return NextResponse.json({
      message: 'User created, authorization required',
      authUrl,
      userId: user.id
    })
  } catch (error) {
    console.error('Error creating user authorization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

