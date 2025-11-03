'use client'

import { useState, useRef, FormEvent } from 'react'
import Image from 'next/image'

interface MessageInputProps {
  onSend: (content: string, type: 'TEXT' | 'IMAGE' | 'VIDEO', fileUrl?: string) => Promise<void>
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

export default function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() && !uploadedFile) return
    if (disabled || uploading) return

    try {
      const messageType = uploadedFile ? uploadedFile.type : 'TEXT'
      // 如果有文件但沒有文字，使用默認訊息
      const messageContent = content.trim() || (uploadedFile ? `[${uploadedFile.type === 'IMAGE' ? '圖片' : '視頻'}]` : '')
      
      if (!messageContent) {
        console.error('訊息內容為空')
        return
      }
      
      await onSend(messageContent, messageType, uploadedFile?.url)
      
      setContent('')
      setUploadedFile(null)
      onTyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('請選擇圖片或影片檔案')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上傳失敗')
      }

      const data = await response.json()
      setUploadedFile({
        url: data.url,
        type: isVideo ? 'VIDEO' : 'IMAGE',
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('上傳檔案時發生錯誤')
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value)
    onTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-notion-gray-border bg-notion-gray-light px-4 py-3">
      {uploadedFile && (
        <div className="mb-2 relative inline-block">
          {uploadedFile.type === 'IMAGE' ? (
            <Image
              src={uploadedFile.url}
              alt="Preview"
              width={200}
              height={200}
              className="rounded-md shadow-sm"
              unoptimized
            />
          ) : (
            <video
              src={uploadedFile.url}
              className="w-48 h-32 rounded-md object-cover shadow-sm"
              controls={false}
            />
          )}
          <button
            onClick={() => setUploadedFile(null)}
            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="px-3 py-2 rounded-md text-notion-text hover:bg-notion-gray-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title="上傳圖片或影片"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">上傳</span>
        </button>

        <input
          type="text"
          value={content}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="輸入訊息..."
          disabled={disabled || uploading}
          className="flex-1 px-3 py-2 bg-notion-gray border-0 rounded-md text-xs text-notion-text placeholder:text-notion-text-tertiary focus:outline-none focus:bg-white focus:shadow-sm disabled:opacity-50 transition-all"
        />

        <button
          type="submit"
          disabled={disabled || uploading || (!content.trim() && !uploadedFile)}
          className="p-2 bg-notion-blue text-white rounded-md hover:bg-notion-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="發送訊息"
        >
          {uploading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}

