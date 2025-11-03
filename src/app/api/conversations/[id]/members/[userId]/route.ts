import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { removeMemberFromConversation } from '@/lib/conversation-utils'
import { pusherServer } from '@/lib/pusher'

export const runtime = 'nodejs'

// DELETE /api/conversations/[id]/members/[userId] - 使用者離開群聊
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: conversationId, userId } = await params

    // 只能自己離開
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only leave conversations for yourself' },
        { status: 403 }
      )
    }

    const result = await removeMemberFromConversation(conversationId, userId)

    // 透過 Pusher 推送系統訊息
    if (result.systemMessage) {
      await pusherServer.trigger(
        `private-conversation-${conversationId}`,
        'member:left',
        {
          userId,
          conversationId,
          alias: result.alias || '',
        }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

