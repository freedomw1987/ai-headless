// Sprint B2 (CRUD 列表頁增強 v1.1) — BatchDeleteDialog
//
// Client component，批次刪除確認對話框:
// - 列出前 5 筆預覽
// - 必須輸入「DELETE」才能啟用確認按鈕 (防止誤刪)
// - isDeleting 時所有按鈕 disable
//
// Gate 1 TDD: 見 tests/integration/crud-list-batch-delete-dialog.test.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Item = {
  id: string;
  label: string;
};

type Props = {
  open: boolean;
  items: Item[];
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
};

const REQUIRED_TEXT = 'DELETE';

export function BatchDeleteDialog({
  open,
  items,
  onConfirm,
  onCancel,
  isDeleting,
}: Props) {
  const [confirmText, setConfirmText] = useState('');
  const canConfirm = confirmText === REQUIRED_TEXT && !isDeleting;
  const previewItems = items.slice(0, 5);
  const extraCount = items.length - previewItems.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isDeleting) {
          setConfirmText('');
          onCancel();
        }
      }}
    >
      <DialogContent data-testid="batch-delete-dialog">
        <DialogHeader>
          <DialogTitle>批次刪除 {items.length} 筆資料？</DialogTitle>
          <DialogDescription>
            此操作無法復原。將永久刪除以下資料：
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1 text-sm border rounded-md p-3 bg-muted/30 max-h-[200px] overflow-y-auto">
          {previewItems.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">#{item.id}</span>
              <span className="truncate">{item.label}</span>
            </li>
          ))}
          {extraCount > 0 && (
            <li className="text-muted-foreground text-xs pt-1">
              ... 還有 {extraCount} 筆
            </li>
          )}
        </ul>

        <div className="space-y-2">
          <p className="text-sm">
            請輸入 <code className="font-mono font-bold text-destructive">{REQUIRED_TEXT}</code> 以確認刪除：
          </p>
          <Input
            data-testid="delete-confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={REQUIRED_TEXT}
            disabled={isDeleting}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            data-testid="delete-cancel-button"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canConfirm}
            data-testid="delete-confirm-button"
          >
            {isDeleting ? '刪除中...' : `確認刪除 ${items.length} 筆`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
