# Vercel 部署指南

本指南將協助您將 Messenger Clone 專案部署到 Vercel。

## 📋 部署前準備

### 1. 確保代碼已提交到 Git

```bash
# 確認所有變更已提交
git status

# 如果有未提交的變更，請提交
git add .
git commit -m "準備部署到 Vercel"
```

### 2. 準備環境變數

在部署前，請準備好所有必要的環境變數。請參考 [ENV_SETUP.md](./ENV_SETUP.md) 了解詳細設定。

**必需的環境變數：**

```env
# MongoDB Database
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/messenger?retryWrites=true&w=majority"

# Next Auth
NEXTAUTH_URL="https://your-app-name.vercel.app"
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

# Cloudinary CDN (可選)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

---

## 🚀 部署步驟

### 方法一：透過 Vercel CLI（推薦）

#### 步驟 1：安裝 Vercel CLI

```bash
yarn global add vercel
# 或
npm i -g vercel
```

#### 步驟 2：登入 Vercel

```bash
vercel login
```

#### 步驟 3：在專案目錄中執行部署

```bash
cd messenger-clone
vercel
```

按照提示：
1. 選擇「Set up and deploy」
2. 選擇專案名稱（或使用預設）
3. 選擇目錄（使用 `.` 當前目錄）

#### 步驟 4：設定環境變數

部署完成後，需要設定環境變數：

```bash
# 方法 A：使用 CLI 設定（逐個設定）
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
# ... 依此類推設定所有環境變數

