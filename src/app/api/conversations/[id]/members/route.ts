import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addMemberToConversation } from '@/lib/conversation-utils'
import { triggerPusherEvent } from '@/lib/pusher'

export const runtime = 'nodejs'

// POST /api/conversations/[id]/members - 新增成員到群聊
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: conversationId } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const addedById = session.user.id

    const result = await addMemberToConversation(
      conversationId,
      userId,
      addedById
    )

    // 透過 Pusher 推送系統訊息
    if (result.systemMessage) {
      await triggerPusherEvent(
        `private-conversation-${conversationId}`,
        'member:joined',
        {
          userId,
          conversationId,
          alias: result.alias || '',
        }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

