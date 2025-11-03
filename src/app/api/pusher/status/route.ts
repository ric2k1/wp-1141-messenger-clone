import { NextRequest, NextResponse } from 'next/server'
import { getPusherStatus } from '@/lib/pusher'

export const runtime = 'nodejs'

// GET /api/pusher/status - 檢查 Pusher 配置狀態（僅在開發環境）
export async function GET(request: NextRequest) {
  // 只在開發環境中允許訪問
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const status = getPusherStatus()
  
  return NextResponse.json({
    configured: status.configured,
    status: status.status,
    lastError: status.lastError
      ? {
          message: status.lastError.message,
          name: status.lastError.name,
        }
      : null,
    tips: !status.configured
      ? [
          '檢查 .env 檔案中是否設置了所有 Pusher 環境變數',
          '確認環境變數名稱正確：PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER',
          '確認環境變數值沒有多餘的空格或換行符',
        ]
      : status.status === 'error'
      ? [
          'PUSHER_SECRET 可能不正確',
          '檢查環境變數中是否有隱藏字符（空格、換行等）',
          '在 Vercel 上部署時，確認環境變數已正確設置',
          '重新從 Pusher 儀表板複製 secret 值',
        ]
      : [],
  })
}

