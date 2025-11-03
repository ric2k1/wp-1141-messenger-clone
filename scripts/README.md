# 腳本說明

## delete-user.sh / delete-user.ts

刪除使用者及其所有相關資料的腳本。

### 功能

此腳本會刪除：
- 使用者發送的所有訊息
- 使用者參與的所有一對一對話（DIRECT 類型，會完全刪除整個對話）
- 使用者參與的群組對話中的成員記錄（GROUP 類型，對話保留但移除該使用者）
- 使用者建立的所有對話（會連帶刪除對話中的訊息、成員和系統訊息）
- 與使用者相關的系統訊息（包含該使用者 ID 的系統訊息）
- 使用者帳號本身

**重要說明：**
- **一對一對話（DIRECT）**：如果使用者參與的對話是 DIRECT 類型且只有兩個成員，整個對話會被完全刪除（包括對話中的訊息、成員記錄和系統訊息）
- **群組對話（GROUP）**：只會移除該使用者的成員記錄，對話本身和其他成員的資料會保留

### 使用方法

#### 方法 1：使用 Shell Script（推薦）

```bash
./scripts/delete-user.sh <userId|alias|email>
```

#### 方法 2：直接使用 TypeScript 腳本

```bash
yarn tsx scripts/delete-user.ts <userId|alias|email>
```

### 參數說明

可以使用以下任一方式識別使用者：
- **使用者 ID**：MongoDB ObjectId（24 位十六進位字串）
- **別名 (alias)**：使用者的唯一別名
- **電子郵件 (email)**：使用者的電子郵件地址

### 範例

```bash
# 使用別名刪除
./scripts/delete-user.sh user123

# 使用電子郵件刪除
./scripts/delete-user.sh user@example.com

# 使用使用者 ID 刪除
./scripts/delete-user.sh 507f1f77bcf86cd799439011
```

### 注意事項

⚠️ **警告**：此操作無法復原！執行前請確認：
1. 已備份重要資料
2. 確認要刪除的使用者識別碼正確
3. 了解刪除操作會影響：
   - 該使用者發送的所有訊息
   - 該使用者參與的所有一對一對話（會完全刪除）
   - 該使用者參與的群組對話（只移除該使用者）
   - 該使用者建立的所有對話（會完全刪除）
   - 其他使用者與該使用者的一對一聊天記錄也會被刪除

### 前置需求

- 已設定 `.env` 檔案並包含有效的 `DATABASE_URL`
- 已安裝專案依賴（`yarn install`）
- 已生成 Prisma Client（`yarn prisma generate`）

腳本會自動檢查並安裝必要的工具（如 `tsx`）。

