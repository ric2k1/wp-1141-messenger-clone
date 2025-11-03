# 環境變數設定指南

本指南將協助您完成 Messenger Clone 專案所需的所有環境變數設定。

## 📋 所需服務

1. **MongoDB Atlas** - 雲端資料庫
2. **Facebook Developers** - OAuth 認證
3. **GitHub OAuth App** - OAuth 認證
4. **Pusher** - 即時通訊服務
5. **Cloudinary** - 多媒體 CDN（可選）
6. **NextAuth** - 認證密鑰

---

## 1. MongoDB Atlas 設定

### 步驟 1：建立 MongoDB Atlas 帳號

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 註冊或登入帳號
3. 建立新的專案（或使用預設專案）

### 步驟 2：建立資料庫叢集

1. 點擊 "Build a Database"
2. 選擇免費方案（M0 - Free）
3. 選擇雲端供應商和地區（建議選擇離您最近的地區）
4. 叢集名稱可自訂或使用預設
5. 點擊 "Create"

### 步驟 3：建立資料庫使用者

1. 在 "Database Access" 頁面點擊 "Add New Database User"
2. 選擇 "Password" 認證方式
3. 輸入使用者名稱和密碼（請妥善保存）
4. 設定權限為 "Atlas Admin"（或僅讀寫權限）
5. 點擊 "Add User"

### 步驟 4：設定網路存取

1. 在 "Network Access" 頁面點擊 "Add IP Address"
2. 選擇 "Allow Access from Anywhere"（開發階段）或添加特定 IP
3. 點擊 "Confirm"

### 步驟 5：取得連接字串

1. 在 "Database" 頁面點擊 "Connect"
2. 選擇 "Connect your application"
3. 選擇驅動程式：**Node.js**，版本：**5.5 或更高**
4. 複製連接字串，格式如下：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. 將 `<username>` 和 `<password>` 替換為您剛建立的資料庫使用者資訊
6. 在連接字串末尾添加資料庫名稱：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/messenger?retryWrites=true&w=majority
   ```

**環境變數設定：**

```env
DATABASE_URL="mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/messenger?retryWrites=true&w=majority"
```

---

## 2. Facebook OAuth 設定

### 步驟 1：建立 Facebook 應用程式

1. 前往 [Facebook Developers](https://developers.facebook.com/)
2. 登入您的 Facebook 帳號
3. 點擊右上角的 "我的應用程式" → "建立應用程式"
4. 選擇 "消費者" 類型
5. 填寫應用程式資訊：
   - 應用程式名稱：Messenger Clone（可自訂）
   - 應用程式聯絡電子郵件：您的電子郵件
6. 點擊 "建立應用程式"

### 步驟 2：新增 Facebook 登入產品

1. 在應用程式儀表板中，找到 "新增產品"
2. 找到 "Facebook 登入" 並點擊 "設定"
3. 選擇 "網頁" 平台（如果尚未選擇）

### 步驟 3：設定 OAuth 重新導向 URI

1. 在左側選單中找到 "Facebook 登入" → "設定"
2. 在 "有效的 OAuth 重新導向 URI" 中添加：
   ```
   http://localhost:3000/api/auth/callback/facebook
   http://localhost:3000/api/auth/callback-setup
   ```
3. 如果將部署到生產環境，也添加生產環境的 URL：
   ```
   https://messenger-clone-8vf6elus9-ric2k1s-projects.vercel.app/api/auth/callback/facebook
   https://messenger-clone-8vf6elus9-ric2k1s-projects.vercel.app/api/auth/callback-setup
   ```
4. 點擊 "儲存變更"

### 步驟 4：取得應用程式 ID 和密鑰

1. 在左側選單中找到 "設定" → "基本資料"
2. 複製 "應用程式編號"（App ID）
3. 在 "應用程式密鑰" 旁邊點擊 "顯示"，複製密鑰

### 步驟 5：設定應用程式網域（可選）

在 "設定" → "基本資料" 中：

- 應用程式網域：`localhost`（開發環境）
- 網站網址：`http://localhost:3000`

**環境變數設定：**

```env
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

---

## 3. GitHub OAuth 設定

### 步驟 1：建立 GitHub OAuth App

1. 前往 [GitHub Settings](https://github.com/settings/profile)
2. 在左側選單中找到 "Developer settings"
3. 點擊 "OAuth Apps" → "New OAuth App"
4. 填寫應用程式資訊：
   - **Application name**：Messenger Clone（可自訂）
   - **Homepage URL**：`http://localhost:3000`（開發環境）
   - **Application description**：Messenger Clone App（可選）
   - **Authorization callback URL**：`http://localhost:3000/api/auth/callback/github`
