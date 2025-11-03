'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import SearchDialog from '@/components/search/SearchDialog'
import { usePusher } from '@/hooks/usePusher'

export const dynamic = 'force-dynamic'

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
  _debug?: {
    hasCurrentUser: boolean
    memberCount: number
  }
}

interface ConversationDetail extends Conversation {
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

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationDetail | null>(null)
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string; alias: string }>>(new Map())
  const typingTimeouts = useState<Map<string, NodeJS.Timeout>>(new Map())[0]
  const [showSearchDialog, setShowSearchDialog] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      loadConversations()
    }
  }, [status, session])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to load conversations')
      const data = await response.json()
      
      // console.log('📋 載入對話列表，共 ', data.length, '個對話')
      
      setConversations(data)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorData: any = null
        
        try {
          const contentType = response.headers.get('content-type')
          
          // 克隆回應以便在解析失敗時可以重新讀取
          const responseClone = response.clone()
          
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json()
              if (errorData) {
                if (errorData.error && typeof errorData.error === 'string') {
                  errorMessage = errorData.error
                } else if (Object.keys(errorData).length > 0) {
                  errorMessage = JSON.stringify(errorData)
                }
              }
            } catch (jsonError) {
              // JSON 解析失敗，嘗試讀取為文字
              console.warn('JSON 解析失敗，嘗試讀取為文字:', jsonError)
              try {
                const textData = await responseClone.text()
                if (textData && textData.trim()) {
                  errorMessage = textData.trim()
                  errorData = { raw: textData }
                }
              } catch (textError) {
                console.error('讀取錯誤回應文字失敗:', textError)
              }
            }
          } else {
            // 非 JSON 回應，直接讀取文字
            try {
              const textData = await response.text()
              if (textData && textData.trim()) {
                errorMessage = textData.trim()
                errorData = { raw: textData }
              }
            } catch (textError) {
              console.error('讀取錯誤回應失敗:', textError)
            }
          }
        } catch (parseError) {
          console.error('無法解析錯誤回應:', parseError)
          errorData = { parseError: parseError instanceof Error ? parseError.message : String(parseError) }
        }
        
        const finalErrorMessage = errorMessage || `HTTP ${response.status} 錯誤`
        console.error(`載入對話失敗 (${response.status}): ${finalErrorMessage}`)
        
        // 如果是 404，從對話列表中移除該對話（可能是使用者已離開或無權限）
        if (response.status === 404) {
          // console.log('對話不存在或已無權限訪問，正在從列表移除...')
          setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
          setCurrentConversation(null)
          // 重新載入對話列表以確保同步
          loadConversations()
        }
        
        throw new Error(`載入對話失敗: ${finalErrorMessage}`)
      }
      const data = await response.json()
      setCurrentConversation(data)
    } catch (error) {
      console.error('Error loading conversation:', error)
      // 如果是網路錯誤或其他非 HTTP 錯誤，也要清空當前對話
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
        console.error('網路錯誤或請求失敗，清空當前對話')
        setCurrentConversation(null)
      }
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    // console.log('👆 選擇對話:', conversationId)
    loadConversation(conversationId)
  }

  const handleSendMessage = async (
    conversationId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' | 'VIDEO',
    fileUrl?: string
  ) => {
    // 前端參數驗證
    if (!conversationId) {
      throw new Error('對話 ID 不存在')
    }
    
    if (!content || content.trim().length === 0) {
      throw new Error('訊息內容不能為空')
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content,
          type,
          fileUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || response.statusText
        const errorDetails = errorData.details ? ` (${errorData.details})` : ''
        console.error(`發送訊息失敗 (${response.status}): ${errorMessage}${errorDetails}`)
        if (errorData.stack) {
          console.error('錯誤堆疊:', errorData.stack)
        }
        throw new Error(`Failed to send message: ${errorMessage}${errorDetails}`)
      }

      const message = await response.json()
      
      // 更新本地狀態
      if (currentConversation) {
        setCurrentConversation({
          ...currentConversation,
          messages: [
            ...currentConversation.messages,
            {
              type: 'message',
              id: message.id,
              content: message.content,
              messageType: message.type,
              senderId: message.senderId,
              senderAlias: message.senderAlias,
              senderImage: message.senderImage,
              fileUrl: message.fileUrl,
              isRead: message.isRead,
              createdAt: message.createdAt,
            },
          ],
        })
      }

      // 更新對話列表
      loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Pusher 即時功能
  const { triggerTyping, isConnected } = usePusher({
    conversationId: currentConversation?.id || null,
    currentUserId: session?.user?.id || '',
    onNewMessage: (message) => {
      if (currentConversation && message.conversationId === currentConversation.id) {
        setCurrentConversation({
          ...currentConversation,
          messages: [
            ...currentConversation.messages,
            {
              type: 'message',
              id: message.id,
              content: message.content,
              messageType: message.type,
              senderId: message.senderId,
              senderAlias: message.senderAlias || '',
              senderImage: message.senderImage,
              fileUrl: message.fileUrl,
              isRead: message.isRead,
              createdAt: message.createdAt,
            },
          ],
        })
      }
      loadConversations()
    },
    onMessageRead: (data) => {
      if (currentConversation && data.conversationId === currentConversation.id) {
        setCurrentConversation({
          ...currentConversation,
          messages: currentConversation.messages.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, isRead: true }
              : msg
          ),
        })
      }
    },
    onTypingStart: (data) => {
      if (currentConversation && data.conversationId === currentConversation.id) {
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const newMap = new Map(prev)
            newMap.delete(data.userId)
            return newMap
          })
        }, 3000)

        typingTimeouts.set(data.userId, timeout)

        setTypingUsers((prev) => {
          const newMap = new Map(prev)
          newMap.set(data.userId, { userId: data.userId, alias: data.userId })
          return newMap
        })
      }
    },
    onTypingStop: (data) => {
      const timeout = typingTimeouts.get(data.userId)
      if (timeout) {
        clearTimeout(timeout)
        typingTimeouts.delete(data.userId)
      }
      setTypingUsers((prev) => {
        const newMap = new Map(prev)
        newMap.delete(data.userId)
        return newMap
      })
    },
    onMemberJoined: (data) => {
      if (currentConversation && data.conversationId === currentConversation.id) {
        loadConversation(currentConversation.id)
        loadConversations()
      }
    },
    onMemberLeft: (data) => {
      if (currentConversation && data.conversationId === currentConversation.id) {
        loadConversation(currentConversation.id)
        loadConversations()
      }
    },
  })

  // 定期重新載入訊息（僅在 Pusher 未連接時作為後備機制）
  useEffect(() => {
    if (!currentConversation?.id) return
    
    // 如果 Pusher 已連接，不進行輪詢（依賴即時推送）
    if (isConnected) {
      return
    }

    // Pusher 未連接時，每 5 秒輪詢一次
    const pollInterval = 5000

    const interval = setInterval(() => {
      // 只在視窗可見時才輪詢
      if (document.visibilityState === 'visible') {
        loadConversation(currentConversation.id)
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [currentConversation?.id, isConnected])

  const handleTyping = (isTyping: boolean) => {
    triggerTyping(isTyping)
  }

  const handleMemberAction = async (action: 'add' | 'leave', userId?: string) => {
    if (!currentConversation) return

    if (action === 'leave' && userId) {
      try {
        const response = await fetch(
          `/api/conversations/${currentConversation.id}/members/${userId}`,
          { method: 'DELETE' }
        )
        if (!response.ok) throw new Error('Failed to leave conversation')
        
        setCurrentConversation(null)
        loadConversations()
      } catch (error) {
        console.error('Error leaving conversation:', error)
      }
    } else if (action === 'add') {
      setShowSearchDialog(true)
    }
  }

  const handleSelectUser = async (userId: string) => {
    if (!currentConversation) return
    
    try {
      const response = await fetch(
        `/api/conversations/${currentConversation.id}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      )
      
      if (!response.ok) throw new Error('Failed to add member')
      
      loadConversation(currentConversation.id)
      loadConversations()
    } catch (error) {
      console.error('Error adding member:', error)
      alert('新增成員失敗')
    }
  }

  const handleNewConversation = () => {
    setShowSearchDialog(true)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-notion-gray">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        currentUserId={session.user.id}
      />
      
      <SearchDialog
        isOpen={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        onSelectUser={async (userId) => {
          if (currentConversation) {
            await handleSelectUser(userId)
          } else {
            // 建立新單聊
            try {
              const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'DIRECT',
                  memberIds: [userId],
                }),
              })
              
              if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`
                
                try {
                  const contentType = response.headers.get('content-type')
                  if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json()
                    if (errorData && errorData.error) {
                      errorMessage = errorData.error
                    } else if (errorData && Object.keys(errorData).length > 0) {
                      errorMessage = JSON.stringify(errorData)
                    }
                  } else {
                    const textData = await response.text()
                    if (textData) {
                      errorMessage = textData
                    }
                  }
                } catch (parseError) {
                  console.error('無法解析錯誤回應:', parseError)
                }
                
                console.error('建立對話失敗:', {
                  status: response.status,
                  statusText: response.statusText,
                  errorMessage
                })
                throw new Error(`建立對話失敗: ${errorMessage}`)
              }
              
              const conv = await response.json()
              handleSelectConversation(conv.id)
              loadConversations()
            } catch (error) {
              console.error('Error creating conversation:', error)
              alert(error instanceof Error ? error.message : '建立對話失敗')
            }
          }
        }}
        onSelectConversation={handleSelectConversation}
      />
      <ChatWindow
        conversation={currentConversation}
        currentUserId={session.user.id}
        onSendMessage={handleSendMessage}
        onMemberAction={handleMemberAction}
        onTyping={handleTyping}
        typingUsers={Array.from(typingUsers.values())}
      />
    </div>
  )
}
