import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triggerPusherEvent } from '@/lib/pusher'

export const runtime = 'nodejs'

// PUT /api/messages/[id]/read - 標記訊息為已讀
export async function PUT(
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

    const { id: messageId } = await params
    const userId = session.user.id

    // 取得訊息
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 檢查使用者是否已讀
    if (!message.readBy.includes(userId)) {
      // 更新訊息已讀狀態
      await prisma.message.update({
        where: { id: messageId },
        data: {
          readBy: {
            push: userId,
          },
          isRead: true,
        },
      })

      // 透過 Pusher 通知已讀
      await triggerPusherEvent(
        `private-conversation-${message.conversationId}`,
        'message:read',
        {
          messageId: message.id,
          userId,
          conversationId: message.conversationId,
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking message as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

