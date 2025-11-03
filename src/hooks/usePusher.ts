'use client'

import { useEffect, useRef, useState } from 'react'
import { pusherClient } from '@/lib/pusher-client'
import type { PusherEvents } from '@/types/pusher'

interface UsePusherOptions {
  conversationId: string | null
  currentUserId: string
  onNewMessage: (message: PusherEvents['message:new']['message']) => void
  onMessageRead: (data: PusherEvents['message:read']) => void
  onTypingStart: (data: PusherEvents['typing:start']) => void
  onTypingStop: (data: PusherEvents['typing:stop']) => void
  onMemberJoined: (data: PusherEvents['member:joined']) => void
  onMemberLeft: (data: PusherEvents['member:left']) => void
}

export function usePusher({
  conversationId,
  currentUserId,
  onNewMessage,
  onMessageRead,
  onTypingStart,
  onTypingStop,
  onMemberJoined,
  onMemberLeft,
}: UsePusherOptions) {
  const channelRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // 使用 ref 保存最新的回調函數，避免依賴變化導致重複訂閱
  const callbacksRef = useRef({
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
    onMemberJoined,
    onMemberLeft,
  })

  // 更新回調函數 ref
  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onMessageRead,
      onTypingStart,
      onTypingStop,
      onMemberJoined,
      onMemberLeft,
    }
  }, [onNewMessage, onMessageRead, onTypingStart, onTypingStop, onMemberJoined, onMemberLeft])

  useEffect(() => {
    if (!conversationId) {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setIsConnected(false)
      return
    }

    // 檢查是否已經訂閱了相同的頻道
    const channelName = `private-conversation-${conversationId}`
    if (channelRef.current?.name === channelName) {
      return
    }

    // 取消訂閱舊頻道
    if (channelRef.current) {
      channelRef.current.unbind_all()
      channelRef.current.unsubscribe()
    }

    const channel = pusherClient.subscribe(channelName)

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true)
    })

    channel.bind('message:new', (data: PusherEvents['message:new']) => {
      callbacksRef.current.onNewMessage(data.message)
    })

    channel.bind('message:read', (data: PusherEvents['message:read']) => {
      callbacksRef.current.onMessageRead(data)
    })

    channel.bind('client-typing:start', (data: PusherEvents['typing:start']) => {
      if (data.userId !== currentUserId) {
        callbacksRef.current.onTypingStart(data)
      }
    })

    channel.bind('client-typing:stop', (data: PusherEvents['typing:stop']) => {
      if (data.userId !== currentUserId) {
        callbacksRef.current.onTypingStop(data)
      }
    })

    channel.bind('member:joined', (data: PusherEvents['member:joined']) => {
      callbacksRef.current.onMemberJoined(data)
    })

    channel.bind('member:left', (data: PusherEvents['member:left']) => {
      callbacksRef.current.onMemberLeft(data)
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [conversationId, currentUserId])

  const triggerTyping = (isTyping: boolean) => {
    if (!channelRef.current || !conversationId) return

    const event = isTyping ? 'client-typing:start' : 'client-typing:stop'
    channelRef.current.trigger(event, {
      userId: currentUserId,
      conversationId,
    })
  }

  return {
    isConnected,
    triggerTyping,
  }
}

