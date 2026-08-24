'use client';

/**
 * ==============================================
 *  RichTextEditor — Tiptap 富文本編輯器組件
 * ==============================================
 *
 * 對應：docs/specs/json-spec.md §3.2.3 (richText 類型)
 *       docs/prd/04-blog.md FR-2 (富文本編輯)
 *
 * 用於取代原 ui-generator 對 `text-long` / `richText` 欄位生成的 Textarea。
 *
 * 功能：
 * - 工具欄：粗體 / 斜體 / 標題 / 項目符號 / 編號列表 / 連結
 * - 雙向綁定（HTML string ↔ Tiptap state）
 * - placeholder 支援
 */

import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { Bold, Italic, Heading1, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = '請輸入內容...',
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm min-h-[200px] max-w-none p-3 focus:outline-none',
          '[&_p]:my-2 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg',
        ),
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // 外部 value 變動時同步
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={cn('rounded-md border bg-muted/30 p-4', className)}>
        <p className="text-sm text-muted-foreground">載入編輯器...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring',
        disabled && 'opacity-50',
        className,
      )}
    >
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1">
      <ToolbarButton
        label="粗體"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={disabled}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="斜體"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={disabled}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="標題"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        disabled={disabled}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="項目符號"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={disabled}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="編號列表"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={disabled}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="連結"
        onClick={() => {
          const url = window.prompt('連結 URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        disabled={disabled}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  isActive,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isActive}
      className={cn('h-7 w-7 p-0', isActive && 'bg-accent text-accent-foreground')}
    >
      {children}
    </Button>
  );
}

// Re-export for tests
import { EditorContent } from '@tiptap/react';