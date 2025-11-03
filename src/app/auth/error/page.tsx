'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: { [key: string]: string } = {
    MissingAlias: '缺少用戶名參數',
    NoSession: '沒有找到 OAuth 會話',
    UserNotFound: '找不到用戶',
    ProviderMismatch: 'OAuth 提供商不匹配',
    OAuthNotCompleted: 'OAuth 認證未完成',
    InternalError: '內部錯誤',
  }

  const message = error ? errorMessages[error] || '發生未知錯誤' : '發生未知錯誤'

  return (
    <div className="min-h-screen bg-notion-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-notion-gray-light rounded-notion-lg shadow-notion-lg p-8 border border-notion-gray-border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-5">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-notion-text mb-3">錯誤</h1>
          <p className="text-notion-text-secondary mb-7">{message}</p>
          
          <a
            href="/auth/login"
            className="inline-block bg-notion-blue text-white py-2.5 px-6 rounded-notion-lg hover:bg-notion-blue-hover focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2 transition-all shadow-notion"
          >
            返回登入頁面
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <ErrorContent />
    </Suspense>
  )
}

