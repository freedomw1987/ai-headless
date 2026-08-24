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
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import type { Role } from './auth';

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

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
  }
}

// Re-augment locally so TS can resolve it (next-auth/jwt only re-exports from @auth/core/jwt)
type _JwtWithRole = JWT & { role?: Role };

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
        if (!credentials?.email) return null;
        // 簡化版：實際部署需要 bcrypt 密碼驗證
        const user = await db.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user || !user.isActive) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: 'viewer', // 預設角色（實際從 DB 讀取）
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? 'viewer';
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