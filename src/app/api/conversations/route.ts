import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findOrCreateConversation } from '@/lib/conversation-utils'
import { ConversationType } from '@prisma/client'

export const runtime = 'nodejs'

// GET /api/conversations - 取得使用者的所有對話列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // console.log('載入對話列表，使用者 ID:', userId)

    // 取得使用者參與的所有對話
    // 注意：MongoDB 的 leftAt: null 查詢可能有問題，改成先查詢所有，然後在應用層過濾
    const allConversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
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
            createdAt: 'desc',
          },
          take: 1, // 只取最後一條訊息
          include: {
            sender: {
              select: {
                id: true,
                alias: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    // 過濾：只保留使用者未離開的對話，且只顯示未離開的成員
    const conversations = allConversations
      .filter((conv) => {
        // 檢查當前使用者是否在成員列表中且未離開
        const currentUserMember = conv.members.find((m) => m.userId === userId)
        return currentUserMember && currentUserMember.leftAt === null
      })
      .map((conv) => ({
        ...conv,
        members: conv.members.filter((m) => m.leftAt === null), // 只保留未離開的成員
      }))

    // 格式化回應
    const formatted = conversations.map((conv) => {
      const otherMembers = conv.members
        .filter((m) => m.userId !== userId)
        .map((m) => m.user)

      // 檢查當前使用者是否真的是成員（雙重驗證）
      const currentUserMember = conv.members.find((m) => m.userId === userId)
      
      return {
        id: conv.id,
        type: conv.type,
        members: conv.members.map((m) => ({
          id: m.user.id,
          alias: m.user.alias,
          image: m.user.image,
        })),
        lastMessage: conv.messages[0]
          ? {
              id: conv.messages[0].id,
              content: conv.messages[0].content,
              type: conv.messages[0].type,
              senderId: conv.messages[0].senderId,
              senderAlias: conv.messages[0].sender.alias,
              createdAt: conv.messages[0].createdAt,
            }
          : null,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        // 對於單聊，提供對方資訊
        otherMember: conv.type === 'DIRECT' ? otherMembers[0] : null,
        // 對於群聊，提供群組名稱（可以用成員列表生成）
        groupName:
          conv.type === 'GROUP'
            ? conv.members
                .filter((m) => m.userId !== userId)
                .map((m) => m.user.alias)
                .join(', ')
            : null,
        // 調試資訊
        _debug: {
          hasCurrentUser: !!currentUserMember,
          memberCount: conv.members.length,
        }
      }
    })

    // console.log(`找到 ${formatted.length} 個對話`)
    
    // 記錄是否有異常對話（沒有當前使用者作為成員）
    const invalidConversations = formatted.filter((conv) => !conv._debug.hasCurrentUser)
    if (invalidConversations.length > 0) {
      console.error('發現異常對話（不包含當前使用者）:', 
        invalidConversations.map(c => ({ id: c.id, type: c.type, members: c.members.length }))
      )
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/conversations - 建立新對話（單聊或群聊）
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { type, memberIds } = body

    if (!type || !['DIRECT', 'GROUP'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid conversation type' },
        { status: 400 }
      )
    }

    if (!Array.isArray(memberIds)) {
      return NextResponse.json(
        { error: 'memberIds must be an array' },
        { status: 400 }
      )
    }

    const creatorId = session.user.id
    const conversation = await findOrCreateConversation(
      type as ConversationType,
      memberIds,
      creatorId
    )

    // 確保 conversation 和 members 都存在
    if (!conversation) {
      console.error('findOrCreateConversation returned null/undefined')
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    if (!conversation.members || conversation.members.length === 0) {
      console.error('Conversation has no members')
      return NextResponse.json(
        { error: 'Conversation created but has no members' },
        { status: 500 }
      )
    }

    // 檢查所有成員都有 user 物件
    const invalidMembers = conversation.members.filter(m => !m.user)
    if (invalidMembers.length > 0) {
      console.error('Some members are missing user data:', invalidMembers)
      return NextResponse.json(
        { error: 'Some members are missing user data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: conversation.id,
      type: conversation.type,
      members: conversation.members.map((m) => ({
        id: m.user.id,
        alias: m.user.alias,
        image: m.user.image,
      })),
      createdAt: conversation.createdAt,
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
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

