import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triggerPusherEvent } from '@/lib/pusher'
import { MessageType } from '@prisma/client'

export const runtime = 'nodejs'

// POST /api/messages - 發送訊息（文字/圖片/視訊）
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conversationId, content, type = 'TEXT', fileUrl } = body

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'conversationId and content are required' },
        { status: 400 }
      )
    }

    const senderId = session.user.id

    // 檢查使用者是否為對話成員
    // 注意：MongoDB 中查詢 leftAt: null 可能有問題，改用手動檢查
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: senderId,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this conversation' },
        { status: 403 }
      )
    }

    // 檢查使用者是否已離開
    if (member.leftAt !== null) {
      return NextResponse.json(
        { error: 'You have left this conversation' },
        { status: 403 }
      )
    }

    // 建立訊息
    const message = await prisma.message.create({
      data: {
        content,
        type: type as MessageType,
        senderId,
        conversationId,
        fileUrl: fileUrl || null,
        isRead: false,
        readBy: [],
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
    })

    // 更新對話的最後訊息時間
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    })

    // 透過 Pusher 發送即時訊息（失敗不影響訊息建立）
    await triggerPusherEvent(
      `private-conversation-${conversationId}`,
      'message:new',
      {
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          senderId: message.senderId,
          conversationId: message.conversationId,
          fileUrl: message.fileUrl,
          isRead: message.isRead,
          readBy: message.readBy,
          createdAt: message.createdAt.toISOString(),
          senderAlias: message.sender.alias,
          senderImage: message.sender.image,
        },
      }
    )

    return NextResponse.json({
      id: message.id,
      content: message.content,
      type: message.type,
      senderId: message.senderId,
      senderAlias: message.sender.alias,
      senderImage: message.sender.image,
      conversationId: message.conversationId,
      fileUrl: message.fileUrl,
      isRead: message.isRead,
      readBy: message.readBy,
      createdAt: message.createdAt,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    
    // 在開發環境中返回詳細錯誤訊息，生產環境中返回通用錯誤
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(isDevelopment && { 
          details: errorMessage,
          stack: errorStack 
        })
      },
      { status: 500 }
    )
  }
}

