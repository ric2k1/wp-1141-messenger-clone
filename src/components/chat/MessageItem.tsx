'use client'

import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface MessageItemProps {
  message: {
    id: string
    content: string
    messageType?: 'TEXT' | 'IMAGE' | 'VIDEO'
    senderId: string
    senderAlias: string
    senderImage?: string
    fileUrl?: string
    isRead: boolean
    createdAt: Date | string
  }
  isOwn: boolean
  showAvatar: boolean
}

export default function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const createdAt = typeof message.createdAt === 'string' 
    ? new Date(message.createdAt) 
    : message.createdAt

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''} mb-3`}>
      {showAvatar && (
        <div className={`flex-shrink-0 ${isOwn ? 'ml-3' : 'mr-3'}`}>
          {message.senderImage ? (
            <Image
              src={message.senderImage}
              alt={message.senderAlias}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-notion-gray-border flex items-center justify-center">
              <span className="text-xs font-medium text-notion-text-secondary">
                {message.senderAlias.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[65%] min-w-0`}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-notion-text-secondary mb-1.5 px-1 font-medium">{message.senderAlias}</span>
        )}
        
        <div
          className={`rounded-notion-lg px-3.5 py-2 ${
            isOwn
              ? 'bg-notion-blue text-white'
              : 'bg-notion-gray-light text-notion-text'
          }`}
        >
          {message.messageType === 'IMAGE' && message.fileUrl ? (
            <div className="max-w-md">
              <Image
                src={message.fileUrl}
                alt="Shared image"
                width={400}
                height={400}
                className="rounded-notion max-w-full"
                unoptimized
              />
              {message.content && (
                <p className={`mt-2 text-sm ${isOwn ? 'text-white/90' : 'text-notion-text'}`}>{message.content}</p>
              )}
            </div>
          ) : message.messageType === 'VIDEO' && message.fileUrl ? (
            <div className="max-w-md">
              <video
                src={message.fileUrl}
                controls
                className="rounded-notion max-w-full"
              >
                您的瀏覽器不支援影片播放
              </video>
              {message.content && (
                <p className={`mt-2 text-sm ${isOwn ? 'text-white/90' : 'text-notion-text'}`}>{message.content}</p>
              )}
            </div>
          ) : (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-notion-text'}`}>
              {message.content}
            </p>
          )}
        </div>
        
        <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs ${isOwn ? 'text-white/60' : 'text-notion-text-tertiary'}`}>
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: zhTW })}
          </span>
          {isOwn && message.isRead && (
            <span className="text-xs text-white/70">✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
}