5. 點擊 "Register application"

### 步驟 2：取得 Client ID 和 Secret

1. 註冊完成後，您會看到 "Client ID"，請複製
2. 點擊 "Generate a new client secret" 按鈕
3. 複製生成的 Client Secret（**注意：此密鑰只會顯示一次，請妥善保存**）

### 步驟 3：設定額外的 Callback URL（用於完成註冊流程）

1. 在 OAuth App 設定頁面，您可能需要在 Authorization callback URL 中支援多個 URL
2. 開發環境需要的 URL：
   ```
   http://localhost:3000/api/auth/callback/github
   http://localhost:3000/api/auth/callback-setup
   ```
   **注意：** GitHub OAuth App 只支援單一 callback URL，所以我們使用 `/api/auth/callback/github` 作為主要的 callback URL，`callback-setup` 會透過程式邏輯處理

### 步驟 4：生產環境設定

如果將部署到生產環境，需要建立另一個 OAuth App 或更新 callback URL：

```
https://messenger-clone-8vf6elus9-ric2k1s-projects.vercel.app/api/auth/callback/github
```

**環境變數設定：**

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 常見問題

**Q: GitHub OAuth 回傳 "redirect_uri_mismatch" 錯誤**

- 確認 GitHub OAuth App 中設定的 Authorization callback URL 與程式中使用的完全一致
- URL 必須包含協議（http:// 或 https://）
- 確認沒有多餘的尾隨斜線

**Q: 如何在生產環境使用 GitHub OAuth？**

- 建議為生產環境建立另一個 GitHub OAuth App
- 使用生產環境的域名作為 Homepage URL 和 Callback URL

---

## 4. Pusher 設定

### 步驟 1：建立 Pusher 帳號

