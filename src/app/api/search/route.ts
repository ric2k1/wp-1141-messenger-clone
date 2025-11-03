import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkMemberSetEquality } from '@/lib/conversation-utils'

export const runtime = 'nodejs'

// GET /api/search - 搜尋使用者和對話
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const currentUserId = session.user.id
    const searchTerm = query.trim()

    // 搜尋使用者（按 alias）
    const users = await prisma.user.findMany({
      where: {
        alias: {
          contains: searchTerm,
          mode: 'insensitive',
        },
        isAuthorized: true,
        id: {
          not: currentUserId, // 排除自己
        },
      },
      select: {
        id: true,
        alias: true,
        image: true,
      },
      take: 10,
    })

    // 搜尋對話（群聊）
    // 取得使用者參與的所有群聊
    // 注意：MongoDB 的 leftAt: null 查詢可能有問題，改成先查詢所有，然後過濾
    const allUserConversations = await prisma.conversation.findMany({
      where: {
        type: 'GROUP',
        members: {
          some: {
            userId: currentUserId,
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
      },
    })

    // 過濾：只保留使用者未離開的對話，且只顯示未離開的成員
    const userConversations = allUserConversations
      .filter((conv) => {
        const currentUserMember = conv.members.find((m) => m.userId === currentUserId)
        return currentUserMember && currentUserMember.leftAt === null
      })
      .map((conv) => ({
        ...conv,
        members: conv.members.filter((m) => m.leftAt === null),
      }))

    // 過濾對話：檢查成員 alias 是否包含搜尋關鍵字
    const matchingConversations = userConversations
      .filter((conv) => {
        const memberAliases = conv.members
          .map((m) => m.user.alias.toLowerCase())
          .join(' ')
        return memberAliases.includes(searchTerm.toLowerCase())
      })
      .map((conv) => ({
        id: conv.id,
        type: conv.type,
        members: conv.members.map((m) => ({
          id: m.user.id,
          alias: m.user.alias,
          image: m.user.image,
        })),
        createdAt: conv.createdAt,
      }))

    // 處理相同成員組成的對話
    // 如果有相同成員組成的對話，標記它們
    const conversationGroups = new Map<string, typeof matchingConversations>()

    matchingConversations.forEach((conv) => {
      const memberIds = conv.members.map((m) => m.id).sort().join(',')
      if (!conversationGroups.has(memberIds)) {
        conversationGroups.set(memberIds, [])
      }
      conversationGroups.get(memberIds)!.push(conv)
    })

    const duplicateConversations = Array.from(conversationGroups.entries())
      .filter(([_, convs]) => convs.length > 1)
      .map(([memberIds, convs]) => ({
        memberIds,
        conversations: convs,
      }))

    return NextResponse.json({
      users,
      conversations: matchingConversations,
      duplicateConversations: duplicateConversations.length > 0 ? duplicateConversations : null,
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

