'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [alias, setAlias] = useState('')
  const [provider, setProvider] = useState<'facebook' | 'github'>('facebook')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '建立使用者失敗')
        setLoading(false)
        return
      }

      // Redirect to OAuth authorization
      window.location.href = data.authUrl
    } catch (err) {
      console.error('Registration error:', err)
      setError('註冊時發生錯誤')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-notion-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-notion-gray-light rounded-notion-lg shadow-notion-lg p-8 border border-notion-gray-border">
        <h1 className="text-2xl font-semibold text-notion-text mb-6 text-center">註冊 Messenger</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-notion-text-secondary mb-2">
              用戶名 (Alias)
            </label>
            <input
              id="alias"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-4 py-2.5 bg-notion-gray border border-notion-gray-border rounded-notion text-sm text-notion-text placeholder:text-notion-text-tertiary focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent transition-all"
              placeholder="輸入一個唯一的用戶名"
              required
              minLength={3}
            />
            <p className="mt-2 text-xs text-notion-text-tertiary">
              此用戶名將用於登入和與其他用戶通訊
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-3">
              選擇註冊方式
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 bg-notion-gray border border-notion-gray-border rounded-notion cursor-pointer hover:border-notion-blue transition-all">
                <input
                  type="radio"
                  name="provider"
                  value="facebook"
                  checked={provider === 'facebook'}
                  onChange={(e) => setProvider(e.target.value as 'facebook')}
                  className="mr-3 h-4 w-4 text-notion-blue focus:ring-notion-blue"
                />
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm text-notion-text">Facebook</span>
                </div>
              </label>
              <label className="flex items-center p-3 bg-notion-gray border border-notion-gray-border rounded-notion cursor-pointer hover:border-notion-blue transition-all">
                <input
                  type="radio"
                  name="provider"
                  value="github"
                  checked={provider === 'github'}
                  onChange={(e) => setProvider(e.target.value as 'github')}
                  className="mr-3 h-4 w-4 text-notion-blue focus:ring-notion-blue"
                />
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-notion-text" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm text-notion-text">GitHub</span>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-notion text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-notion-blue text-white py-2.5 px-4 rounded-notion-lg hover:bg-notion-blue-hover focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-notion"
          >
            {loading ? '註冊中...' : `用 ${provider === 'facebook' ? 'Facebook' : 'GitHub'} 註冊`}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-notion-text-secondary">
            已有帳號？{' '}
            <a href="/auth/login" className="text-notion-blue hover:text-notion-blue-hover font-medium transition-colors">
              立即登入
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

