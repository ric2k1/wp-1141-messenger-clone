import PusherServer from 'pusher'

// 檢查 Pusher 環境變數是否已設定
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
}

// 只有在所有環境變數都存在時才初始化 Pusher
const isPusherConfigured = 
  pusherConfig.appId && 
  pusherConfig.key && 
  pusherConfig.secret && 
  pusherConfig.cluster

export const pusherServer = isPusherConfigured
  ? new PusherServer({
      appId: pusherConfig.appId,
      key: pusherConfig.key,
      secret: pusherConfig.secret,
      cluster: pusherConfig.cluster,
      useTLS: true,
    })
  : null

// 輔助函數：安全地觸發 Pusher 事件
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: any
): Promise<void> {
  if (!pusherServer) {
    console.warn('Pusher 未配置，跳過即時訊息推送')
    return
  }

  try {
    await pusherServer.trigger(channel, event, data)
  } catch (error) {
    // Pusher 錯誤不應該中斷主要流程
    console.error('Pusher trigger 失敗（訊息已建立）:', error)
    // 不拋出錯誤，讓呼叫者繼續執行
  }
}

