/**
 * Sprint 10 — Compiler Pipeline try-run
 */
import { compileExtension } from '@/lib/compiler/compile';

async function main() {
  console.log('Compiling blog extension (dry-run)...\n');

  const result = await compileExtension({
    extensionName: 'blog',
    dryRun: true,
  });

  console.log(`Routes: ${result.routes.length}`);
  result.routes.forEach((r) => console.log(`  ${r.method} ${r.path}`));

  console.log(`\nPages: ${result.pages.length}`);
  result.pages.forEach((p) => console.log(`  ${p.kind} ${p.path}`));

  console.log(`\nSchema code length: ${result.schemaCode.length} chars`);

  console.log('\n✅ Compiler pipeline works!');
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
