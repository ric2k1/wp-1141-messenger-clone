import PusherServer from 'pusher'

// 檢查 Pusher 環境變數是否已設定
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID?.trim(),
  key: process.env.PUSHER_KEY?.trim(),
  secret: process.env.PUSHER_SECRET?.trim(),
  cluster: process.env.PUSHER_CLUSTER?.trim(),
}

// 檢查哪些環境變數缺失
const missingVars: string[] = []
if (!pusherConfig.appId) missingVars.push('PUSHER_APP_ID')
if (!pusherConfig.key) missingVars.push('PUSHER_KEY')
if (!pusherConfig.secret) missingVars.push('PUSHER_SECRET')
if (!pusherConfig.cluster) missingVars.push('PUSHER_CLUSTER')

// 只有在所有環境變數都存在時才初始化 Pusher
const isPusherConfigured = missingVars.length === 0

if (!isPusherConfigured && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  Pusher 未完全配置，缺少以下環境變數:', missingVars.join(', '))
  console.warn('   即時訊息功能將無法使用，但訊息仍會正常儲存')
}

export const pusherServer = isPusherConfigured
  ? new PusherServer({
      appId: pusherConfig.appId as string,
      key: pusherConfig.key as string,
      secret: pusherConfig.secret as string,
      cluster: pusherConfig.cluster as string,
      useTLS: true,
    })
  : null

// 追蹤 Pusher 連接狀態
let pusherConnectionStatus: 'connected' | 'error' | 'not_configured' = 
  isPusherConfigured ? 'connected' : 'not_configured'
let lastPusherError: Error | null = null

// 輔助函數：安全地觸發 Pusher 事件
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: any
): Promise<boolean> {
  if (!pusherServer) {
    return false
  }

  try {
    await pusherServer.trigger(channel, event, data)
    pusherConnectionStatus = 'connected'
    lastPusherError = null
    return true
  } catch (error) {
    pusherConnectionStatus = 'error'
    lastPusherError = error instanceof Error ? error : new Error(String(error))
    
    // 提供更詳細的錯誤訊息
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Invalid signature')) {
        console.error('❌ Pusher 認證失敗：')
        console.error('   可能原因：')
        console.error('   1. PUSHER_SECRET 不正確')
        console.error('   2. 環境變數中有多餘的空格或換行符')
        console.error('   3. 在 Vercel 上部署時環境變數未正確設置')
        console.error('   請檢查 .env 檔案或 Vercel 環境變數設定')
        console.error('   錯誤詳情:', error.message)
      } else {
        console.error('Pusher trigger 失敗:', error.message)
      }
    } else {
      console.error('Pusher trigger 失敗（未知錯誤）:', error)
    }
    
    return false
  }
}

// 獲取 Pusher 連接狀態
export function getPusherStatus() {
  return {
    configured: isPusherConfigured,
    status: pusherConnectionStatus,
    lastError: lastPusherError,
  }
}

