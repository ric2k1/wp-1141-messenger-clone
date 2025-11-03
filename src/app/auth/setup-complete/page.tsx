'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

function SetupCompleteContent() {
  const searchParams = useSearchParams()
  const alias = searchParams.get('alias')
  const router = useRouter()

  const handleGoToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-notion-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-notion-gray-light rounded-notion-lg shadow-notion-lg p-8 border border-notion-gray-border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-50 mb-5">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-notion-text mb-3">註冊成功！</h1>
          
          {alias && (
            <p className="text-notion-text-secondary mb-7">
              您的帳號 <span className="font-semibold text-notion-text">{alias}</span> 已經成功設定完成
            </p>
          )}
          
          <button
            onClick={handleGoToLogin}
            className="w-full bg-notion-blue text-white py-2.5 px-4 rounded-notion-lg hover:bg-notion-blue-hover focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2 transition-all shadow-notion"
          >
            立即登入
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SetupCompletePage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <SetupCompleteContent />
    </Suspense>
  )
}

