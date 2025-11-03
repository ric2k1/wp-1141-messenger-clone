# Messenger Clone

一個使用 Next.js、Pusher、MongoDB、Prisma、Next-auth、Tailwind CSS + shadcn/ui 構建的即時聊天應用。

## 技術棧

- **框架**: Next.js 16+ (App Router, serverless 架構)
- **即時通訊**: Pusher (cloud-based)
- **資料庫**: MongoDB Atlas (cloud-based) + Prisma ORM
- **認證**: Next-auth v5 (Facebook OAuth / GitHub OAuth + alias 系統)
- **樣式**: Tailwind CSS + shadcn/ui
- **部署**: Vercel (serverless)
- **套件管理**: yarn
- **多媒體儲存**: Cloudinary (或其他 CDN 服務)

## 開始使用

### 前置需求

- Node.js 18+
- MongoDB Atlas 帳號
- Facebook 開發者帳號（用於 Facebook OAuth）
- GitHub 帳號（用於 GitHub OAuth）
- Pusher 帳號
- Cloudinary 帳號（可選）

### 安裝步驟

1. **安裝依賴**

```bash
yarn install
```

2. **配置環境變數**

複製 `.env.example` 為 `.env` 並填入相應的值：

```bash
cp .env.example .env
```

**詳細設定說明：**

- 請參考 [ENV_SETUP.md](./ENV_SETUP.md) 獲取完整的環境變數設定指南
- 或執行快速設定腳本：`./QUICK_SETUP.sh`

3. **初始化資料庫**

```bash
yarn prisma generate
yarn prisma db push
```

4. **啟動開發伺服器**

```bash
yarn dev
```

訪問 `http://localhost:3000`

## 開發指令

```bash
yarn dev         # 啟動開發伺服器
yarn build       # 構建生產版本
yarn start       # 啟動生產伺服器
yarn lint        # 運行 linter
```

## 授權

MIT License
