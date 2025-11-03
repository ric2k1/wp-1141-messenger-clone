'use client'

import { useState, useEffect } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  members: Array<{ id: string; alias: string; image?: string }>
  messages: Array<{
    type: 'message' | 'system'
    id: string
    content: string
    messageType?: 'TEXT' | 'IMAGE' | 'VIDEO'
    senderId?: string
    senderAlias?: string
    senderImage?: string
    fileUrl?: string
    isRead?: boolean
    createdAt: Date | string
  }>
}

interface ChatWindowProps {
  conversation: Conversation | null
  currentUserId: string
  onSendMessage: (conversationId: string, content: string, type: 'TEXT' | 'IMAGE' | 'VIDEO', fileUrl?: string) => Promise<void>
  onMemberAction?: (action: 'add' | 'leave', userId?: string) => void
  onTyping?: (isTyping: boolean) => void
  typingUsers?: Array<{ userId: string; alias: string }>
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onSendMessage,
  onMemberAction,
  onTyping,
  typingUsers = [],
}: ChatWindowProps) {

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-notion-gray">
        <div className="text-center px-8">
          <h1 className="text-lg font-medium text-notion-text mb-1.5">歡迎使用 Messenger</h1>
          <p className="text-sm text-notion-text-secondary">選擇一個對話開始聊天</p>
        </div>
      </div>
    )
  }

  const getConversationName = () => {
    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(m => m.id !== currentUserId)
      return otherMember?.alias || '未知使用者'
    }
    const memberNames = conversation.members
      .filter(m => m.id !== currentUserId)
      .map(m => m.alias)
      .join(', ')
    return memberNames || '群聊'
  }

  const handleSend = async (content: string, type: 'TEXT' | 'IMAGE' | 'VIDEO', fileUrl?: string) => {
    await onSendMessage(conversation.id, content, type, fileUrl)
  }

  const handleTyping = (isTyping: boolean) => {
    if (onTyping) {
      onTyping(isTyping)
    }
  }

  return (
    <div className="flex-[2] flex flex-col h-screen bg-notion-gray min-w-0">
      {/* 頭部 */}
      <div className="bg-notion-gray-light border-b border-notion-gray-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-medium text-notion-text">{getConversationName()}</h2>
          {conversation.type === 'GROUP' && (
            <span className="text-xs text-notion-text-tertiary">
              ({conversation.members.length} 位成員)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          <button
            className="p-1.5 rounded-md text-notion-text-tertiary hover:bg-notion-gray-hover hover:text-notion-text transition-colors"
            title="語音通話"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          <button
            className="p-1.5 rounded-md text-notion-text-tertiary hover:bg-notion-gray-hover hover:text-notion-text transition-colors"
            title="視訊通話"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          {conversation.type === 'GROUP' && onMemberAction && (
            <button
              onClick={() => onMemberAction('add')}
              className="p-1.5 rounded-md text-notion-text-tertiary hover:bg-notion-gray-hover hover:text-notion-text transition-colors"
              title="新增成員"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          
          {conversation.type === 'GROUP' && onMemberAction && (
            <button
              onClick={() => onMemberAction('leave', currentUserId)}
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="離開群聊"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
          
          <button
            className="p-1.5 rounded-md text-notion-text-tertiary hover:bg-notion-gray-hover hover:text-notion-text transition-colors"
            title="更多選項"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 訊息列表 */}
      <MessageList
        messages={conversation.messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
      />

      {/* 輸入框 */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={false}
      />
    </div>
  )
}

