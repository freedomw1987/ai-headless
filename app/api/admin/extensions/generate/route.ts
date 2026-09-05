/**
 * POST /api/admin/extensions/generate
 *
 * Admin-only endpoint to generate an extension from admin chat slash command.
 *
 * Sprint 55 (FR-22.1):
 * - 接收 { name, fields, force } 參數
 * - 透過 ExtensionTemplate.generate() 產 8 個檔案
 * - 透過 processExtensionGeneration() 三層驗證
 * - 成功寫入磁碟, 回傳檔案清單
 */

import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { generateExtensionTemplate } from '@/lib/ai/agent-sdk/extension-template';
import { processExtensionGeneration } from '@/lib/ai/agent-sdk/extension-tool-wrapper';

interface RequestBody {
  name?: string;
  fields?: string[];
  force?: boolean;
}

export async function POST(req: NextRequest) {
  // 1. Auth check
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 2. Parse body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, fields = [], force = false } = body;

  // 3. Validate name (kebab-case)
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "name"' }, { status: 400 });
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return NextResponse.json(
      { error: 'Invalid extension name (must be kebab-case, lowercase letters/numbers/dashes)' },
      { status: 400 },
    );
  }

  // 4. Check overwrite
  const manifestPath = `extensions/${name}/manifest.json`;
  if (existsSync(manifestPath) && !force) {
    return NextResponse.json(
      { error: `Extension '${name}' already exists. Use --force to overwrite.` },
      { status: 409 },
    );
  }

  // 5. Generate template (8 files)
  const { files } = generateExtensionTemplate({ name, fields, force });

  // 6. Process (path guard + write + three-layer validate)
  try {
    const result = await processExtensionGeneration(
      files.map((f) => ({ path: f.path, content: f.content })),
      name,
      { force },
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Extension generation failed',
          details: result.errors ?? [],
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      extensionName: name,
      files: files.map((f) => f.path),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';