# 方法 B：在 Vercel Dashboard 中設定（推薦）
# 1. 前往 https://vercel.com/dashboard
# 2. 選擇您的專案
# 3. 進入 Settings > Environment Variables
# 4. 逐一添加所有環境變數
```

**重要：** 確保為所有環境（Production、Preview、Development）設定環境變數。

#### 步驟 5：重新部署

設定環境變數後，需要重新部署以套用變更：

```bash
vercel --prod
```

---

### 方法二：透過 Vercel Dashboard（網頁界面）

#### 步驟 1：連接 GitHub 倉庫

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊「Add New Project」
3. 選擇「Import Git Repository」
4. 授權 Vercel 存取您的 GitHub 倉庫
5. 選擇 `messenger-clone` 倉庫
6. 點擊「Import」

#### 步驟 2：配置專案設定

在專案設定頁面：

- **Framework Preset**: Next.js（應該自動偵測）
- **Root Directory**: 使用預設（`.`）或如果專案在子目錄中則設定為 `messenger-clone`
- **Build Command**: `prisma generate && next build`（應該自動偵測）
- **Output Directory**: `.next`（應該自動偵測）
- **Install Command**: `yarn install`（應該自動偵測）

#### 步驟 3：設定環境變數

在「Environment Variables」區塊：

1. 點擊「Add Environment Variable」
2. 逐個添加所有環境變數（參考上方的環境變數清單）
3. 確保為所有環境（Production、Preview、Development）設定變數
4. 點擊「Save」

#### 步驟 4：部署

點擊「Deploy」按鈕，Vercel 會自動：
1. 安裝依賴
2. 執行 `postinstall`（生成 Prisma Client）
3. 執行建置
4. 部署應用

#### 步驟 5：等待部署完成

部署過程約需 2-5 分鐘，您可以在部署頁面查看即時日誌。

---

## ⚙️ 重要設定

### 更新 OAuth 重新導向 URI

部署完成後，必須更新 OAuth 應用的重新導向 URI：

#### Facebook OAuth

1. 前往 [Facebook Developers](https://developers.facebook.com/)
2. 選擇您的應用
3. 進入「Facebook 登入」→「設定」
4. 在「有效的 OAuth 重新導向 URI」中添加：
   ```
   https://your-app-name.vercel.app/api/auth/callback/facebook
   https://your-app-name.vercel.app/api/auth/callback-setup
   ```

#### GitHub OAuth

1. 前往 [GitHub Settings](https://github.com/settings/developers)
2. 選擇您的 OAuth App
3. 更新「Authorization callback URL」為：
   ```
   https://your-app-name.vercel.app/api/auth/callback/github
   ```
4. 或為生產環境建立新的 OAuth App

### 更新 NEXTAUTH_URL

確保在 Vercel 環境變數中，`NEXTAUTH_URL` 設定為您的 Vercel 網址：

```env
NEXTAUTH_URL="https://your-app-name.vercel.app"
```

### MongoDB Atlas IP 白名單

確保 MongoDB Atlas 允許 Vercel 的 IP 存取：

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 進入「Network Access」
3. 添加 IP 或選擇「Allow Access from Anywhere」（開發/測試階段）

---

## 🔍 驗證部署

### 1. 檢查部署狀態

在 Vercel Dashboard 中查看：
- 部署是否成功
- 建置日誌是否有錯誤
- 環境變數是否正確載入

### 2. 測試功能

訪問您的 Vercel 網址，測試以下功能：

- [ ] 首頁可以正常載入
- [ ] 可以進行 Facebook OAuth 登入
- [ ] 可以進行 GitHub OAuth 登入
- [ ] 可以建立對話
- [ ] 可以發送訊息
- [ ] 即時訊息功能正常（Pusher）
- [ ] 圖片上傳功能正常（如使用 Cloudinary）

### 3. 檢查日誌

如有問題，查看 Vercel 的函數日誌：

```bash
vercel logs
```

或在 Vercel Dashboard 中查看「Functions」標籤。

---

## 🐛 常見問題

### Q: 建置失敗，顯示 Prisma 錯誤

**A:** 確保：
1. `postinstall` script 在 `package.json` 中正確設定
2. `DATABASE_URL` 環境變數已正確設定
3. Prisma schema 檔案存在且正確

### Q: 部署後無法連接資料庫

**A:** 檢查：
1. MongoDB Atlas IP 白名單是否包含 Vercel IP
2. `DATABASE_URL` 是否正確（注意使用者名稱和密碼）
3. MongoDB Atlas 叢集是否正常運行

### Q: OAuth 登入失敗

**A:** 確認：
1. OAuth 應用的重新導向 URI 已更新為 Vercel 網址
2. `NEXTAUTH_URL` 環境變數設定為正確的 Vercel 網址
3. OAuth Client ID 和 Secret 是否正確

### Q: Pusher 連線失敗

**A:** 檢查：
1. `PUSHER_KEY` 和 `NEXT_PUBLIC_PUSHER_KEY` 是否相同
2. `PUSHER_CLUSTER` 和 `NEXT_PUBLIC_PUSHER_CLUSTER` 是否相同
3. Pusher 應用是否啟用
4. 瀏覽器控制台是否有錯誤訊息

### Q: 圖片上傳失敗

**A:** 確認：
1. Cloudinary 環境變數是否正確設定
2. Cloudinary 帳號是否正常
3. 上傳檔案大小是否超過限制

### Q: 環境變數未生效

**A:** 
1. 確認環境變數名稱完全正確（區分大小寫）
2. 確認已為所有環境（Production、Preview、Development）設定
3. 重新部署應用以套用環境變數變更

---

## 📝 後續步驟

部署成功後：

1. **設定自訂網域**（可選）
   - 在 Vercel Dashboard 中進入專案設定
   - 進入「Domains」標籤
   - 添加您的自訂網域

2. **設定環境變數加密**
   - 對於敏感資料，考慮使用 Vercel 的環境變數加密功能

3. **監控和日誌**
   - 使用 Vercel Analytics 監控應用效能
   - 定期查看函數日誌以偵測問題

4. **持續部署**
   - 每次推送到主分支時，Vercel 會自動重新部署
   - 可以設定 Preview Deployments 用於測試

---

## 🔄 更新部署

當您更新代碼後：

### 使用 Git

```bash
git add .
git commit -m "更新功能"
git push origin main
```

Vercel 會自動觸發新的部署。

### 使用 CLI

```bash
vercel --prod
```

---

## 📚 相關資源

- [Vercel 文件](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [專案環境變數設定指南](./ENV_SETUP.md)

---

祝部署順利！🚀

