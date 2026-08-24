/**
 * ==============================================
 *  Auth.js v5 Configuration
 * ==============================================
 *
 * 對應：docs/prd/03-auth.md
 *
 * Auth.js v5 (NextAuth.js v5 beta) 配置：
 * - 使用 Prisma Adapter（已有 User/Account/Session/VerificationToken model）
 * - Credentials Provider（email + password，未來可加 OAuth）
 * - JWT Session（無 DB 連線時 fallback）
 *
 * 注意：實際部署需要 NEXTAUTH_SECRET 環境變數 + 連線到 DB
 * 測試環境用 mock
 */

import NextAuth, { type DefaultSession } from 'next-auth';
/**
 * TD-509：
 * next-auth/jwt 的 import 是必要的 TS quirk —— TypeScript 只會
 * 為「已被引入的模組」處理 declare module augmentation。如果只在
 * 下方 `declare module 'next-auth/jwt'` 引用 JWT type，但卻沒有真的
 * 引入該模組，TypeScript 不會套用 augmentation，導致 `token.role`
 * 仍是 unknown。
 *
 * 變數名為 _JWT 是為讓 ESLint 的 no-unused-vars 認可（_ 前缀 = 故意不用）。
 * 保留為 type-only import，不參與 runtime（會被 TypeScript 自動消除）。
 */
import type { JWT as _JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import type { Role } from './auth';
import { verifyPassword } from './password';

// ==============================================
// 模組類型增強：把 role 加到 Session.user
// ==============================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role?: Role;
  }
}

/**
 * TD-509 補充：上方的 `import type { JWT as _JWT } from 'next-auth/jwt'` 不只是導入
 * 型別,更是讓 TypeScript 認得 next-auth/jwt 模組，從而套用下方這個 augmentation。
 * 如果刪了 import，下方 JWT.role 將不被識別。
 */
declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
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
        const valid = await verifyPassword(
          String(credentials.password),
          user.passwordHash,
        );
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
      if (user) {
        token.role = (user as { role?: Role }).role ?? 'viewer';
      }
      // US-102：每次請求都重新讀取最新的 role（讓 admin 升級 editor 立即生效）
      if (token.sub) {
        const fresh = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (fresh?.role) token.role = fresh.role as Role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as Role) ?? 'viewer';
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
});