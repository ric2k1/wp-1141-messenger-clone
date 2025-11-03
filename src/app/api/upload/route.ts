import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/upload - 上傳多媒體檔案到 CDN
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 檢查檔案類型
    const fileType = file.type
    const isImage = fileType.startsWith('image/')
    const isVideo = fileType.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'File must be an image or video' },
        { status: 400 }
      )
    }

    // 檢查檔案大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // 轉換 File 為 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上傳到 Cloudinary
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: isVideo ? 'video' : 'image',
          folder: 'messenger-clone',
          public_id: `${session.user.id}-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (!result) {
            reject(new Error('Upload failed: No result returned'))
          } else {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            })
          }
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      type: isVideo ? 'VIDEO' : 'IMAGE',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

