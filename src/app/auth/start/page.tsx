'use client'

import { useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

function AuthStartContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider')
  const callbackUrl = searchParams.get('callbackUrl')

  useEffect(() => {
    if (provider && callbackUrl) {
      // Start OAuth flow
      signIn(provider, {
        callbackUrl: decodeURIComponent(callbackUrl),
        redirect: true,
      })
    }
  }, [provider, callbackUrl])

  return (
    <div className="min-h-screen bg-notion-gray flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-notion-blue mx-auto mb-4"></div>
        <p className="text-base text-notion-text-secondary">正在重定向到 {provider} 認證...</p>
      </div>
    </div>
  )
}

export default function AuthStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-notion-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-notion-blue mx-auto mb-4"></div>
          <p className="text-base text-notion-text-secondary">載入中...</p>
        </div>
      </div>
    }>
      <AuthStartContent />
    </Suspense>
  )
}

