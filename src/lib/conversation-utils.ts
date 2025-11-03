import { prisma } from './prisma'
import { ConversationType } from '@prisma/client'

/**
 * 檢查兩個成員集合是否相同（忽略順序）
 */
export function checkMemberSetEquality(
  members1: string[],
  members2: string[]
): boolean {
  if (members1.length !== members2.length) {
    return false
  }

  const sorted1 = [...members1].sort()
  const sorted2 = [...members2].sort()

  return sorted1.every((member, index) => member === sorted2[index])
}

/**
 * 查詢或建立對話
 * 對於群聊，即使成員相同也不會合併
 */
export async function findOrCreateConversation(
  type: ConversationType,
  memberIds: string[],
  creatorId: string
) {
  // 確保創建者在成員列表中
  const allMembers = [...new Set([...memberIds, creatorId])]

  if (type === 'DIRECT' && allMembers.length !== 2) {
    throw new Error('Direct conversation must have exactly 2 members')
  }

  if (type === 'GROUP' && allMembers.length < 2) {
    throw new Error('Group conversation must have at least 2 members')
  }

  // 對於單聊，嘗試查找現有對話
  if (type === 'DIRECT') {
    const existingDirect = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: {
            userId: {
              in: allMembers,
            },
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

    // 檢查是否真的是相同的兩個成員
    if (existingDirect) {
      const existingMemberIds = existingDirect.members.map((m) => m.userId)
      if (checkMemberSetEquality(allMembers, existingMemberIds)) {
        return existingDirect
      }
    }
  }

  // 建立新對話（群聊或找不到的單聊）
  const conversation = await prisma.conversation.create({
    data: {
      type,
      creatorId,
      members: {
        create: allMembers.map((userId) => ({
          userId,
        })),
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

  return conversation
}

/**
 * 新增成員到群聊
 */
export async function addMemberToConversation(
  conversationId: string,
  userId: string,
  addedById: string
) {
  // 檢查對話是否存在且為群聊
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: true,
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  if (conversation.type !== 'GROUP') {
    throw new Error('Only group conversations can have members added')
  }

  // 檢查使用者是否已經是成員
  const isAlreadyMember = conversation.members.some(
    (m) => m.userId === userId && !m.leftAt
  )

  if (isAlreadyMember) {
    throw new Error('User is already a member of this conversation')
  }

  // 檢查是否有已離開的記錄
  const existingMember = conversation.members.find((m) => m.userId === userId)

  if (existingMember && existingMember.leftAt) {
    // 重新加入（更新現有記錄）
    await prisma.conversationMember.update({
      where: { id: existingMember.id },
      data: {
        joinedAt: new Date(),
        leftAt: null,
      },
    })
  } else {
    // 新增成員
    await prisma.conversationMember.create({
      data: {
        conversationId,
        userId,
      },
    })
  }

  // 建立系統訊息
  const addedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { alias: true },
  })

  const systemMessage = await prisma.systemMessage.create({
    data: {
      conversationId,
      type: 'USER_JOINED',
      userId,
      content: `${addedUser?.alias || '使用者'} 已加入群聊`,
    },
  })

  return {
    conversationId,
    userId,
    alias: addedUser?.alias,
    systemMessage,
  }
}

/**
 * 成員離開群聊
 */
export async function removeMemberFromConversation(
  conversationId: string,
  userId: string
) {
  // 檢查對話是否存在且為群聊
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: true,
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  if (conversation.type !== 'GROUP') {
    throw new Error('Only group conversations support leaving')
  }

  // 檢查使用者是否是成員
  const member = conversation.members.find(
    (m) => m.userId === userId && !m.leftAt
  )

  if (!member) {
    throw new Error('User is not a member of this conversation')
  }

  // 標記為已離開
  await prisma.conversationMember.update({
    where: { id: member.id },
    data: {
      leftAt: new Date(),
    },
  })

  // 建立系統訊息
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { alias: true },
  })

  const systemMessage = await prisma.systemMessage.create({
    data: {
      conversationId,
      type: 'USER_LEFT',
      userId,
      content: `${user?.alias || '使用者'} 已離開群聊`,
    },
  })

  return {
    conversationId,
    userId,
    alias: user?.alias,
    systemMessage,
  }
}

