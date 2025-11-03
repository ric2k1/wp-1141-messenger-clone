// Pusher channel and event types

export type PusherChannel = 
  | `presence-conversation-${string}`
  | `private-conversation-${string}`

export interface PusherEvents {
  'message:new': {
    message: {
      id: string
      content: string
      type: 'TEXT' | 'IMAGE' | 'VIDEO'
      senderId: string
      senderAlias?: string // 發送者顯示名稱
      senderImage?: string // 發送者頭像
      conversationId: string
      fileUrl?: string
      isRead: boolean
      readBy: string[]
      createdAt: string
    }
  }
  'message:read': {
    messageId: string
    userId: string
    conversationId: string
  }
  'typing:start': {
    userId: string
    conversationId: string
  }
  'typing:stop': {
    userId: string
    conversationId: string
  }
  'member:joined': {
    userId: string
    conversationId: string
    alias: string
  }
  'member:left': {
    userId: string
    conversationId: string
    alias: string
  }
}

export interface PusherPresenceData {
  user_id: string
  user_info: {
    alias: string
    image?: string
  }
}

