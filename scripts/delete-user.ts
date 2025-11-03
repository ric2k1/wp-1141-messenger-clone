#!/usr/bin/env node

/**
 * 刪除使用者及其所有相關資料的腳本
 * 
 * 此腳本會刪除：
 * 1. 使用者發送的所有訊息
 * 2. 使用者參與的所有一對一對話（DIRECT 類型，會完全刪除整個對話）
 * 3. 使用者參與的群組對話中的成員記錄（GROUP 類型，對話保留但移除該使用者）
 * 4. 使用者建立的所有對話（會 cascade 刪除對話中的訊息和成員）
 * 5. 與使用者相關的 SystemMessage（包含該使用者 ID 的系統訊息）
 * 6. 使用者帳號本身
 * 
 * 重要：一對一對話（DIRECT 且只有兩個成員）會被完全刪除，
 * 這意味著其他使用者與該使用者的一對一聊天記錄也會被刪除。
 * 
 * 使用方法：
 * yarn tsx scripts/delete-user.ts <userId|alias|email>
 * 或
 * node --loader ts-node/esm scripts/delete-user.ts <userId|alias|email>
 */

// 注意：Prisma 會自動從 .env 檔案讀取 DATABASE_URL
// 確保在執行此腳本前，.env 檔案已正確設定

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function deleteUser(userIdentifier: string) {
  try {
    console.log(`🔍 正在搜尋使用者: ${userIdentifier}...`);
    
    // 嘗試用不同的方式找到使用者
    let user = null;
    
    // 嘗試用 ID 查找
    if (userIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await prisma.user.findUnique({
        where: { id: userIdentifier },
      });
    }
    
    // 如果沒找到，嘗試用 alias 查找
    if (!user) {
      user = await prisma.user.findUnique({
        where: { alias: userIdentifier },
      });
    }
    
    // 如果還是沒找到，嘗試用 email 查找
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: userIdentifier },
      });
    }
    
    let userId: string;
    
    if (!user) {
      console.warn(`⚠️  警告: 找不到使用者: ${userIdentifier}`);
      console.log(`   將嘗試查找並清理可能存在的相關對話記錄...`);
      console.log('');
      
      // 如果識別碼看起來像 ObjectId，嘗試直接用它作為 userId 查找對話
      if (userIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
        userId = userIdentifier;
        console.log(`   使用識別碼作為使用者 ID 進行查找: ${userId}`);
      } else {
        // 如果不是 ID 格式，無法繼續查找（因為對話記錄是通過 userId 關聯的）
        console.error(`❌ 無法繼續：識別碼 "${userIdentifier}" 不是有效的使用者 ID，且找不到對應的使用者。`);
        console.error(`   如果是別名或電子郵件，請確認使用者是否存在於資料庫中。`);
        console.error(`   提示：如果知道使用者 ID，可以直接使用 ID 來查找並清理相關對話。`);
        process.exit(1);
      }
    } else {
      userId = user.id;
      console.log(`✅ 找到使用者:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   別名: ${user.alias}`);
      console.log(`   電子郵件: ${user.email || '無'}`);
      console.log(`   名稱: ${user.name || '無'}`);
      console.log('');
    }
    
    // 統計相關資料
    const messageCount = await prisma.message.count({
      where: { senderId: userId },
    });
    
    const conversationMemberCount = await prisma.conversationMember.count({
      where: { userId: userId },
    });
    
    const createdConversationCount = await prisma.conversation.count({
      where: { creatorId: userId },
    });
    
    // 找出使用者參與的所有對話成員記錄
    const allConversationMembers = await prisma.conversationMember.findMany({
      where: { 
        userId: userId,
      },
      include: {
        conversation: {
          include: {
            members: true,
          },
        },
      },
    });
    
    // 過濾出不是使用者建立的對話（使用者建立的對話會在步驟 4 單獨處理）
    const participatedConversations = allConversationMembers.filter(
      cm => cm.conversation.creatorId !== userId
    );
    
    // 找出 DIRECT 類型的對話（只有兩個成員的一對一聊天）
    const directConversations = participatedConversations.filter(
      cm => cm.conversation.type === 'DIRECT' && cm.conversation.members.length === 2
    );
    
    const directConversationCount = directConversations.length;
    const groupConversationCount = participatedConversations.length - directConversationCount;
    
    // 計算包含該使用者的 SystemMessage（userId 欄位）
    const systemMessageCount = await prisma.systemMessage.count({
      where: { userId: userId },
    });
    
    console.log(`📊 相關資料統計:`);
    console.log(`   發送的訊息: ${messageCount} 則`);
    console.log(`   參與的對話: ${conversationMemberCount} 個`);
    console.log(`   - 一對一對話 (DIRECT): ${directConversationCount} 個（將被完全刪除）`);
    console.log(`   - 群組對話 (GROUP): ${groupConversationCount} 個（只移除成員記錄）`);
    console.log(`   建立的對話: ${createdConversationCount} 個`);
    console.log(`   相關系統訊息: ${systemMessageCount} 則`);
    console.log('');
    
    // 確認刪除
    console.log(`⚠️  警告: 此操作將永久刪除以上所有資料！`);
    console.log(`   這包括：`);
    console.log(`   - 使用者發送的所有訊息`);
    console.log(`   - 使用者參與的所有一對一對話（DIRECT，將完全刪除整個對話）`);
    console.log(`   - 使用者參與的群組對話中的成員記錄（GROUP，對話保留但移除該使用者）`);
    console.log(`   - 使用者建立的所有對話（會連帶刪除對話中的訊息和成員）`);
    console.log(`   - 與使用者相關的系統訊息`);
    console.log(`   - 使用者帳號本身`);
    console.log('');
    
    // 開始刪除流程
    console.log(`🗑️  開始刪除流程...`);
    console.log('');
    
    // 獲取使用者建立的對話 ID 列表（這些對話會被完全刪除）
    const createdConversationIds = await prisma.conversation.findMany({
      where: { creatorId: userId },
      select: { id: true },
    }).then(convs => convs.map(c => c.id));
    
    // 獲取需要完全刪除的 DIRECT 對話 ID 列表（一對一對話）
    const directConversationIds = directConversations.map(cm => cm.conversationId);
    
    // 合併所有需要完全刪除的對話 ID（使用者建立的 + 一對一對話）
    const allConversationsToDelete = [...new Set([...createdConversationIds, ...directConversationIds])];
    
    // 1. 刪除使用者發送的訊息（排除會被整體刪除的對話中的訊息）
    if (messageCount > 0) {
      console.log(`   1. 刪除使用者發送的訊息...`);
      let deletedMessages;
      if (allConversationsToDelete.length > 0) {
        // 只刪除不會被整體刪除的對話中的訊息
        deletedMessages = await prisma.message.deleteMany({
          where: {
            senderId: userId,
            conversationId: { notIn: allConversationsToDelete },
          },
        });
      } else {
        deletedMessages = await prisma.message.deleteMany({
          where: { senderId: userId },
        });
      }
      console.log(`      ✅ 已刪除 ${deletedMessages.count} 則訊息`);
    }
    
    // 2. 刪除 ConversationMember 記錄（排除會被整體刪除的對話中的成員）
    if (conversationMemberCount > 0) {
      console.log(`   2. 刪除對話成員記錄...`);
      let deletedMembers;
      if (allConversationsToDelete.length > 0) {
        // 只刪除不會被整體刪除的對話中的成員記錄（主要是 GROUP 對話）
        deletedMembers = await prisma.conversationMember.deleteMany({
          where: {
            userId: userId,
            conversationId: { notIn: allConversationsToDelete },
          },
        });
      } else {
        deletedMembers = await prisma.conversationMember.deleteMany({
          where: { userId: userId },
        });
      }
      console.log(`      ✅ 已刪除 ${deletedMembers.count} 個成員記錄`);
    }
    
    // 3. 刪除與使用者相關的 SystemMessage（userId 欄位，排除會被整體刪除的對話中的系統訊息）
    if (systemMessageCount > 0) {
      console.log(`   3. 刪除系統訊息...`);
      let deletedSystemMessages;
      if (allConversationsToDelete.length > 0) {
        // 只刪除不會被整體刪除的對話中的系統訊息（userId 欄位指向該使用者的）
        deletedSystemMessages = await prisma.systemMessage.deleteMany({
          where: {
            userId: userId,
            conversationId: { notIn: allConversationsToDelete },
          },
        });
      } else {
        deletedSystemMessages = await prisma.systemMessage.deleteMany({
          where: { userId: userId },
        });
      }
      console.log(`      ✅ 已刪除 ${deletedSystemMessages.count} 則系統訊息`);
    }
    
    // 4. 刪除使用者建立的所有對話（會 cascade 刪除對話中的訊息、成員和系統訊息）
    if (createdConversationCount > 0) {
      console.log(`   4. 刪除使用者建立的對話...`);
      for (const convId of createdConversationIds) {
        // 獲取對話中的訊息數量
        const msgCount = await prisma.message.count({
          where: { conversationId: convId },
        });
        const memberCount = await prisma.conversationMember.count({
          where: { conversationId: convId },
        });
        const sysMsgCount = await prisma.systemMessage.count({
          where: { conversationId: convId },
        });
        
        // 獲取對話類型
        const conv = await prisma.conversation.findUnique({
          where: { id: convId },
          select: { type: true },
        });
        
        // 刪除對話（會 cascade 刪除相關資料）
        await prisma.conversation.delete({
          where: { id: convId },
        });
        
        console.log(`      ✅ 已刪除對話 ${convId} (${conv?.type})（包含 ${msgCount} 則訊息、${memberCount} 個成員、${sysMsgCount} 則系統訊息）`);
      }
    }
    
    // 5. 刪除包含該使用者的所有一對一對話（DIRECT）
    if (directConversationCount > 0) {
      console.log(`   5. 刪除包含該使用者的一對一對話...`);
      for (const convId of directConversationIds) {
        // 獲取對話中的訊息數量
        const msgCount = await prisma.message.count({
          where: { conversationId: convId },
        });
        const memberCount = await prisma.conversationMember.count({
          where: { conversationId: convId },
        });
        const sysMsgCount = await prisma.systemMessage.count({
          where: { conversationId: convId },
        });
        
        // 獲取對話的另一個成員資訊
        const otherMember = await prisma.conversationMember.findFirst({
          where: {
            conversationId: convId,
            userId: { not: userId },
          },
          include: {
            user: {
              select: { alias: true, name: true },
            },
          },
        });
        
        // 刪除對話（會 cascade 刪除相關資料）
        await prisma.conversation.delete({
          where: { id: convId },
        });
        
        const otherUserInfo = otherMember?.user 
          ? `${otherMember.user.alias}${otherMember.user.name ? ` (${otherMember.user.name})` : ''}`
          : '未知使用者';
        
        console.log(`      ✅ 已刪除一對一對話 ${convId}（與 ${otherUserInfo}，包含 ${msgCount} 則訊息、${memberCount} 個成員、${sysMsgCount} 則系統訊息）`);
      }
    }
    
    // 6. 最後刪除使用者本身（如果使用者存在）
    if (user) {
      console.log(`   6. 刪除使用者帳號...`);
      await prisma.user.delete({
        where: { id: userId },
      });
      console.log(`      ✅ 已刪除使用者帳號`);
      console.log('');
    } else {
      console.log(`   6. 跳過使用者帳號刪除（使用者不存在）`);
      console.log('');
    }
    
    console.log(`✅ 成功刪除使用者及其所有相關資料！`);
    
  } catch (error) {
    console.error(`❌ 發生錯誤:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 主程式
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.error('❌ 請提供使用者識別碼（ID、alias 或 email）');
  console.error('');
  console.error('使用方法:');
  console.error('  yarn tsx scripts/delete-user.ts <userId|alias|email>');
  console.error('');
  console.error('範例:');
  console.error('  yarn tsx scripts/delete-user.ts user123');
  console.error('  yarn tsx scripts/delete-user.ts user@example.com');
  console.error('  yarn tsx scripts/delete-user.ts 507f1f77bcf86cd799439011');
  process.exit(1);
}

deleteUser(userIdentifier);

