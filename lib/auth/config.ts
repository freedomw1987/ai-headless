/**
 * ==============================================
 *  Auth.js v5 Configuration (Sprint 23 升級)
 * ==============================================
 *
 * 對應：docs/prd/09-rbac.md §12.4 Q6 Sprint 23
 *
 * Sprint 23 變更:
 * - jwt() callback 從 session-cache 讀 permissions (60s TTL)
 * - cache miss → 查 DB → 寫回 cache
 * - session() callback 注入 token.permissions 到 session.user.permissions
 * - 失效策略:既有 session-cache + POST /api/admin/cache/invalidate
 *
 * 向下相容:
 * - session.user.role 仍存在 (Phase 1 識別用)
 * - Phase 2 hasDynamicPermission 仍透過 DB 查詢（session-cache 是輔助）
 * - Sprint 25: 純函式 hasPermission 已刪除,全部走動態版
 */

import NextAuth, { type DefaultSession } from 'next-auth';
/**
 * TD-509：
 * next-auth/jwt 的 import 是必要的 TS quirk —— TypeScript 只會
 * 為「已被引入的模組」處理 declare module augmentation。如果只在
 * 下方 `declare module 'next-auth/jwt'` 引用 JWT type，但卻沒有真的
 * 引入該模組，TypeScript 不會套用 augmentation，導致 `token.role`
 * 仍是 unknown。
 */
import type { JWT as _JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import type { Role } from './auth';
import { verifyPassword } from './password';
import { getCachedPermissions, setCachedPermissions } from './session-cache';

// ==============================================
// 模組類型增強：把 role + permissions 加到 Session.user
// ==============================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      permissions?: string[];
    } & DefaultSession['user'];
  }

  interface User {
    role?: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    permissions?: string[];
  }
}

// ==============================================
// NextAuth 配置
// ==============================================

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials.password) return null;
        const user = await db.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user || !user.isActive) return null;
        // US-102：bcrypt 驗證密碼
        if (!user.passwordHash) return null;
        const valid = await verifyPassword(String(credentials.password), user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: (user.role as Role) ?? 'viewer',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 第一次登入: user object 存在,設定 token.role + token.image + token.name
      if (user) {
        token.role = (user as { role?: Role }).role ?? 'viewer';
        // Sprint 29-3: 初次登入時帶上 image
        token.image = (user as { image?: string | null }).image ?? null;
        // TD-802: 初次登入時帶上 name
        token.name = (user as { name?: string | null }).name ?? null;
      }

      // Sprint 23: 從 session-cache 讀 permissions (避免每次重查 DB)
      if (token.sub) {
        // 1. 查快取
        const cached = getCachedPermissions(token.sub);

        // 2. cache miss → 查 DB → 寫回 cache
        if (!cached) {
          const fresh = await db.user.findUnique({
            where: { id: token.sub },
            select: {
              role: true,
              name: true, // TD-802: 取 name 讓用戶改名後即時生效
              image: true, // Sprint 29-3: 取 image 讓頭像修改即時生效
              roleRef: {
                select: {
                  id: true,
                  permissions: { select: { code: true } },
                },
              },
            },
          });
          if (fresh) {
            // Sprint 21 向後相容:即使 roleRef 為 null (TD-2 未 backfill) 也不崩潰
            const codes = new Set(fresh.roleRef?.permissions.map((p) => p.code) ?? []);
            const roleId = fresh.roleRef?.id ?? '';
            setCachedPermissions(token.sub, codes, roleId);
            token.role = (fresh.role as Role) ?? token.role;
            token.permissions = Array.from(codes);
            // TD-803: image + name 也只在 cache miss 時讀（接受 cache TTL 內的短暫 staleness）
            // 跟 role/permissions 一起查（不額外 query）
            token.image = fresh.image ?? null;
            token.name = fresh.name ?? null;
          }
        } else {
          // cache hit:直接序列化
          // TD-803: cache hit 時不再額外 query image/name（接受 staleness 到下次 cache miss）
          token.role = token.role ?? 'viewer';
          token.permissions = Array.from(cached.permissions);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as Role) ?? 'viewer';
        // Sprint 23: 注入 permissions 到 session.user
        session.user.permissions = Array.isArray(token.permissions) ? token.permissions : [];
        // Sprint 29-3: 帶上 image (頭像 URL)
        session.user.image = (token.image as string | null | undefined) ?? null;
        // TD-802: 帶上 name (用戶改名即時生效)
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
});
