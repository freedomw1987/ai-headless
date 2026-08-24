/**
 * Sprint 10 Phase 2 — 反向驗證 Blog Extension
 *
 * 把 blog spec 編譯到 app/_compiled/blog/，
 * 與 Sprint 9 手寫的 app/api/blog/ + app/admin/blog/ diff 比對
 *
 * 注意：寫到 _compiled/ 而不是直接覆蓋，是為了不破壞 Sprint 9 現有檔案
 */

import path from 'node:path';
import { compileExtension } from '@/lib/compiler/compile';

async function main() {
  const root = process.cwd();
  const targetDir = path.join(root, 'app', '_compiled', 'blog');

  console.log('Compiling blog extension →', targetDir);
  console.log('');

  const result = await compileExtension({
    extensionName: 'blog',
    dryRun: false,
    outputBase: '_compiled',
  });

  console.log(`✓ Routes: ${result.routes.length}`);
  result.routes.forEach((r) =>
    console.log(`    ${r.method} ${r.path.replace(root + '/', '')}`),
  );

  console.log(`\n✓ Pages: ${result.pages.length}`);
  result.pages.forEach((p) =>
    console.log(`    ${p.kind} ${p.path.replace(root + '/', '')}`),
  );

  console.log(`\n✓ Total files written: ${result.writtenFiles.length}`);
  console.log('\n✅ Compiler wrote files. Now run `diff` against Sprint 9 hand-written files.');
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
