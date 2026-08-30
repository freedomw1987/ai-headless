// Sprint 29-3 — Settings Form (Client Component)
//
// /admin/settings 頁面的 client form：
// - Profile 區：name + image URL 編輯（email/role 唯讀）
// - Change Password 區：currentPassword + newPassword
// - 提交時呼叫 PATCH /api/profile/me
//
// Gate 1 TDD: 見 tests/integration/settings-page.test.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuthUser } from '@/lib/auth/auth';

type Props = {
  user: AuthUser;
};

export function SettingsForm({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile state
  const [name, setName] = useState(user.name ?? '');
  const [image, setImage] = useState(user.image ?? '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function handleProfileSave() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorMessage(json.error ?? '更新失敗');
          return;
        }
        toast.success('Profile 已更新');
        router.refresh();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  async function handlePasswordSave() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorMessage(json.error ?? '變更失敗');
          return;
        }
        toast.success('密碼已變更');
        setCurrentPassword('');
        setNewPassword('');
        router.refresh();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div
          data-testid="settings-error-message"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {/* Profile 區 */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>編輯你的顯示名稱與頭像</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              value={user.email}
              disabled
              data-testid="settings-email-display"
            />
            <p className="text-xs text-muted-foreground">
              Email 不可變更。如需修改請聯絡管理員。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-name">顯示名稱</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入你的顯示名稱"
              data-testid="settings-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-image">頭像 URL</Label>
            <Input
              id="settings-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              data-testid="settings-image-input"
            />
            <p className="text-xs text-muted-foreground">
              留空顯示字母頭像
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div
              data-testid="settings-role-display"
              className="text-sm text-muted-foreground"
            >
              {user.role}
            </div>
          </div>

          <Button
            onClick={handleProfileSave}
            disabled={isPending}
            data-testid="settings-profile-save"
          >
            儲存 Profile
          </Button>
        </CardContent>
      </Card>

      {/* Change Password 區 */}
      <Card>
        <CardHeader>
          <CardTitle>變更密碼</CardTitle>
          <CardDescription>需輸入目前的密碼才能變更</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-current-password">目前的密碼</Label>
            <Input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="輸入目前密碼"
              data-testid="settings-current-password-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-new-password">新密碼</Label>
            <Input
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 6 字"
              data-testid="settings-new-password-input"
            />
          </div>

          <Button
            onClick={handlePasswordSave}
            disabled={isPending || !currentPassword || !newPassword}
            data-testid="settings-password-save"
          >
            變更密碼
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}