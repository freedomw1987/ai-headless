# PRD: Auth & RBAC (Module 2)

> **模組代號**：M2
> **模組名稱**：Auth & RBAC
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 1

---

## 1. 模組概述

### 1.1 模組目標

M2（Auth & RBAC）提供 ai-headless 框架的**用戶管理與權限控制**。包含：

1. **認證（Authentication）**：用戶登入/登出、Session 管理
2. **用戶管理（User CRUD）**：管理員可 CRUD 用戶
3. **角色管理（Role Management）**：內建角色 + 自定義角色
4. **權限控制（RBAC）**：細粒度權限（per action）
5. **中間件（Middleware）**：API 路由保護

### 1.2 模組邊界

| 屬於 M2 | 不屬於 M2 |
|---|---|
| 用戶 CRUD | Blog（M3） |
| 登入/登出 | AI 配置（M4） |
| Session 管理 | Extension 系統（M6） |
| RBAC 權限檢查 | AI Pipeline（M1） |
| 認證中間件 |  |

### 1.3 依賴關係

- **依賴**：M1（Framework Core — 共用組件、規範）
- **被依賴**：M3、M5、M6

---

## 2. 功能清單（Functional Requirements）

### 2.1 FR-1：用戶認證

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | Email + Password 登入 | P0 | 2 |
| FR-1.2 | OAuth 登入（Google、GitHub） | P1 | 3 |
| FR-1.3 | Session 管理（JWT + Database） | P0 | 2 |
| FR-1.4 | 登出 | P0 | 1 |
| FR-1.5 | 註冊（可選，預設關閉） | P1 | 2 |
| FR-1.6 | 忘記密碼 / 重設密碼 | P2 | 2 |

### 2.2 FR-2：用戶管理

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | 用戶列表（DataTable） | P0 | 2 |
| FR-2.2 | 新增用戶 | P0 | 2 |
| FR-2.3 | 編輯用戶 | P0 | 2 |
| FR-2.4 | 刪除用戶（軟刪除） | P0 | 1 |
| FR-2.5 | 查看用戶詳情 | P0 | 1 |
| FR-2.6 | 分配角色 | P0 | 2 |
| FR-2.7 | 用戶搜尋 / 篩選 / 分頁 | P0 | 1 |

### 2.3 FR-3：角色管理

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | 內建角色（admin、editor、viewer） | P0 | 1 |
| FR-3.2 | 自定義角色 | P1 | 3 |
| FR-3.3 | 角色 CRUD | P1 | 2 |
| FR-3.4 | 角色權限配置（permission matrix） | P0 | 3 |
| FR-3.5 | 預設角色權限 seed | P0 | 1 |

### 2.4 FR-4：權限檢查（RBAC）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | permission 格式：`<resource>.<action>` | P0 | 1 |
| FR-4.2 | `requirePermission(user, action)` helper | P0 | 2 |
| FR-4.3 | `checkPermission(user, action)` helper | P0 | 1 |
| FR-4.4 | API middleware 自動檢查 | P0 | 2 |
| FR-4.5 | UI 條件渲染（沒權限就隱藏） | P0 | 2 |
| FR-4.6 | 用戶個人資料頁（看自己的權限） | P1 | 1 |

### 2.5 FR-5：JSON 規範

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-5.1 | `user.json` schema | P0 | 已完成（在框架初始化時生成）|
| FR-5.2 | `role.json` schema | P0 | 已完成 |
| FR-5.3 | `permission.json` schema | P0 | 已完成 |

---

## 3. 非功能需求（Non-Functional Requirements）

### 3.1 安全

- **密碼雜湊**：bcrypt（cost factor ≥ 10）
- **Session 過期**：24 小時自動過期
- **CSRF 防護**：NextAuth + SameSite cookies
- **Rate Limiting**：登入 API 限制每 IP 每分鐘 5 次
- **SQL 注入防護**：Prisma 自動防護
- **XSS 防護**：React 自動轉義

### 3.2 性能

- **登入時間**：< 500ms
- **權限檢查時間**：< 50ms（單個檢查）
- **用戶列表載入**：< 200ms（100 個用戶）

### 3.3 可用性

- **錯誤訊息**：用戶面向的錯誤訊息用繁體中文
- **登入表單**：顯示密碼強度
- **密碼要求**：≥ 8 字元，含字母 + 數字

### 3.4 可擴展性

- **OAuth Provider**：易於新增（NextAuth config）
- **角色**：易於新增自定義角色
- **權限**：JSON 可配置，無需改代碼

---

## 4. 介面設計

### 4.1 認證流程

