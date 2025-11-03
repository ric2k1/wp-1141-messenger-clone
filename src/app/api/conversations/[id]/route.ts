import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET /api/conversations/[id] - 取得對話詳情和訊息歷史
export async function GET(
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

    const userId = session.user.id
    const { id: conversationId } = await params

    // console.log('載入對話詳情 - 對話 ID:', conversationId, '使用者 ID:', userId)

    // 檢查使用者是否為對話成員
    // 注意：MongoDB 中查詢 leftAt: null 可能有問題，改用手動檢查
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    })

    if (!member) {
      console.error(`使用者 ${userId} 不是對話 ${conversationId} 的成員`)
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // 檢查使用者是否已離開
    if (member.leftAt !== null) {
      console.error(`使用者 ${userId} 已離開對話 ${conversationId}`)
      return NextResponse.json(
        { error: 'You have left this conversation' },
        { status: 404 }
      )
    }

    // console.log(`✅ 使用者 ${userId} 是對話 ${conversationId} 的有效成員`)

    // 取得對話詳情
    const conversationRaw = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                alias: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                alias: true,
                image: true,
              },
            },
          },
        },
        systemMessages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!conversationRaw) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // 過濾成員：只保留未離開的成員
    const conversation = {
      ...conversationRaw,
      members: conversationRaw.members.filter((m) => m.leftAt === null),
    }

    // 合併訊息和系統訊息
    const allMessages = [
      ...conversation.messages.map((msg) => ({
        type: 'message' as const,
        id: msg.id,
        content: msg.content,
        messageType: msg.type,
        senderId: msg.senderId,
        senderAlias: msg.sender.alias,
        senderImage: msg.sender.image,
        fileUrl: msg.fileUrl,
        isRead: msg.isRead,
        readBy: msg.readBy,
        createdAt: msg.createdAt,
      })),
      ...conversation.systemMessages.map((sysMsg) => ({
        type: 'system' as const,
        id: sysMsg.id,
        content: sysMsg.content,
        systemType: sysMsg.type,
        userId: sysMsg.userId,
        createdAt: sysMsg.createdAt,
      })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    return NextResponse.json({
      id: conversation.id,
      type: conversation.type,
      members: conversation.members.map((m) => ({
        id: m.user.id,
        alias: m.user.alias,
        image: m.user.image,
      })),
      messages: allMessages,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Internal server error'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

