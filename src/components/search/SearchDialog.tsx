'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface User {
  id: string
  alias: string
  image?: string
}

interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  members: Array<{ id: string; alias: string; image?: string }>
  createdAt: Date | string
}

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (userId: string) => void
  onSelectConversation: (conversationId: string) => void
}

export default function SearchDialog({
  isOpen,
  onClose,
  onSelectUser,
  onSelectConversation,
}: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setUsers([])
      setConversations([])
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setUsers(data.users || [])
        setConversations(data.conversations || [])
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(search, 300)
    return () => clearTimeout(timeout)
  }, [query, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-notion-gray-light rounded-notion-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-notion-lg">
        {/* 頭部 */}
        <div className="px-6 py-4 border-b border-notion-gray-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-notion-text">搜尋</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-notion-gray-hover rounded-notion text-notion-text-secondary hover:text-notion-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜尋框 */}
        <div className="px-6 py-4 border-b border-notion-gray-border">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋使用者或對話..."
            className="w-full px-4 py-2.5 bg-notion-gray border border-notion-gray-border rounded-notion text-sm text-notion-text placeholder:text-notion-text-tertiary focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* 結果列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-notion-text-secondary text-sm">搜尋中...</div>
          ) : !query.trim() ? (
            <div className="text-center py-8 text-notion-text-secondary text-sm">輸入關鍵字開始搜尋</div>
          ) : (
            <>
              {/* 使用者結果 */}
              {users.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-notion-text-tertiary mb-3 uppercase tracking-wide">使用者</h3>
                  <div className="space-y-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user.id)
                          onClose()
                        }}
                        className="w-full px-3 py-2.5 hover:bg-notion-gray-hover rounded-notion flex items-center gap-3 transition-colors"
                      >
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.alias}
                            width={36}
                            height={36}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-notion-gray-border flex items-center justify-center">
                            <span className="text-sm font-medium text-notion-text-secondary">{user.alias.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-medium text-sm text-notion-text">{user.alias}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 對話結果 */}
              {conversations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-notion-text-tertiary mb-3 uppercase tracking-wide">對話</h3>
                  <div className="space-y-1">
                    {conversations.map((conv) => {
                      const displayName = conv.type === 'DIRECT'
                        ? conv.members[0]?.alias || '未知'
                        : conv.members.map(m => m.alias).join(', ')
                      
                      return (
                        <button
                          key={conv.id}
                          onClick={() => {
                            onSelectConversation(conv.id)
                            onClose()
                          }}
                          className="w-full px-3 py-2.5 hover:bg-notion-gray-hover rounded-notion flex items-center gap-3 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-notion-gray-border flex items-center justify-center">
                            <span className="text-sm font-medium text-notion-text-secondary">{displayName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-notion-text">{displayName}</div>
                            <div className="text-xs text-notion-text-secondary">
                              {conv.type === 'GROUP' ? '群聊' : '單聊'}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {users.length === 0 && conversations.length === 0 && query.trim() && (
                <div className="text-center py-8 text-notion-text-secondary text-sm">沒有找到結果</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