```
[用戶] 訪問 /admin/users
   ↓
[Next.js Middleware] 檢查 session
   ├─ 有 session → 繼續
   └─ 無 session → 重定向 /login
   ↓
[用戶] 填 Email + Password
   ↓
[POST /api/auth/signin] 呼叫 Auth.js
   ├─ 成功 → 建立 session → 重定向 /admin
   └─ 失敗 → 顯示錯誤
   ↓
[用戶] 看到後台首頁
```

### 4.2 RBAC 檢查流程

```
[用戶] 點擊「刪除用戶」按鈕
   ↓
[UI] 檢查 user.permissions 包含 'user.delete'
   ├─ 有權限 → 顯示按鈕
   └─ 無權限 → 隱藏按鈕
   ↓
[用戶] 點擊 → 呼叫 DELETE /api/admin/users/[id]
   ↓
[API Middleware] 呼叫 requirePermission(user, 'user.delete')
   ├─ 有權限 → 執行刪除
   └─ 無權限 → 回 403 Forbidden
```

### 4.3 核心 API

```typescript
// lib/auth/options.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 1. 查詢用戶
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: { include: { permissions: true } } },
        });
        
        // 2. 驗證密碼
        if (!user || !await bcrypt.compare(credentials.password, user.passwordHash)) {
          return null;
        }
        
        // 3. 回傳用戶（含權限）
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          permissions: user.role.permissions.map(p => p.action),
        };
      },
    }),
    GoogleProvider({ /* ... */ }),
    GitHubProvider({ /* ... */ }),
  ],
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.permissions = user.permissions;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.permissions = token.permissions;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

```typescript
// lib/rbac/guard.ts
export async function checkPermission(
  user: User,
  action: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;  // admin 萬能
  return user.permissions?.includes(action) ?? false;
}

export async function requirePermission(
  user: User,
  action: string
): Promise<void> {
  if (!await checkPermission(user, action)) {
    throw new ForbiddenError(`Missing permission: ${action}`);
  }
}
```

### 4.4 Middleware

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // 已通過認證，繼續
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)'],
};
```

### 4.5 UI 條件渲染

```tsx
// components/admin/user-button.tsx
'use client';

import { useSession } from 'next-auth/react';
import { checkPermission } from '@/lib/rbac/guard';

export function DeleteUserButton({ userId }: { userId: string }) {
  const { data: session } = useSession();
  
  if (!checkPermission(session?.user, 'user.delete')) {
    return null;  // 沒權限就不渲染
  }
  
  return <Button variant="danger">刪除</Button>;
}
```

---

## 5. 資料模型

### 5.1 Prisma Schema

