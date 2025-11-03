#!/bin/bash

# 刪除使用者及其所有相關資料的腳本
# 
# 此腳本會刪除：
# 1. 使用者發送的所有訊息
# 2. 使用者參與的所有一對一對話（DIRECT 類型，會完全刪除整個對話）
# 3. 使用者參與的群組對話中的成員記錄（GROUP 類型，對話保留但移除該使用者）
# 4. 使用者建立的所有對話（會 cascade 刪除對話中的訊息和成員）
# 5. 與使用者相關的 SystemMessage（包含該使用者 ID 的系統訊息）
# 6. 使用者帳號本身
#
# 使用方法：
# ./scripts/delete-user.sh <userId|alias|email>
#
# 範例：
# ./scripts/delete-user.sh user123
# ./scripts/delete-user.sh user@example.com
# ./scripts/delete-user.sh 507f1f77bcf86cd799439011

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查是否提供了使用者識別碼
if [ -z "$1" ]; then
    echo -e "${RED}❌ 錯誤: 請提供使用者識別碼（ID、alias 或 email）${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/delete-user.sh <userId|alias|email>"
    echo ""
    echo "範例:"
    echo "  ./scripts/delete-user.sh user123"
    echo "  ./scripts/delete-user.sh user@example.com"
    echo "  ./scripts/delete-user.sh 507f1f77bcf86cd799439011"
    exit 1
fi

# 切換到腳本所在目錄的父目錄（專案根目錄）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# 檢查 .env 檔案是否存在
if [ ! -f .env ]; then
    echo -e "${RED}❌ 錯誤: 找不到 .env 檔案${NC}"
    echo "請先設定環境變數，參考 ENV_SETUP.md"
    exit 1
fi

# 檢查 .env 檔案中是否有 DATABASE_URL
if ! grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    echo -e "${RED}❌ 錯誤: .env 檔案中未找到 DATABASE_URL${NC}"
    echo "請在 .env 檔案中設定 DATABASE_URL"
    exit 1
fi

# 載入環境變數（Prisma 會自動讀取 .env，這裡只是為了檢查）
# 注意：TypeScript 腳本會通過 Prisma 自動讀取 .env 檔案

# 檢查是否安裝了必要的套件
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  警告: node_modules 不存在，正在安裝依賴...${NC}"
    yarn install
fi

# 檢查是否安裝了 tsx（用於執行 TypeScript）
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ 錯誤: 找不到 yarn 命令${NC}"
    exit 1
fi

# 檢查 tsx 是否可用，如果不可用則嘗試安裝
if ! yarn tsx --version &> /dev/null; then
    echo -e "${YELLOW}⚠️  警告: tsx 未安裝，正在安裝...${NC}"
    yarn add -D tsx
fi

# 確保 Prisma Client 已生成
if [ ! -d "node_modules/.prisma/client" ]; then
    echo -e "${YELLOW}⚠️  警告: Prisma Client 尚未生成，正在生成...${NC}"
    yarn prisma generate
fi

# 執行 TypeScript 腳本
echo -e "${GREEN}🚀 開始刪除使用者資料...${NC}"
echo ""

yarn tsx scripts/delete-user.ts "$1"

echo ""
echo -e "${GREEN}✅ 腳本執行完成${NC}"