1. 前往 [Pusher](https://pusher.com/)
2. 註冊或登入帳號
3. 選擇免費方案（Sandbox - 可支援 100 個同時連線）

### 步驟 2：建立應用程式

1. 在儀表板中點擊 "Create app" 或 "Channels" → "Create app"
2. 填寫應用程式資訊：
   - App name: Messenger Clone（可自訂）
   - Cluster: 選擇離您最近的地區（如 ap1, ap2, us2 等）
   - Front end tech: React
   - Back end tech: Node.js
3. 點擊 "Create app"

### 步驟 3：取得應用程式金鑰

1. 在應用程式頁面，點擊 "App Keys" 標籤
2. 複製以下資訊：
   - **app_id** → `PUSHER_APP_ID`
   - **key** → `PUSHER_KEY` 和 `NEXT_PUBLIC_PUSHER_KEY`
   - **secret** → `PUSHER_SECRET`
   - **cluster** → `PUSHER_CLUSTER` 和 `NEXT_PUBLIC_PUSHER_CLUSTER`

**環境變數設定：**

```env
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

**注意：** `NEXT_PUBLIC_*` 變數會暴露在前端，請確保只使用公開的金鑰（key），不要暴露 secret。

---

## 5. Cloudinary 設定（可選）

### 步驟 1：建立 Cloudinary 帳號

1. 前往 [Cloudinary](https://cloudinary.com/)
2. 註冊或登入帳號
3. 免費方案提供 25GB 儲存空間和 25GB 月流量

### 步驟 2：取得 API 認證資訊

1. 登入後，在儀表板首頁可以看到您的帳號資訊
2. 複製以下資訊：
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

**環境變數設定：**

```env
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

**注意：** 如果暫時不使用多媒體上傳功能，可以跳過此設定，但上傳功能將無法使用。

---

## 6. NextAuth Secret 設定

NextAuth 需要一個隨機密鑰來加密 session。

### 方法 1：使用 OpenSSL（推薦）

```bash
openssl rand -base64 32
```

### 方法 2：使用 Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 方法 3：使用線上工具

前往 [generate-secret.vercel.app](https://generate-secret.vercel.app/32) 生成

複製生成的密鑰並設定：

**環境變數設定：**

```env
NEXTAUTH_SECRET="your-generated-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 7. 建立 .env 檔案

### 步驟 1：複製範本檔案

```bash
cp .env.example .env
```

### 步驟 2：編輯 .env 檔案

將上述所有環境變數填入 `.env` 檔案：

```env
# MongoDB Database
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/messenger?retryWrites=true&w=majority"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Pusher (Server-side)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"

# Pusher (Client-side)
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Cloudinary CDN
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 步驟 3：驗證設定

```bash
# 檢查環境變數是否正確載入
yarn dev
```

---

## 8. 驗證清單

完成所有設定後，請確認：

- [ ] MongoDB Atlas 連接字串已正確設定
- [ ] Facebook OAuth App ID 和 Secret 已設定
- [ ] Facebook OAuth 重新導向 URI 已正確配置
- [ ] GitHub OAuth App Client ID 和 Secret 已設定
- [ ] GitHub OAuth Callback URL 已正確配置
- [ ] Pusher App ID、Key、Secret 和 Cluster 已設定
- [ ] Pusher Client Key 和 Cluster 已設定（與 Server 相同）
- [ ] Cloudinary 認證資訊已設定（如使用）
- [ ] NextAuth Secret 已生成並設定
- [ ] NEXTAUTH_URL 已設定為 `http://localhost:3000`
- [ ] `.env` 檔案存在於專案根目錄
- [ ] `.env` 檔案已加入 `.gitignore`（不會被提交到 Git）

---

## 9. 常見問題

### Q: MongoDB 連接失敗

**A:**

- 確認資料庫使用者名稱和密碼正確
- 確認 IP 已加入 MongoDB Atlas 白名單
- 確認連接字串中包含資料庫名稱

### Q: Facebook OAuth 錯誤 "redirect_uri_mismatch"

**A:**

- 確認在 Facebook 開發者後台設定的重新導向 URI 與程式碼中使用的一致
- 開發環境應使用 `http://localhost:3000`
- 確認 URI 大小寫和尾隨斜線是否一致

### Q: GitHub OAuth 錯誤 "redirect_uri_mismatch"

**A:**

- 確認在 GitHub OAuth App 設定的 Authorization callback URL 正確
- 開發環境應使用 `http://localhost:3000/api/auth/callback/github`
- 確認 URL 格式完全一致，包括協議和路徑

### Q: Pusher 連線失敗

**A:**

- 確認 `PUSHER_KEY` 和 `NEXT_PUBLIC_PUSHER_KEY` 相同
- 確認 `PUSHER_CLUSTER` 和 `NEXT_PUBLIC_PUSHER_CLUSTER` 相同
- 確認 Cluster 地區選擇正確

### Q: 圖片上傳失敗

**A:**

- 確認 Cloudinary 認證資訊正確
- 檢查 Cloudinary 帳號是否啟用
- 確認上傳的檔案大小未超過限制

### Q: 生產環境登入時跳轉到 localhost:3000/auth/error?error=Configuration

**A:**

這是因為 `NEXTAUTH_URL` 環境變數在生產環境中設定錯誤。NextAuth 使用 `NEXTAUTH_URL` 來決定回調 URL，如果設定為 `http://localhost:3000`，會導致所有重定向都指向 localhost。

**解決方法：**

1. **在 Vercel Dashboard 中更新環境變數**

   - 前往 Vercel Dashboard → 您的專案 → Settings → Environment Variables
   - 找到 `NEXTAUTH_URL` 環境變數
   - 更新為您的生產環境 URL（如 `https://your-app-name.vercel.app`）
   - **重要：** 確保 URL 以 `https://` 開頭，且不包含尾隨斜線

2. **重新部署應用**

   ```bash
   vercel --prod
   ```

   或在 Vercel Dashboard 中觸發新的部署

3. **確認環境變數已正確設定**

   - 檢查 Production 環境的 `NEXTAUTH_URL` 是否為生產環境 URL
   - 確認 Preview 和 Development 環境的 `NEXTAUTH_URL` 分別設定為對應的 URL（如需）

4. **同時確認 OAuth 重新導向 URI**
   - Facebook 和 GitHub OAuth App 的回調 URL 也應該包含生產環境 URL
   - 參考「10. 生產環境設定」章節中的說明

**注意：** 環境變數變更後，必須重新部署應用才會生效。

---

## 10. 生產環境設定

部署到 Vercel 或其他平台時：

1. **在平台設定環境變數**

   - 將所有 `.env` 中的變數添加到平台環境變數設定中
   - 注意 `NEXT_PUBLIC_*` 變數會暴露在前端

2. **更新 NEXTAUTH_URL**

   ```env
   NEXTAUTH_URL="https://messenger-clone-8vf6elus9-ric2k1s-projects.vercel.app"
   ```

3. **更新 OAuth 重新導向 URI**

   - 在 Facebook 開發者後台添加生產環境 URL
   - 在 GitHub OAuth App 中更新 Callback URL（或建立新的 OAuth App）

4. **檢查 MongoDB IP 白名單**
   - 可能需要添加 Vercel 的 IP 範圍，或允許所有 IP

---

## 完成後續步驟

設定完成後，請執行：

```bash
# 1. 生成 Prisma Client
yarn prisma generate

# 2. 推送資料庫 schema
yarn prisma db push

# 3. 啟動開發伺服器
yarn dev
```

祝設定順利！🚀
