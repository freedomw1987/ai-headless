'use client';

/**
 * AdminShell — 把 AdminSidebar + main 包在一起，共享 mobile sidebar toggle state。
 *
 * 設計動機（Sprint 32 RWD）：
 * - 漢堡按鈕需要跟 sidebar 共享 isMobileOpen state
 * - 漢堡按鈕放在 main 頂部 header（用 flex 自然排版），不是 fixed 浮動
 * - 漢堡跟 sidebar 都在同一個 client component tree 內
 */

import { ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './admin-sidebar';
import { AdminFab } from './_components/admin-fab';
import { AdminChatDialog } from './_components/admin-chat-dialog';
import type { AuthUser } from '@/lib/auth/auth';
import type { ExtensionNavItem } from '@/lib/extensions/extension-nav';

export function AdminShell({
  user,
  enabledExtensions,
  extensionNavItems,
  children,
}: {
  user: AuthUser;
  enabledExtensions: string[];
  extensionNavItems: ExtensionNavItem[];
  children: ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // Sprint 44 Commit E

  return (
    <div className="min-h-screen bg-muted/30 flex min-w-0">
      <AdminSidebar
        user={user}
        enabledExtensions={enabledExtensions}
        extensionNavItems={extensionNavItems}
        isMobileOpen={isMobileOpen}
        onMobileOpenChange={setIsMobileOpen}
      />
      <main className="min-w-0 flex-1 sm:pl-64">
        <div className="container px-4 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {/* Mobile 漢堡按鈕：放在 main 頂部 header，inline 而非 fixed，永遠不擋內容 */}
          <div className="flex items-center gap-3 mb-4 sm:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 bg-background border shadow-sm hover:bg-accent"
              aria-label="開啟選單"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm text-muted-foreground">選單</span>
          </div>
          {children}
        </div>
      </main>
      {/* Sprint 44 Commit D: Admin AI Chat FAB (admin-only, 可拖動) */}
      <AdminFab user={user} onClick={() => setIsChatOpen(true)} />
      {/* Sprint 44 Commit E: Admin AI Chat Dialog (admin-only) */}
      <AdminChatDialog
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        userId={user.id}
      />
    </div>
  );
}
