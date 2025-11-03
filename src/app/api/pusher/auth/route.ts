import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

export const runtime = 'nodejs'

// POST /api/pusher/auth - Pusher 頻道認證
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Pusher 發送的是 x-www-form-urlencoded，需要手動解析
    const text = await request.text()
    const params = new URLSearchParams(text)
    const socket_id = params.get('socket_id')
    const channel_name = params.get('channel_name')

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: 'socket_id and channel_name are required' },
        { status: 400 }
      )
    }

    // 檢查 Pusher 是否已配置
    if (!pusherServer) {
      return NextResponse.json(
        { error: 'Pusher is not configured' },
        { status: 503 }
      )
    }

    // 驗證使用者是否有權限訪問該頻道
    // 格式: private-conversation-{conversationId}
    if (channel_name.startsWith('private-conversation-')) {
      const conversationId = channel_name.replace('private-conversation-', '')
      
      // 這裡應該檢查使用者是否為對話成員
      // 為了簡化，我們先允許認證，實際應用中應該加入資料庫檢查
      const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
        user_id: session.user.id,
        user_info: {
          alias: session.user.alias || '',
          image: session.user.image || '',
        },
      })

      return NextResponse.json(auth)
    }

    // Presence channel 認證
    if (channel_name.startsWith('presence-conversation-')) {
      const conversationId = channel_name.replace('presence-conversation-', '')
      
      const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
        user_id: session.user.id,
        user_info: {
          alias: session.user.alias || '',
          image: session.user.image || '',
        },
      })

      return NextResponse.json(auth)
    }

    return NextResponse.json(
      { error: 'Invalid channel name' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error authenticating Pusher channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

