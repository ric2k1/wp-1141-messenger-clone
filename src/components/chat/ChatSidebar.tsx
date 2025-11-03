'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  members: Array<{ id: string; alias: string; image?: string }>
  lastMessage: {
    content: string
    senderAlias: string
    createdAt: Date | string
  } | null
  lastMessageAt: Date | string
  otherMember?: { id: string; alias: string; image?: string } | null
  groupName?: string | null
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  currentUserId: string
}

export default function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  currentUserId,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    const name = conv.type === 'DIRECT' 
      ? conv.otherMember?.alias || ''
      : conv.groupName || ''
    
    return name.toLowerCase().includes(searchLower) ||
           conv.lastMessage?.content.toLowerCase().includes(searchLower)
  })

  const getConversationDisplayName = (conv: Conversation) => {
    if (conv.type === 'DIRECT') {
      return conv.otherMember?.alias || '未知使用者'
    }
    return conv.groupName || '群聊'
  }

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'DIRECT') {
      return conv.otherMember?.image
    }
    // 群聊可以使用第一個成員的頭像或多頭像組合
    return conv.members.find(m => m.id !== currentUserId)?.image
  }

  return (
    <div className="flex-[1] bg-notion-gray-light border-r border-notion-gray-border flex flex-col h-screen min-w-0">
      {/* 頭部 */}
      <div className="px-4 pt-5 pb-4 border-b border-notion-gray-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-notion-text">聊天室</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-full bg-notion-gray hover:bg-notion-gray-hover transition-colors flex items-center gap-2"
              title="設定"
            >
              <svg className="w-4 h-4 text-notion-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-notion-text font-medium">設定</span>
            </button>
            <button
              onClick={onNewConversation}
              className="px-3 py-2 rounded-full bg-notion-gray hover:bg-notion-gray-hover transition-colors flex items-center gap-2"
              title="新建對話"
            >
              <svg className="w-4 h-4 text-notion-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm text-notion-text font-medium">新建對話</span>
            </button>
          </div>
        </div>
        
        {/* 搜尋框 */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-20">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋 Messenger"
            className="w-full pl-10 pr-3 py-2.5 bg-notion-gray border-0 rounded-full text-sm text-notion-text placeholder:text-notion-text-tertiary focus:outline-none focus:bg-white focus:shadow-sm transition-all relative z-10"
          />
        </div>
      </div>

      {/* 對話列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="px-4 py-12 text-center text-notion-text-tertiary text-sm">
            {searchQuery ? '沒有找到相關對話' : '選擇一個對話開始聊天'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === currentConversationId
            const displayName = getConversationDisplayName(conv)
            const avatar = getConversationAvatar(conv)
            const lastMessageTime = typeof conv.lastMessageAt === 'string'
              ? new Date(conv.lastMessageAt)
              : conv.lastMessageAt

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full px-4 py-3 text-left transition-all hover:bg-notion-gray-hover ${
                  isActive ? 'bg-notion-gray-hover' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={displayName}
                      width={56}
                      height={56}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-notion-gray-border flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-medium text-notion-text-secondary">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm text-notion-text truncate">
                        {displayName}
                      </h3>
                      {conv.lastMessage && (
                        <span className="text-xs text-notion-text-tertiary flex-shrink-0 ml-2">
                          {formatDistanceToNow(lastMessageTime, { addSuffix: true, locale: zhTW })}
                        </span>
                      )}
                    </div>
                    
                    {conv.lastMessage ? (
                      <p className="text-sm text-notion-text-secondary truncate">
                        {conv.lastMessage.senderAlias === conv.members.find(m => m.id === currentUserId)?.alias
                          ? '你: '
                          : `${conv.lastMessage.senderAlias}: `}
                        {conv.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-notion-text-tertiary">
                        沒有訊息
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

