'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Look up user by alias
      const response = await fetch('/api/auth/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '查詢使用者失敗')
        setLoading(false)
        return
      }

      // User found, redirect to OAuth
      await signIn(data.provider, {
        callbackUrl: '/',
        redirect: true,
      })
    } catch (err) {
      console.error('Login error:', err)
      setError('登入時發生錯誤')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-notion-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-notion-gray-light rounded-notion-lg shadow-notion-lg p-8 border border-notion-gray-border">
        <h1 className="text-2xl font-semibold text-notion-text mb-6 text-center">登入 Messenger</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
          <div className="w-full flex flex-col items-center">
            <label htmlFor="username" className="block text-sm font-medium text-notion-text-secondary mb-2 w-64 text-left">
              用戶名 (Alias)
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-64 px-4 py-2.5 text-sm bg-notion-gray border border-notion-gray-border rounded-notion text-notion-text placeholder:text-notion-text-tertiary focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent transition-all"
              placeholder="輸入您的用戶名"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-notion w-64 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-64 bg-notion-blue text-white py-2.5 px-6 text-sm rounded-notion-lg hover:bg-notion-blue-hover focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-notion"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-notion-text-secondary">
            還沒有帳號？{' '}
            <a href="/auth/register" className="text-notion-blue hover:text-notion-blue-hover font-medium transition-colors">
              立即註冊
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

