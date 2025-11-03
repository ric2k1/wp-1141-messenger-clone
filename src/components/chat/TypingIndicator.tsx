'use client'

interface TypingIndicatorProps {
  userAlias: string
}

export default function TypingIndicator({ userAlias }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-notion-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-notion-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-notion-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-xs text-notion-text-secondary">{userAlias} 正在輸入...</span>
    </div>
  )
}

