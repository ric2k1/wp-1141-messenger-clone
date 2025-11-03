'use client'

import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import SystemMessageItem from './SystemMessageItem'
import TypingIndicator from './TypingIndicator'

interface MessageListProps {
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
  currentUserId: string
  typingUsers?: Array<{ userId: string; alias: string }>
}

export default function MessageList({ messages, currentUserId, typingUsers = [] }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const getShowAvatar = (index: number) => {
    if (index === 0) return true
    const current = messages[index]
    const previous = messages[index - 1]
    
    if (current.type === 'system' || previous.type === 'system') return true
    if (current.type === 'message' && previous.type === 'message') {
      return current.senderId !== previous.senderId
    }
    return true
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1">
      {messages.map((message, index) => {
        if (message.type === 'system') {
          return (
            <SystemMessageItem
              key={message.id}
              message={{
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
              }}
            />
          )
        }

        const isOwn = message.senderId === currentUserId
        const showAvatar = getShowAvatar(index)

        return (
          <MessageItem
            key={message.id}
            message={{
              id: message.id,
              content: message.content,
              messageType: message.messageType || 'TEXT',
              senderId: message.senderId!,
              senderAlias: message.senderAlias!,
              senderImage: message.senderImage,
              fileUrl: message.fileUrl,
              isRead: message.isRead || false,
              createdAt: message.createdAt,
            }}
            isOwn={isOwn}
            showAvatar={showAvatar}
          />
        )
      })}
      
      {typingUsers.map((user) => (
        <TypingIndicator key={user.userId} userAlias={user.alias} />
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  )
}

