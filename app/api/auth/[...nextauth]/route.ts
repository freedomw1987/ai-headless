/**
 * US-102 — Auth.js v5 handler endpoint
 * NextAuth() 必須掛在 /api/auth/[...nextauth] 才能讓 next-auth/react 的 signIn/signOut 運作
 */

import { handlers } from '@/lib/auth/config';

export const { GET, POST } = handlers;