```prisma
// 用戶
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  image         String?
  emailVerified DateTime?
  roleId        String
  role          Role      @relation(fields: [roleId], references: [id])
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?  // 軟刪除
  
  @@index([email])
  @@index([roleId])
  @@map("users")
}

// 角色
model Role {
  id          String       @id @default(cuid())
  name        String       @unique  // "admin", "editor", "viewer"
  displayName String       // "管理員", "編輯者", "訪客"
  description String?
  isSystem    Boolean      @default(false)  // 系統內建角色不可刪
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@map("roles")
}

// 權限
model Permission {
  id     String @id @default(cuid())
  action String // e.g., "user.create", "user.delete", "blog.read"
  roleId String
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([action, roleId])
  @@index([action])
  @@map("permissions")
}

// Session
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
  
  @@map("sessions")
}

// Verification Token（用於密碼重設）
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### 5.2 內建角色 seed

```typescript
// prisma/seed.ts
const BUILTIN_ROLES = [
  {
    name: 'admin',
    displayName: '管理員',
    description: '擁有所有權限',
    isSystem: true,
    permissions: ['*'],  // 萬能
  },
  {
    name: 'editor',
    displayName: '編輯者',
    description: '可編輯大部分內容',
    isSystem: true,
    permissions: [
      'user.read',
      'blog.read', 'blog.create', 'blog.update', 'blog.delete',
      'todo.read', 'todo.create', 'todo.update',
      // 不可刪除用戶
    ],
  },
  {
    name: 'viewer',
    displayName: '訪客',
    description: '只讀',
    isSystem: true,
    permissions: [
      'blog.read',
      'todo.read',
      'user.read',
    ],
  },
];
```

---

## 6. 使用者故事

### 6.1 US-M2-01：用戶登入

> **作為** 終端用戶
> **我想要** 用 Email + 密碼登入
> **以便** 進入後台管理系統

**驗收標準**：
- [ ] 提供 `/login` 頁面
- [ ] 輸入正確 Email + 密碼 → 進入後台
- [ ] 輸入錯誤 → 顯示紅字提示
- [ ] Session 24 小時後過期
- [ ] 支援「記住我」（可選）

### 6.2 US-M2-02：OAuth 登入

> **作為** 用戶
> **我想要** 用 Google 或 GitHub 登入
> **以便** 不用記住密碼

**驗收標準**：
- [ ] 登入頁提供 Google / GitHub 按鈕
- [ ] 點擊 → 跳轉 OAuth provider
- [ ] 回調後建立帳號（首次）或登入（重複）
- [ ] Email 自動驗證

### 6.3 US-M2-03：用戶管理

> **作為** 管理員
> **我想要** CRUD 用戶
> **以便** 管理誰能訪問系統

**驗收標準**：
- [ ] `/admin/users` 列出所有用戶
- [ ] 可新增用戶（填 Email、姓名、密碼、角色）
- [ ] 可編輯用戶（改姓名、角色）
- [ ] 可軟刪除用戶（不可刪除自己）
- [ ] 可重設密碼

### 6.4 US-M2-04：角色管理

> **作為** 管理員
> **我想要** 自定義角色
> **以便** 給不同部門不同權限

**驗收標準**：
- [ ] `/admin/roles` 列出所有角色
- [ ] 可新增角色（名稱、權限清單）
- [ ] 可編輯角色的權限（checkbox matrix）
- [ ] 不可刪除系統內建角色
- [ ] 不可刪除有使用者的角色

### 6.5 US-M2-05：權限檢查

> **作為** 用戶
> **我想要** 看不到我沒權限的功能
> **以便** 避免誤操作

**驗收標準**：
- [ ] 沒權限的按鈕自動隱藏
- [ ] 沒權限的 API 回 403
- [ ] 沒權限的選單項不顯示
- [ ] 直接訪問沒權限的 URL → 重定向 403 頁

---

## 7. 測試計劃

### 7.1 單元測試

- [ ] `checkPermission`：各種角色 × 各種權限的組合
- [ ] `requirePermission`：有權限 / 無權限
- [ ] 密碼雜湊 / 驗證
- [ ] Session 過期邏輯

### 7.2 整合測試

- [ ] 登入 → 看到後台
- [ ] 登出 → 重定向登入頁
- [ ] 用戶 CRUD 完整流程
- [ ] 角色權限變更後即時生效

### 7.3 E2E 測試（Playwright）

- [ ] 新用戶註冊 → 登入 → 看到 dashboard
- [ ] 管理員新增用戶 → 該用戶登入 → 看到正確權限
- [ ] 沒權限的用戶看不到 /admin/users
- [ ] 密碼重設流程

### 7.4 安全測試

- [ ] SQL 注入嘗試（Prisma 應防護）
- [ ] XSS 嘗試（React 應轉義）
- [ ] CSRF 嘗試（SameSite cookies 應防護）
- [ ] Brute force 攻擊（rate limiting 應生效）

---

## 8. 開發計劃

### Sprint 1（本 Sprint）

| Task | FR | SP |
|---|---|---|
| Prisma schema（User/Role/Permission/Session） | — | 2 |
| Database migration | — | 1 |
| Seed 內建角色 | FR-3.5 | 1 |
| Auth.js 配置 | FR-1.1, FR-1.3 | 2 |
| `/login` 頁面 | FR-1.1 | 1 |
| Middleware（API 保護） | FR-4.4 | 1 |
| `checkPermission` / `requirePermission` helpers | FR-4.2, FR-4.3 | 1 |
| 用戶列表頁 | FR-2.1 | 2 |
| 新增 / 編輯用戶頁 | FR-2.2, FR-2.3 | 2 |
| 角色管理頁 | FR-3.4 | 3 |
| 單元測試 | — | 2 |
| E2E 測試 | — | 2 |

**總計**：21 SP

### Sprint 2

| Task | FR | SP |
|---|---|---|
| OAuth 登入（Google、GitHub） | FR-1.2 | 3 |
| 自定義角色 CRUD | FR-3.2, FR-3.3 | 2 |
| 註冊流程 | FR-1.5 | 2 |
| 密碼重設 | FR-1.6 | 2 |

---

## 9. 風險與緩解

| 風險 | 影響 | 緩解策略 |
|---|---|---|
| OAuth 配置複雜 | 中 | 用 NextAuth 內建 provider，參考官方文檔 |
| 權限漏洞 | 高 | TDD 寫所有權限場景 + E2E 測試 + 安全審查 |
| Session 過期時間設定 | 低 | 預設 24h，可在 config 中調整 |
| 用戶刪除的級聯問題 | 中 | 用軟刪除（deletedAt），不級聯刪除 |

---

## 10. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📝 [JSON 功能規範](../specs/json-spec.md)
- 🔌 [Extension 開發規範](../specs/extension-spec.md)
- 📋 [M1 PRD](./01-framework-core.md)
- 📊 [Backlog](../backlog.md)

---

**模組負責人**：TBD
**開發負責人**：TBD
**測試負責人**：TBD