import { compileExtension } from '@/lib/compiler/compile';

async function main() {
  const r = await compileExtension({
    extensionName: 'order',
    dryRun: false,
    outputBase: '_compiled-test-order',
  });
  console.log('Files:', r.writtenFiles.length);
  for (const f of r.writtenFiles) console.log(' -', f.replace(process.cwd(), '.'));
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
