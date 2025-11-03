#!/bin/bash

# Messenger Clone 快速設定腳本
# 此腳本會協助您建立 .env 檔案

echo "🚀 Messenger Clone 環境變數設定"
echo "================================"
echo ""

# 檢查 .env 檔案是否已存在
if [ -f .env ]; then
    echo "⚠️  警告: .env 檔案已存在"
    read -p "是否要覆蓋現有檔案？(y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "取消操作"
        exit 0
    fi
fi

# 複製範本
if [ ! -f .env.example ]; then
    echo "❌ 錯誤: 找不到 .env.example 檔案"
    exit 1
fi

cp .env.example .env
echo "✅ 已從 .env.example 建立 .env 檔案"
echo ""

# 生成 NextAuth Secret
echo "🔐 正在生成 NextAuth Secret..."
if command -v openssl &> /dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "✅ 已生成 NEXTAUTH_SECRET"
elif command -v node &> /dev/null; then
    NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    echo "✅ 已生成 NEXTAUTH_SECRET"
else
    NEXTAUTH_SECRET="請手動生成: openssl rand -base64 32"
    echo "⚠️  無法自動生成，請手動執行: openssl rand -base64 32"
fi

# 更新 .env 檔案
if [ -n "$NEXTAUTH_SECRET" ] && [ "$NEXTAUTH_SECRET" != "請手動生成: openssl rand -base64 32" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/NEXTAUTH_SECRET=\"your-secret-key-here\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env
    else
        # Linux
        sed -i "s/NEXTAUTH_SECRET=\"your-secret-key-here\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env
    fi
fi

echo ""
echo "📝 請編輯 .env 檔案並填入以下資訊："
echo ""
echo "1. DATABASE_URL - MongoDB Atlas 連接字串"
echo "2. FACEBOOK_CLIENT_ID - Facebook App ID"
echo "3. FACEBOOK_CLIENT_SECRET - Facebook App Secret"
echo "4. PUSHER_APP_ID - Pusher App ID"
echo "5. PUSHER_KEY - Pusher Key"
echo "6. PUSHER_SECRET - Pusher Secret"
echo "7. PUSHER_CLUSTER - Pusher Cluster（如 ap1, ap2, us2 等）"
echo "8. CLOUDINARY_CLOUD_NAME - Cloudinary Cloud Name"
echo "9. CLOUDINARY_API_KEY - Cloudinary API Key"
echo "10. CLOUDINARY_API_SECRET - Cloudinary API Secret"
echo ""
echo "📖 詳細設定說明請參考 ENV_SETUP.md"
echo ""
echo "完成後請執行："
echo "  yarn prisma generate"
echo "  yarn prisma db push"
echo "  yarn dev"
echo ""

